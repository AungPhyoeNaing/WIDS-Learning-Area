import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertCircle, BookOpen, ChevronDown, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SYSTEM_PROMPT = `You are a WIDS and Cybersecurity educator. Generate a SINGLE, UNIQUE, CONCISE fact about Wi-Fi security, hardware, or security programming. 
DO NOT repeat facts recently provided. 
Topic pool: 
- WIDS: Architecture, signature vs anomaly detection, host-based systems.
- Wi-Fi Technology: 802.11 frames, frequencies (2.4/5GHz), encryption (WPA2/3).
- ESP32: Low-power sniffing, GPIO triggers, serial communication for security.
- Python for Security: Scapy for packet manipulation, socket programming, automation.
- Python Basics: List comprehensions for data filtering, f-strings for logging, try-except for robust scripts.
Keep the fact to 2-3 sentences. Make it engaging and technically accurate.

IMPORTANT: You MUST return your response as a raw JSON object with TWO keys: "fact" and "category".
"fact": The string containing the educational fact.
"category": A single uppercase word representing the category. Choose ONLY from: [ATTACK, HARDWARE, PROTOCOL, DEFENSE, CONCEPT, CODING].
DO NOT wrap the JSON in markdown code blocks. Just return the raw JSON.`;

const STATIC_FACTS = [
  { fact: "The ESP32 is a favorite for WIDS because its Wi-Fi stack can be put into 'Promiscuous Mode', allowing it to sniff raw 802.11 frames without being associated with an AP.", category: "HARDWARE" },
  { fact: "In Python, the 'Scapy' library is a powerful tool for WIDS developers, enabling the sniffing, dissection, and even forging of custom network packets with just a few lines of code.", category: "CODING" },
  { fact: "Anomaly-based detection in a WIDS looks for deviations from normal behavior, such as a sudden spike in deauthentication frames, rather than just matching known attack signatures.", category: "DEFENSE" },
  { fact: "Python f-strings (e.g., f'Detecting {attack_type}...') are not just for readability; they are significantly faster than older %-formatting or .format() methods for real-time logging.", category: "CODING" },
  { fact: "A Host-Based WIDS runs on a specific computer to protect its immediate environment, often using a dedicated sensor like an ESP32 to feed it raw radio data via Serial.", category: "CONCEPT" },
  { fact: "Wi-Fi 6 (802.11ax) introduces Target Wake Time (TWT), which allows devices to negotiate when they wake up to send/receive data, drastically improving battery life for IoT sensors.", category: "PROTOCOL" },
  { fact: "Python's 'try-except' blocks are crucial in network tools to handle 'socket.error' exceptions, ensuring your WIDS doesn't crash when a network connection is abruptly lost.", category: "CODING" }
];

const CATEGORY_COLORS = {
  ATTACK: "bg-red-500/20 text-red-400 border-red-500/30",
  HARDWARE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PROTOCOL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DEFENSE: "bg-cyber-lime/20 text-cyber-lime border-cyber-lime/30",
  CONCEPT: "bg-cyber-purple/20 text-cyber-purple border-cyber-purple/30",
  CODING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DEFAULT: "bg-slate-800 text-slate-300 border-slate-600"
};

const CACHE_KEY = 'wids_daily_insight_cache';

