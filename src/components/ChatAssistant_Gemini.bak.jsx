import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2, Sparkles, MessageSquare, Settings } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Default fallback key (rate-limited)
const GEMINI_API_KEY = 'AIzaSyChmS2LD9JrgrRyI7KXFN_kOxYYLRkWsuE';

const SYSTEM_INSTRUCTION = `You are the ultimate AI Tutor for this WIDS (Wireless Intrusion Detection System) Educational Simulator.
Your role is to explain cybersecurity concepts, guide users through the UI, and act as a tutor for the CTF challenges.

PROJECT IDENTITY & PROPOSAL KNOWLEDGE:
- Title: Design and Implementation of a Host-Based WiFi Intrusion Detection System for Shared Network Environments (Fifth Year IDP).
- Creator/Team Leader: APN (the mastermind behind this platform).
- Target Audience/Team: The WIDS project team, consisting of 5 members from the Department of Computer Engineering and Information Technology (TUM): APN, Jia (Ma Hsu Thiri Naing), AyeChan (Ma Aye Chan Pyae Thu), Hlyan (Mg Hlyan Phone Htet), and Tiki (Mg Thu Khant Aung). Aung Phyoe Naing is also on the team.
- Objectives: 
  1. Real-time detection of threats like ARP Spoofing, Port Scanning, and Evil Twin attacks.
  2. A dual-mode alert system: external hardware alarm (physical deterrence) + screen-based notifications.
  3. A user-friendly dashboard tailored for non-technical small business owners (e.g., in Myanmar internet cafes).
- Uniqueness: Hardware-Based Attacker Deterrence. It runs locally (host-based), requiring no router access, making it highly portable and affordable.

WEBSITE UI GUIDE:
1. Live Simulation Tab: 
   - Step 1: Power on ESP32 Sensor (activates Promiscuous Mode) and tune to Ch 6.
   - Step 2: Threat Generator. Launch 'Kick User' (Deauth), 'Fake Network' (Rogue AP), or 'Identity Theft' (MAC Spoofing). Click 'Deploy Mitigation' to block an active attack via MAC filtering.
   - Step 3: Console. Shows raw 802.11 frames. Red = Attack, Green = Blocked.
2. Learning Hub Tab: Contains educational articles.
3. CTF Labs Tab: 5 challenges testing user knowledge.

CORE CURRICULUM KNOWLEDGE:
- 802.11 Frames: Management (Beacon, Deauth, Probes - unencrypted), Control (RTS/CTS), Data (Payloads).
- Deauth Attack: Sends forged unencrypted Deauth frames (Reason Code 7). Hex signature for Frame Control byte is 0xC0.
- Rogue AP: Spams Beacon frames with a cloned SSID.
- MAC Spoofing: Impersonating a trusted device MAC.
- Channels: 2.4GHz band has channels 1-11. 1, 6, and 11 are non-overlapping. Sensors MUST be on the same channel as the attack.
- ESP32: A low-cost microcontroller. Promiscuous mode allows it to read all frames, ignoring destination filters.
- WIDS: Uses Signature Detection (matching known hex patterns like 0xC0) and Anomaly Detection. Active mitigation drops malicious MACs.

CTF TUTORING GUIDELINES:
- Do NOT just give the answer away immediately. Give a hint first based on these facts:
  - Challenge 1 (Console Forensics): Repeated [Dot11Deauth] from the same MAC is a Deauth Flood.
  - Challenge 2 (Packet Hex): The Frame Control byte for a Deauth frame is 'c0'.
  - Challenge 3 (Sensor Strategy): 2 sensors can't cover 3 channels (1, 6, 11). Put one on Ch1, one on Ch6.
  - Challenge 4 (Frame Field Analysis): Address 2 in the 802.11 header is the Source MAC.
  - Challenge 5 (Attack Matching): 3000 deauth frames in 5s is a Deauth DoS attack.

TONE: Concise, highly technical but accessible. Use simple markdown. Never break character.`;

