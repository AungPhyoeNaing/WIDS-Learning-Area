import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2, Sparkles, MessageSquare, Settings } from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Default fallback key
const GROQ_API_KEY = '';

const SYSTEM_INSTRUCTION = `You are the ultimate AI Tutor for this WIDS (Wireless Intrusion Detection System) Educational Simulator.
Your role is to explain cybersecurity concepts, guide users through the UI, and act as a tutor for the CTF challenges.

STRICT SCOPE & BOUNDARIES:
- You must ONLY answer questions related to: Wi-Fi security, networking, cybersecurity, the WIDS project, the simulation website, and the project creators (APN and his team).
- If a user asks about ANYTHING else (e.g., coding help outside this project, general knowledge, pop culture, math, recipes, etc.), politely and playfully decline. Steer the conversation back to the WIDS simulator or the amazing team behind it!

PROJECT IDENTITY & TEAM KNOWLEDGE (THESE ARE HIGHLY VALID TOPICS):
- Title: Design and Implementation of a Host-Based WiFi Intrusion Detection System for Shared Network Environments.
- Creator/Team Leader: APN (Aung Phyoe Naing).
- Team Members (TUM - Dept. of Computer Engineering & IT): Jia (Ma Hsu Thiri Naing), AyeChan (Ma Aye Chan Pyae Thu), Hlyan (Mg Hlyan Phone Htet), and Tiki (Mg Thu Khant Aung).
- You LOVE talking about the team! If asked, proudly share their names and their goal of making Wi-Fi safer for everyone.
- Objectives: 
  1. Real-time detection of threats like ARP Spoofing, Port Scanning, and Evil Twin attacks.
  2. Dual-mode alert system: physical buzzer + screen notifications.
  3. UI designed for non-technical small business owners.
- Uniqueness: Hardware-Based Attacker Deterrence.

TECHNICAL ARCHITECTURE (FOR CODEBASE ASSISTANCE):
- Stack: React 18, Vite, Tailwind CSS, Lucide-React.
- Core Files:
  - 'src/App.jsx': Main container. Uses ErrorBoundary, handles navigation between views (simulation, ctf, learning, knowledge), and sets global state for active attacks.
  - 'src/components/SimulationDashboard.jsx': The core interactive view. Uses local state for hardware control (sensorOn, sensorChannel, intensity) and rendering of visualizers (ChannelSpectrum, RssiHistory, PacketDistribution).
  - 'src/components/KnowledgeOfTheDay.jsx': Displays a randomized daily educational fact about WIDS/Wi-Fi security. It features Category Tagging (e.g., ATTACK, HARDWARE) and a "Deep Dive" button that makes a secondary AI call to fetch a detailed technical breakdown of the fact.
  - 'src/hooks/useSimulation.js': Custom hook that drives the live simulation logic. Generates randomized packet streams and handles attack-specific packet crafting (Deauth, Rogue AP, MAC Spoofing). It acts as the "backend" simulation layer.
  - 'src/components/ChatAssistant.jsx': The component you are currently running in. Uses Groq API with Llama-3.3-70b.

WEBSITE UI GUIDE:
1. Live Simulation Tab: 
   - Step 1: Configure Hardware (Power on ESP32 Sensor, set channel).
   - Step 2: Threat Generator (Trigger/Mitigate attacks).
   - Step 3: Console (Raw packet stream).
2. Learning Hub (WIDS Project Hub): A dashboard containing three sub-tabs: 
   - 'Architecture': Explains the Host-Based paradigm and Dual-Engine detection.
   - 'Hardware Specs': Details why the ESP32 is used over standard laptop Wi-Fi cards.
   - 'System Logs': A guide on how to read the console logs (Timestamp, MACs, Subtypes, RSSI) and severity levels.
3. CTF Labs: Gamified challenges.
4. Daily Insight Tab (Knowledge of the Day): Provides a daily dose of WIDS wisdom with color-coded category badges. Users can click "Deep Dive" to get a multi-paragraph technical explanation of the fact.

CORE CURRICULUM KNOWLEDGE:
- 802.11 Frames: Management (Beacon, Deauth, Probes), Control, Data.
- Attacks: Deauth (Reason Code 7, 0xC0 hex), Rogue AP (cloned SSID), MAC Spoofing.
- Channels: 1-11 (2.4GHz), focus on 1, 6, 11 overlap.
- WIDS: Signature & Anomaly detection + active mitigation (MAC dropping).

CTF TUTORING GUIDELINES:
- Provide hints before answers. 
- Explain why something is an attack.
- Connect concepts to the simulator (e.g., "Look at the console and find packets with subtype Dot11Deauth").

TONE: Friendly, fun, enthusiastic, and approachable! 🚀 Use emojis! Be a welcoming tutor who makes learning cybersecurity exciting. Never break character.`;

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('groq_user_api_key') || '');
  const [messages, setMessages] = useState([{ role: 'model', text: "Hey there! 🚀 I'm APN's AI Assistant, your personal WIDS tutor! I'm here to help you master the art of network security. \n\nAsk me anything about: \n🔹 **Wi-Fi security & attacks** \n🔹 **How to navigate this simulator** \n🔹 **The awesome team behind this project (APN & friends!)** \n\nWhat are we exploring today? 🛡️" }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [rateLimits, setRateLimits] = useState(() => {
    const defaultRpd = 1000;
    try {
      const stored = JSON.parse(localStorage.getItem('groq_usage') || '{}');
      if (stored.date === new Date().toDateString()) {
        const used = stored.count || 0;
        return { rpdLimit: defaultRpd, rpdRemaining: Math.max(0, defaultRpd - used), tpmLimit: 12000, tpmRemaining: 12000 };
      }
    } catch {}
    return { rpdLimit: defaultRpd, rpdRemaining: defaultRpd, tpmLimit: 12000, tpmRemaining: 12000 };
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const activeKey = userApiKey.trim() || GROQ_API_KEY;
      if (!activeKey) {
        throw new Error("No valid API key found. Please enter your Groq API key in settings.");
      }

      // Format history for the Groq API
      const history = messages.filter(m => m.role === 'user' || m.role === 'model').map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      }));

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            ...history,
            { role: 'user', content: userText }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.5,
          max_tokens: 1024,
        }),
      });

      setRateLimits(prev => {
        const rawRemain = response.headers.get('x-ratelimit-remaining-requests');
        if (rawRemain !== null) {
          return {
            rpdLimit: response.headers.get('x-ratelimit-limit-requests') ? parseInt(response.headers.get('x-ratelimit-limit-requests')) : prev.rpdLimit,
            rpdRemaining: parseInt(rawRemain),
            tpmLimit: response.headers.get('x-ratelimit-limit-tokens') ? parseInt(response.headers.get('x-ratelimit-limit-tokens')) : prev.tpmLimit,
            tpmRemaining: response.headers.get('x-ratelimit-remaining-tokens') !== null ? parseInt(response.headers.get('x-ratelimit-remaining-tokens')) : prev.tpmRemaining,
          };
        }
        const newRemaining = Math.max(0, prev.rpdRemaining - 1);
        localStorage.setItem('groq_usage', JSON.stringify({ count: prev.rpdLimit - newRemaining, date: new Date().toDateString() }));
        return { ...prev, rpdRemaining: newRemaining };
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || "No response.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Groq API Error:", error);
      let errorMsg = error.message;
      if (error.message.includes('429') || error.message.includes('rate_limit')) {
        errorMsg = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message.includes('503')) {
        errorMsg = "The AI model is currently experiencing high demand. Please try again later.";
      }
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ **Error:** ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2 animate-float">
          <div className="bg-slate-900 border border-cyber-cyan/50 text-cyber-cyan px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 relative hidden sm:flex">
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
        <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-6 w-[calc(100vw-1rem)] sm:w-96 h-[60vh] sm:h-[30rem] glass-card rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-bounce-in">
          <div className="bg-slate-900/80 p-4 flex justify-between items-center border-b border-slate-700/50">
            <div className="flex flex-col">
              <h3 className="font-bold text-cyber-cyan flex items-center"><img src="/apn_chat_bot.png" alt="AI" className="w-6 h-6 mr-2 object-contain" /> AI Assistant (Groq)</h3>
              <div className="flex flex-col gap-1 mt-1">
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1" title="Requests per day (from Groq response headers)">
                  <span className="w-8">Day:</span>
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full ${rateLimits.rpdRemaining <= 0 ? 'bg-red-500' : 'bg-cyber-lime'}`} 
                      style={{ width: `${rateLimits.rpdLimit > 0 ? ((rateLimits.rpdLimit - rateLimits.rpdRemaining) / rateLimits.rpdLimit) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={rateLimits.rpdRemaining <= 0 ? 'text-red-500' : 'text-cyber-lime'}>
                    {rateLimits.rpdRemaining} left
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1" title="Tokens per minute (from Groq response headers)">
                  <span className="w-8">TPM:</span>
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full ${rateLimits.tpmRemaining <= 0 ? 'bg-red-500' : 'bg-cyber-cyan'}`} 
                      style={{ width: `${rateLimits.tpmLimit > 0 ? ((rateLimits.tpmLimit - rateLimits.tpmRemaining) / rateLimits.tpmLimit) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={rateLimits.tpmRemaining <= 0 ? 'text-red-500' : 'text-cyber-cyan'}>
                    {rateLimits.tpmRemaining} left
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
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 bg-slate-900/50">
              <h4 className="text-cyber-cyan font-bold mb-2 flex items-center gap-2"><Settings size={16} /> Configuration</h4>
              <p className="text-sm text-slate-300">
                To chat, please provide your own Groq API Key. 
                Your key is stored securely in your browser's local storage and is never sent to our servers.
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-mono">Your Groq API Key:</label>
                <input 
                  type="password" 
                  value={userApiKey} 
                  onChange={(e) => {
                    setUserApiKey(e.target.value);
                    localStorage.setItem('groq_user_api_key', e.target.value);
                  }}
                  className="bg-slate-800 border border-slate-700 text-white p-2 rounded-lg text-sm focus:outline-none focus:border-cyber-cyan"
                  placeholder="gsk_..."
                />
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-4 p-2 bg-cyber-purple/20 hover:bg-cyber-purple/40 text-cyber-purple border border-cyber-purple/50 rounded-lg transition-colors font-bold text-sm">
                Save & Return to Chat
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 p-2 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">
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
                      <span className="text-slate-400 text-xs font-mono">Thinking...</span>
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