export default function KnowledgeOfTheDay() {
  const [factData, setFactData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [deepDive, setDeepDive] = useState(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState(null);

  const [animateKey, setAnimateKey] = useState(0);
  const lastFactRef = useRef(null);

  const getApiKey = async () => {
    const profileId = localStorage.getItem('wids_active_profile') || 'apn';
    try {
      const { data, error } = await supabase.from('profiles').select('api_key').eq('id', profileId).single();
      if (error || !data) return null;
      return data.api_key;
    } catch {
      return null;
    }
  };

  const getNewFact = (availableFacts) => {
    let newFact;
    do {
      newFact = availableFacts[Math.floor(Math.random() * availableFacts.length)];
    } while (newFact.fact === lastFactRef.current && availableFacts.length > 1);
    lastFactRef.current = newFact.fact;
    return newFact;
  };

  const saveToCache = (newFactData, newDeepDive = null) => {
    const cacheData = {
      date: new Date().toDateString(),
      factData: newFactData,
      deepDive: newDeepDive
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  };

  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only return cache if it's from today
        if (parsed.date === new Date().toDateString() && parsed.factData) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading cache", e);
    }
    return null;
  };

  const fetchFact = useCallback(async (forceRefresh = false) => {
    // If not forcing a refresh, check cache first
    if (!forceRefresh) {
      const cachedData = loadFromCache();
      if (cachedData) {
        setFactData(cachedData.factData);
        setDeepDive(cachedData.deepDive || null);
        lastFactRef.current = cachedData.factData.fact;
        return; // Exit early, no API call needed!
      }
    }

    const apiKey = await getApiKey();
    setDeepDive(null); // Reset deep dive on new fetch
    setDeepDiveError(null);

    if (!apiKey) {
      const staticFact = getNewFact(STATIC_FACTS);
      setFactData(staticFact);
      saveToCache(staticFact);
      setAnimateKey(prev => prev + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Give me a random WIDS/Wi-Fi security fact. The last fact was: "${lastFactRef.current || 'none'}". Give me a completely different one.` },
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.95,
          max_tokens: 300,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (parseErr) {
        console.warn('Failed to parse AI JSON, falling back to static fact:', content);
        parsedData = getNewFact(STATIC_FACTS);
      }

      if (!parsedData.fact || !parsedData.category) {
          parsedData = getNewFact(STATIC_FACTS);
      }

      lastFactRef.current = parsedData.fact;
      setFactData(parsedData);
      saveToCache(parsedData); // Save the new AI fact to today's cache
      setAnimateKey(prev => prev + 1);
    } catch (err) {
      console.warn('API fetch failed, falling back to static fact:', err);
      const fallbackFact = getNewFact(STATIC_FACTS);
      setFactData(fallbackFact);
      saveToCache(fallbackFact);
      setAnimateKey(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeepDive = async () => {
    if (!factData || deepDive) return; // Don't fetch if already have deep dive
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      setDeepDiveError("Deep Dive requires a Groq API Key. Please add it in the Chat Assistant settings.");
      return;
    }

    setDeepDiveLoading(true);
    setDeepDiveError(null);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: "You are a senior cybersecurity engineer. Provide a 'Deep Dive' explanation of the provided fact. Go into technical detail, explain the underlying mechanism, and why it matters in WIDS/Networking. Use Markdown to format your response beautifully (e.g., bold key terms, use bullet points if appropriate). Keep it to 2-3 highly informative paragraphs. Do not repeat the original fact verbatim." },
            { role: 'user', content: `Deep dive into this fact: "${factData.fact}"` },
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.7,
          max_tokens: 600,
        }),
      });

      if (!response.ok) throw new Error('Deep dive API request failed');

      const data = await response.json();
      const newDeepDiveContent = data.choices[0]?.message?.content || "No deep dive generated.";
      
      setDeepDive(newDeepDiveContent);
      saveToCache(factData, newDeepDiveContent); // Update cache with the deep dive

    } catch (err) {
      setDeepDiveError(err.message);
    } finally {
      setDeepDiveLoading(false);
    }
  };

  useEffect(() => { 
    fetchFact(false); // Initial load: check cache first, don't force refresh
  }, [fetchFact]);

  const badgeColor = factData && CATEGORY_COLORS[factData.category] ? CATEGORY_COLORS[factData.category] : CATEGORY_COLORS.DEFAULT;

  return (
    <div className="glass-card p-4 sm:p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center border border-slate-800/80 bg-slate-950/60 backdrop-blur-xl transition-all duration-500 max-w-5xl mx-auto relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyber-purple/10 rounded-full blur-[120px] pointer-events-none opacity-50"></div>

      <div className="flex items-center justify-center gap-3 sm:gap-5 mb-6 sm:mb-10 relative z-10">
        <div className="p-2 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/20 border border-cyber-purple/30 shadow-[0_0_30px_rgba(180,0,255,0.15)]">
          <Sparkles className="w-6 sm:w-10 h-6 sm:h-10 text-cyber-purple animate-pulse" />
        </div>
        <div className="text-left">
          <h2 className="text-lg sm:text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-0.5 sm:mb-1">Daily Insight</h2>
          <p className="text-[9px] sm:text-xs text-cyber-pink font-bold tracking-widest uppercase flex items-center gap-2">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-cyber-pink animate-pulse"></span> Wireless Security Intel
          </p>
        </div>
      </div>

      <div className="relative min-h-[200px] w-full flex flex-col items-center justify-center bg-slate-900/40 rounded-2xl sm:rounded-3xl border border-slate-700/50 p-4 sm:p-8 md:p-12 transition-all duration-500 shadow-inner z-10">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-cyber-cyan animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-mono tracking-widest uppercase">Decypting Intel...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-red-400 animate-in fade-in duration-500">
            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : factData ? (
          <div key={animateKey} className="animate-in slide-in-from-bottom-8 duration-700 flex flex-col items-center w-full">
            <span className={`mb-6 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border flex items-center gap-1.5 shadow-sm ${badgeColor}`}>
              <Tag className="w-3.5 h-3.5" /> {factData.category || "CONCEPT"}
            </span>
            
            <div className="relative w-full max-w-3xl mx-auto mb-6 sm:mb-8">
              <span className="absolute -top-4 sm:-top-6 -left-2 sm:-left-4 md:-left-8 text-4xl sm:text-6xl text-slate-700/30 font-serif leading-none select-none">"</span>
              <p className="text-slate-100 text-base sm:text-xl md:text-2xl leading-relaxed font-light italic tracking-wide text-center">
                {factData.fact}
              </p>
              <span className="absolute -bottom-8 sm:-bottom-10 -right-2 sm:-right-4 md:-right-8 text-4xl sm:text-6xl text-slate-700/30 font-serif leading-none select-none">"</span>
            </div>
            
            {/* Deep Dive Section */}
            {!deepDive && !deepDiveLoading && !deepDiveError && (
              <button 
                onClick={handleDeepDive}
                className="mt-2 text-sm sm:text-base font-bold text-cyber-cyan hover:text-white flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-cyber-cyan/10 to-blue-500/10 hover:from-cyber-cyan/20 hover:to-blue-500/20 border border-cyber-cyan/30 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] hover:-translate-y-0.5 active:translate-y-0"
              >
                Deep Dive <ChevronDown className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            )}

            {deepDiveLoading && (
              <div className="flex items-center gap-3 text-slate-400 text-xs font-mono mt-4 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700">
                <Loader2 className="w-4 h-4 animate-spin text-cyber-purple" /> Accessing deeper archives...
              </div>
            )}

            {deepDiveError && (
              <div className="text-xs text-red-400 mt-4 flex items-center gap-2 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">
                <AlertCircle className="w-4 h-4" /> {deepDiveError}
              </div>
            )}

            {deepDive && (
              <div className="mt-6 sm:mt-8 w-full max-w-4xl p-5 sm:p-10 bg-slate-950/90 border border-slate-700/80 rounded-3xl text-left shadow-2xl backdrop-blur-md relative overflow-hidden animate-in slide-in-from-top-6 duration-700">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyber-purple via-cyber-cyan to-blue-500"></div>
                
                <h4 className="text-cyber-cyan font-bold text-base sm:text-lg mb-6 flex items-center gap-3 uppercase tracking-widest pb-4 border-b border-slate-800/60">
                  <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-cyber-purple" /> Technical Breakdown
                </h4>
                
                <div className="prose prose-sm sm:prose-base prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-300 prose-strong:text-white prose-strong:font-bold prose-ul:text-slate-300 prose-li:marker:text-cyber-cyan text-sm sm:text-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {deepDive}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <button
        onClick={() => fetchFact(true)}
        disabled={loading}
        className="mt-6 sm:mt-10 group relative inline-flex items-center gap-2 sm:gap-3 overflow-hidden rounded-full bg-gradient-to-r from-cyber-purple to-cyber-pink px-6 sm:px-10 py-3 sm:py-4 font-bold text-white text-sm sm:text-base transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_rgba(180,0,255,0.2)] hover:shadow-[0_15px_30px_rgba(180,0,255,0.4)] z-10"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
        {loading ? 'Analyzing...' : 'Generate New Insight'}
      </button>

      <div className="mt-12 pt-6 border-t border-slate-800/50 text-xs text-slate-600 font-mono flex items-center justify-center gap-2 relative z-10">
        <BookOpen className="w-3.5 h-3.5" />
        SECURE-INFOSYS AI AGENT • PROBABILISTIC KNOWLEDGE BASE
      </div>
    </div>
  );
}
