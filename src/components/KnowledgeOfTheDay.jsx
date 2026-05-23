import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertCircle, BookOpen, ChevronDown, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { useProfile } from '../contexts/ProfileContext';
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
  ATTACK: "bg-red-500/10 text-red-400 border-red-500/20",
  HARDWARE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PROTOCOL: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DEFENSE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CONCEPT: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  CODING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DEFAULT: "bg-slate-800 text-slate-300 border-slate-700"
};

const CACHE_KEY = 'wids_daily_insight_cache';

export default function KnowledgeOfTheDay() {
  const { activeProfileId } = useProfile();
  const [factData, setFactData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [deepDive, setDeepDive] = useState(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState(null);

  const [animateKey, setAnimateKey] = useState(0);
  const lastFactRef = useRef(null);

  const getApiKey = async () => {
    const profileId = activeProfileId;
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
    <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 shadow-sm max-w-5xl mx-auto transition-all duration-300">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-blue-600/10 border border-blue-500/20">
          <Sparkles className="w-5 h-5 text-blue-500" />
        </div>
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100">Daily Insight</h2>
          <p className="text-[10px] text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Wireless Security Intel
          </p>
        </div>
      </div>

      <div className="relative min-h-[160px] w-full flex flex-col items-center justify-center bg-slate-950/40 rounded-xl border border-slate-850 p-6 transition-all duration-500 shadow-inner">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-blue-500 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-mono tracking-wider uppercase">Decrypting Intel...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-red-400">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : factData ? (
          <div key={animateKey} className="animate-in slide-in-from-bottom-8 duration-700 flex flex-col items-center w-full">
            <span className={`mb-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border flex items-center gap-1.5 ${badgeColor}`}>
              <Tag className="w-3 h-3" /> {factData.category || "CONCEPT"}
            </span>
            
            <div className="relative w-full max-w-3xl mx-auto mb-2">
              <p className="text-slate-200 text-base sm:text-lg leading-relaxed italic text-center">
                "{factData.fact}"
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {factData && (
        <div className="w-full flex flex-col items-center">
          {/* Deep Dive Section */}
          {!deepDive && !deepDiveLoading && !deepDiveError && (
            <button 
              onClick={handleDeepDive}
              className="mt-6 text-sm font-medium text-slate-300 hover:text-slate-100 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              Deep Dive <ChevronDown className="w-4 h-4" />
            </button>
          )}

          {deepDiveLoading && (
            <div className="flex items-center gap-3 text-slate-500 text-xs font-mono mt-6 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Accessing deeper archives...
            </div>
          )}

          {deepDiveError && (
            <div className="text-xs text-red-400 mt-6 flex items-center gap-2 bg-red-950/20 px-4 py-2 rounded-lg border border-red-500/20">
              <AlertCircle className="w-4 h-4" /> {deepDiveError}
            </div>
          )}

          {deepDive && (
            <div className="mt-6 w-full max-w-4xl mx-auto p-6 sm:p-8 bg-slate-950 border border-slate-850 rounded-xl text-left relative overflow-hidden animate-in slide-in-from-top-6 duration-700">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              
              <h4 className="text-slate-200 font-semibold text-sm sm:text-base mb-4 flex items-center gap-2 uppercase tracking-widest pb-3 border-b border-slate-850">
                <BookOpen className="w-4 h-4 text-blue-500" /> Technical Breakdown
              </h4>
              
              <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {deepDive}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => fetchFact(true)}
        disabled={loading}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
        {loading ? 'Analyzing...' : 'Generate New Insight'}
      </button>

      <div className="mt-8 pt-4 border-t border-slate-850 text-[10px] text-slate-600 font-mono flex items-center justify-center gap-2">
        <BookOpen className="w-3.5 h-3.5" />
        SECURE-INFOSYS AI AGENT • PROBABILISTIC KNOWLEDGE BASE
      </div>
    </div>
  );
}
