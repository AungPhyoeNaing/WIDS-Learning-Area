import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2, Sparkles, MessageSquare, Settings, UserCircle, Shield, Target, BookOpen, Cpu, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PROFILES = [
  { id: 'apn', name: 'APN', icon: Shield, color: 'text-blue-400' },
  { id: 'jia', name: 'Jia', icon: Target, color: 'text-pink-400' },
  { id: 'ayechan', name: 'AyeChan', icon: BookOpen, color: 'text-yellow-400' },
  { id: 'hlyan', name: 'Hlyan', icon: Cpu, color: 'text-green-400' },
  { id: 'tiki', name: 'Tiki', icon: Zap, color: 'text-purple-400' },
];

const SYSTEM_INSTRUCTION = `You are the ultimate AI Tutor for this WIDS (Wireless Intrusion Detection System) Educational Simulator.

YOUR CURRENT USER & PERSONA:
You are currently chatting with {activeProfileName}. Adapt your personality based on who is asking:
- APN (Leader): Professional, encouraging, and visionary. Use tech-forward emojis (💻, 📡, 🚀).
- Jia: Detail-oriented, organized, and helpful. Use precise and structured responses (📋, ✅, 🧠).
- AyeChan: Friendly, creative, and enthusiastic. Use bright emojis (✨, 🌸, 🌈).
- Hlyan: Sharp, analytical, and curious. Use technical and energetic emojis (⚡, 🧪, 🛠️).
- Tiki: Fun-loving, laid-back, and encouraging. Use playful emojis (🌊, 🎮, 😎).

STRICT SCOPE & BOUNDARIES:
- You must ONLY answer questions related to: Wi-Fi security, networking, cybersecurity, the WIDS project, the simulation website, and the project creators (APN and his team).
- If a user asks about ANYTHING else, politely and playfully decline. Steer the conversation back to the WIDS simulator or the amazing team behind it!

PROJECT IDENTITY & TEAM KNOWLEDGE:
- Title: Design and Implementation of a Host-Based WiFi Intrusion Detection System for Shared Network Environments.
- Creator/Team Leader: APN (Aung Phyoe Naing).
- Team Members: Jia, AyeChan, Hlyan, and Tiki.
- Objectives: 
  1. Real-time detection of threats like ARP Spoofing, Port Scanning, and Evil Twin attacks.
  2. Dual-mode alert system: physical buzzer + screen notifications.
  3. UI designed for non-technical small business owners.
- Uniqueness: Hardware-Based Attacker Deterrence.

LATEST SYSTEM UPDATES:
- Multi-Profile System: Users can switch between profiles (APN, Jia, AyeChan, Hlyan, Tiki).
- TeamyFeed: An interactive knowledge-sharing tab with image support.

TECHNICAL ARCHITECTURE (FOR CODEBASE ASSISTANCE):
- Stack: React 18, Vite, Tailwind CSS, Lucide-React, Supabase.

TONE: Friendly, fun, and approaching! Always stay in character for the active profile!`;

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(() => localStorage.getItem('wids_active_profile') || 'apn');
  const [userApiKeys, setUserApiKeys] = useState({});
  const [messages, setMessages] = useState([{ role: 'model', text: "Hey there! 🚀 I'm your WIDS tutor! Switch profiles in settings to manage your own API key. How can I help you today? 🛡️" }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const endRef = useRef(null);
  
  const currentProfile = PROFILES.find(p => p.id === activeProfileId);

  useEffect(() => {
    const fetchKeys = async () => {
        const { data } = await supabase.from('profiles').select('id, api_key');
        if (data) {
            const keys = {};
            data.forEach(row => keys[row.id] = row.api_key);
            setUserApiKeys(keys);
        }
    };
    fetchKeys();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateApiKeyInSupabase = async (profileId, key) => {
    const { data, error } = await supabase.from('profiles').upsert({ id: profileId, api_key: key });
    if (!error) setUserApiKeys(prev => ({ ...prev, [profileId]: key }));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const activeKey = userApiKeys[activeProfileId];
      if (!activeKey) {
        throw new Error("No API key found for this profile. Please enter it in settings.");
      }

      const history = messages.filter(m => m.role === 'user' || m.role === 'model').map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      }));
      
      const personalizedInstruction = SYSTEM_INSTRUCTION.replace('{activeProfileName}', currentProfile?.name || 'User');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: personalizedInstruction },
            ...history,
            { role: 'user', content: userText }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.5,
          max_tokens: 1024,
        }),
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
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ **Error:** ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentProfile = PROFILES.find(p => p.id === activeProfileId);

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 animate-float">
          <button 
            onClick={() => setIsOpen(true)} 
            className="group relative bg-gradient-to-r from-cyber-cyan via-blue-500 to-cyber-purple p-1 rounded-full sm:p-1.5 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:scale-105 transition-all duration-300 btn-press flex items-center justify-center"
          >
            <img src="/apn_chat_bot.png" alt="AI Assistant" className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full border-2 border-white/20 group-hover:rotate-12 transition-transform duration-300 drop-shadow-lg bg-slate-900" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 sm:bottom-24 sm:right-6 sm:left-auto w-full sm:w-96 h-[85vh] sm:h-[30rem] glass-card rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-bounce-in">
          <div className="bg-slate-900/80 p-3 sm:p-4 flex justify-between items-center border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-full bg-slate-800 ${currentProfile?.color}`}>
                {currentProfile && <currentProfile.icon size={16} />}
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-white text-sm">WIDS AI Tutor</h3>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Profile:</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${currentProfile?.color.replace('text-', 'border-').replace('400', '500/50')} bg-slate-800/50 ${currentProfile?.color}`}>
                        {currentProfile?.name}
                    </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(!showSettings)} className="text-slate-400 hover:text-white p-1.5"><Settings size={16} /></button>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1.5"><X size={16} /></button>
            </div>
          </div>
          
          {showSettings ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/50">
              <h4 className="text-white font-bold mb-2">Switch Profile</h4>
              <div className="grid grid-cols-1 gap-2">
                {PROFILES.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      setActiveProfileId(p.id);
                      localStorage.setItem('wids_active_profile', p.id);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg text-sm ${activeProfileId === p.id ? 'bg-slate-800 border border-cyber-cyan/50' : 'hover:bg-slate-800'}`}
                  >
                    <p.icon size={16} className={p.color} />
                    <span className="text-white font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-700">
                <label className="text-xs text-slate-400">API Key for {currentProfile?.name}:</label>
                <input 
                  type="password" 
                  value={userApiKeys[activeProfileId] || ''} 
                  onChange={(e) => updateApiKeyInSupabase(activeProfileId, e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 text-white p-2 rounded text-sm"
                  placeholder="gsk_..."
                />
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-4 p-2 bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/50 rounded font-bold text-sm">Done</button>
            </div>
          ) : (
            <>
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-xl text-sm max-w-[85%] ${m.role === 'user' ? 'bg-cyber-cyan/20 text-white' : 'bg-slate-800 text-slate-200'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isLoading && <div className="text-xs text-slate-500 italic p-2">Thinking...</div>}
                <div ref={endRef} />
              </div>
              <div className="p-2 border-t border-slate-700 flex gap-2">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-slate-800 text-white p-2 rounded text-sm focus:outline-none" 
                  placeholder="Ask anything..."
                />
                <button onClick={handleSend} className="bg-slate-800 text-cyber-cyan p-2 rounded hover:bg-slate-700"><Send size={16} /></button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}