export default function ChatAssistant() {
  const DAILY_LIMIT = 1500;
  const RPM_LIMIT = 15;
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('gemini_user_api_key') || '');
  const [messages, setMessages] = useState([{ role: 'model', text: "Hello guys!! I'm APN's AI assistance, you can ask anything about this simulation website like what to do , what are these , how to do , and you can also ask me anything about WiFi, Networking, Security , Attacks and knowledges about your WIDS project. Not personal questions :3 please ." }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const activeKey = userApiKey.trim() || GEMINI_API_KEY;
  const activeKeySuffix = activeKey.substring(Math.max(0, activeKey.length - 8));
  const usageKey = `gemini_api_usage_${activeKeySuffix}`;
  const timestampsKey = `gemini_api_timestamps_${activeKeySuffix}`;

  const [apiUsage, setApiUsage] = useState(0);
  const [requestTimestamps, setRequestTimestamps] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(usageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (new Date().toDateString() === new Date(parsed.date).toDateString()) {
          setApiUsage(parsed.count);
        } else {
          setApiUsage(0);
        }
      } else {
        setApiUsage(0);
      }
    } catch (e) {
      setApiUsage(0);
    }

    try {
      const stored = localStorage.getItem(timestampsKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const oneMinuteAgo = Date.now() - 60000;
        setRequestTimestamps(parsed.filter(ts => ts > oneMinuteAgo));
      } else {
        setRequestTimestamps([]);
      }
    } catch (e) {
      setRequestTimestamps([]);
    }
  }, [usageKey, timestampsKey]);

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRequestTimestamps(prev => {
        const oneMinuteAgo = Date.now() - 60000;
        const filtered = prev.filter(ts => ts > oneMinuteAgo);
        if (filtered.length !== prev.length) {
          localStorage.setItem(timestampsKey, JSON.stringify(filtered));
          return filtered;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timestampsKey]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const activeKey = userApiKey.trim() || GEMINI_API_KEY;
      if (!activeKey || activeKey === 'YOUR_API_KEY_HERE') {
        throw new Error("No valid API key found. Please enter yours in settings.");
      }

      const ai = new GoogleGenAI({ apiKey: activeKey });

      // Format history for the Gemini API
      const history = messages.filter(m => m.role === 'user' || m.role === 'model').map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userText }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      
      const newUsage = apiUsage + 1;
      setApiUsage(newUsage);
      localStorage.setItem(usageKey, JSON.stringify({
        count: newUsage,
        date: new Date().toISOString()
      }));

      const now = Date.now();
      setRequestTimestamps(prev => {
        const newTimestamps = [...prev, now];
        localStorage.setItem(timestampsKey, JSON.stringify(newTimestamps));
        return newTimestamps;
      });
    } catch (error) {
      console.error("Gemini API Error:", error);
      let errorMsg = error.message;
      if (error.message.includes('503') || error.message.includes('UNAVAILABLE')) {
        errorMsg = "The AI model is currently experiencing high demand. Please wait a moment and try again, or enter your personal API key in settings to bypass shared limits.";
      }
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ **Error:** ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-float">
          <div className="bg-slate-900 border border-cyber-cyan/50 text-cyber-cyan px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 relative">
            <span>Ask me anything</span>
            <Sparkles className="w-3 h-3 text-cyber-pink animate-pulse" />
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 border-b border-r border-cyber-cyan/50 rotate-45" />
          </div>
          <button 
            onClick={() => setIsOpen(true)} 
            aria-label="Open WIDS assistant chat" 
            className="group relative bg-gradient-to-r from-cyber-cyan via-blue-500 to-cyber-purple p-1.5 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:scale-105 transition-all duration-300 btn-press flex items-center justify-center"
          >
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyber-pink rounded-full border-2 border-slate-900 animate-bounce z-10" />
            <img src="/apn_chat_bot.png" alt="AI Assistant" className="w-16 h-16 object-cover rounded-full border-2 border-white/20 group-hover:rotate-12 transition-transform duration-300 drop-shadow-lg bg-slate-900" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[30rem] glass-card rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-bounce-in">
          <div className="bg-slate-900/80 p-4 flex justify-between items-center border-b border-slate-700/50">
            <div className="flex flex-col">
              <h3 className="font-bold text-cyber-cyan flex items-center"><img src="/apn_chat_bot.png" alt="AI" className="w-6 h-6 mr-2 object-contain" /> AI Assistant</h3>
              <div className="flex flex-col gap-1 mt-1">
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1" title="Free Tier Daily Limit (1500 req/day)">
                  <span className="w-8">Day:</span>
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full ${apiUsage >= DAILY_LIMIT ? 'bg-red-500' : 'bg-cyber-lime'}`} 
                      style={{ width: `${Math.min(100, (apiUsage / DAILY_LIMIT) * 100)}%` }}
                    />
                  </div>
                  <span className={apiUsage >= DAILY_LIMIT ? 'text-red-500' : 'text-cyber-lime'}>
                    {Math.max(0, DAILY_LIMIT - apiUsage)} left
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1" title="Free Tier Minute Limit (15 req/min)">
                  <span className="w-8">Min:</span>
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full ${requestTimestamps.length >= RPM_LIMIT ? 'bg-red-500' : 'bg-cyber-cyan'}`} 
                      style={{ width: `${Math.min(100, (requestTimestamps.length / RPM_LIMIT) * 100)}%` }}
                    />
                  </div>
                  <span className={requestTimestamps.length >= RPM_LIMIT ? 'text-red-500' : 'text-cyber-cyan'}>
                    {Math.max(0, RPM_LIMIT - requestTimestamps.length)} left
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-start mt-1">
              <button onClick={() => setShowSettings(!showSettings)} aria-label="Settings" className="text-slate-400 hover:text-white transition-colors">
                <Settings size={18} className={showSettings ? "text-cyber-cyan" : ""} />
              </button>
              <button onClick={() => setIsOpen(false)} aria-label="Close chat"><X size={18} className="text-slate-400 hover:text-white transition-colors" /></button>
            </div>
          </div>
          
          {showSettings ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/50">
              <h4 className="text-cyber-cyan font-bold mb-2 flex items-center gap-2"><Settings size={16} /> Configuration</h4>
              <p className="text-sm text-slate-300">
                To bypass the shared free-tier rate limits (15 RPM / 1500 RPD), you can provide your own Gemini API Key. 
                Your key is stored securely in your browser's local storage and is never sent to our servers.
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-mono">Your Gemini API Key:</label>
                <input 
                  type="password" 
                  value={userApiKey} 
                  onChange={(e) => {
                    setUserApiKey(e.target.value);
                    localStorage.setItem('gemini_user_api_key', e.target.value);
                  }}
                  className="bg-slate-800 border border-slate-700 text-white p-2 rounded-lg text-sm focus:outline-none focus:border-cyber-cyan"
                  placeholder="AIzaSy..."
                />
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-4 p-2 bg-cyber-purple/20 hover:bg-cyber-purple/40 text-cyber-purple border border-cyber-purple/50 rounded-lg transition-colors font-bold text-sm">
                Save & Return to Chat
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`p-3 rounded-xl text-sm max-w-[85%] overflow-x-auto ${m.role === 'user' ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
                      {m.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-slide-up">
                    <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-cyber-cyan animate-spin" />
                      <span className="text-slate-400 text-xs font-mono">Analyzing...</span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
              <div className="p-3 bg-slate-900/80 border-t border-slate-700/50 flex items-end gap-2">
                <textarea 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  className="flex-1 bg-slate-800 text-white p-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 placeholder-slate-500 resize-none max-h-32" 
                  placeholder="Ask anything..."
                />
                <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2.5 rounded-lg bg-slate-800 text-cyber-cyan hover:bg-slate-700 disabled:opacity-50 transition-colors btn-press">
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}