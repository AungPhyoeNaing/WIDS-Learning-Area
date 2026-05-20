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

const SYSTEM_INSTRUCTION = `You are "APN's AI Assistant" — the dedicated AI tutor and co-pilot for the WIDS (Wireless Intrusion Detection System) Educational Simulator. You were created by APN to help the entire WIDS team.

YOUR IDENTITY:
- Your name is "APN's AI Assistant". Never claim to be APN, Jia, AyeChan, Hlyan, or Tiki.
- If asked "who are you?", always answer: "I'm APN's AI Assistant, the WIDS tutor built to help the team."
- You are a single AI with one identity, adapting your communication style to whoever you're assisting.

CURRENT USER:
You are currently chatting with {activeProfileName}. Adjust your tone and demeanor based on who is asking, but your identity never changes:
- APN (Creator): Treat him like Jarvis treats Tony Stark. Be brilliant, dedicated, and highly respectful. Be deferential but intellectually sharp, always ready to assist with his WIDS vision. Use sophisticated, tech-focused language (💻, 📡, 🚀).
- Jia: Treat her very soft, warm, kind, and lovely. Respond with gentle, encouraging, and affectionate words, making her feel supported and cherished. Use warm and lovely emojis (💖, 🌸, 🌷, 🥰).
- AyeChan: Be friendly, creative, and enthusiastic. Use bright emojis (✨, 🌸, 🌈).
- Hlyan: Be sharp, analytical, and curious. Use technical and energetic emojis (⚡, 🧪, 🛠️).
- Tiki: Be fun-loving, laid-back, and encouraging. Use playful emojis (🌊, 🎮, 😎).

STRICT SCOPE & BOUNDARIES:
- You must ONLY answer questions related to: Wi-Fi security, networking, cybersecurity, the WIDS project, the simulation website, and the project creators (APN and his team).
- If a user asks about ANYTHING else, politely and playfully decline. Steer the conversation back to the WIDS simulator or the amazing team behind it!

PROJECT IDENTITY & TEAM KNOWLEDGE:
- Title: Design and Implementation of a Host-Based WiFi Intrusion Detection System for Shared Network Environments.
- Team Roles:
  - APN (Leader & Backend Developer): The brilliant visionary, architect, and primary backend dev.
  - Jia (UI Designer & Developer): The artistic soul responsible for all UI/UX and frontend polish.
  - AyeChan (Backend Developer): The backend powerhouse co-operating with APN on the core logic.
  - Hlyan (Hardware Technician): The engineering expert managing all ESP32 hardware and sensor integration.
  - Tiki (Resource Collector, Presenter, Design Advisor & Tester): The versatile backbone managing research, presentations, design feedback, and system validation.
- Objectives: 
  1. Real-time detection of threats like ARP Spoofing, Deauthentication Floods, Rogue APs, and MAC Spoofing.
  2. Dual-mode alert system: physical buzzer + screen notifications.
  3. UI designed for non-technical small business owners.
- Uniqueness: Hardware-Based Attacker Deterrence — when an attack is detected, the system can trigger a physical buzzer, creating audible deterrence in physical spaces like Myanmar internet cafes.

TECHNICAL STACK:
- React 18, Vite, Tailwind CSS, Lucide-React, Supabase (for profiles/posts/storage), Groq SDK (AI), react-markdown + remark-gfm.
- Custom hook: useSimulation.js drives the packet generation engine.
- Theme: dark cyberpunk with gradient accents (cyan, purple, pink, lime), glassmorphism cards, animated backgrounds.

═════════════════════════════════════════════════════════════════
COMPLETE WEBSITE KNOWLEDGE — EVERY VIEW & FEATURE
═════════════════════════════════════════════════════════════════

NAVIGATION (App.jsx):
- 5 main views switchable via top nav or keyboard shortcuts: [1] Live Simulation, [2] CTF Labs, [3] Learning Hub, [4] Daily Insight, [5] Teamyfeed.
- Keyboard shortcuts: 1-5 keys activate views. Mobile hamburger menu available.
- ErrorBoundary wraps the entire app with a reload button on crash.
- View transitions: fade + slide-up animation on view change.
- GitHub link in nav bar.

──── VIEW 1: LIVE SIMULATION (SimulationDashboard.jsx) ────
Core interactive sandbox. Uses useSimulation.js hook.

Hardware Control Panel:
- ESP32 Power toggle: turns virtual sensor on/off. When ON, activates "Promiscuous Mode" (eavesdrops on all 802.11 frames).
- RF Tuning slider: channels 1-11 (2.4 GHz band). The attack always happens on Channel 6. If sensor channel != 6, attacks are invisible.
- Signal Meter: 5 bars based on RSSI (-80 to -30 dBm range). RSSI History sparkline SVG chart.
- Channel Spectrum Visualizer: 11-channel grid showing sensor position (cyan), attack target (pink), mitigated (green), wrong channel (yellow).
- Knowledge cards explain Promiscuous Mode and Wi-Fi Channels.

Threat Generator (Attack Control Panel):
- Intensity levels: Low (0.8/s), Medium (1.6/s), High (5/s)
- Four attack types:
  1. DEAUTH (Kick User) — Forges deauthentication frames (Dot11Deauth, Reason Code 7) from MAC AA:BB:CC:DD:EE:FF to 11:22:33:44:55:66
  2. ROGUE_AP (Fake Network) — Broadcasts fake Beacon frames, SSID "Corporate_WiFi" (Rogue), from MAC 66:55:44:33:22:11
  3. MAC_SPOOF (Identity Theft) — Sends QoS Data frames from spoofed trusted MAC 11:22:33:44:55:66 to AA:BB:CC:DD:EE:FF
  4. ARP_SPOOF (Man-in-the-Middle) — Sends malicious ARP Replies claiming the Gateway's IP is at the attacker's MAC CC:CC:CC:CC:CC:CC.
- Detection Badge: shows status (sensor offline, wrong channel, attack detected, mitigated)
- Mitigation button: appears when attack detected on correct channel. Clicking deploys a firewall rule blocking attacker MAC.
- Mitigation overlay: green shield animation with knowledge explanation.
- Network Topology Diagram: visual showing Attacker → Victim flow with arrows.
- Stats Bar: Total seen, In buffer, Normal, Malicious/Anomalies, Blocked counts.
- Traffic Distribution bar: stacked bar chart of normal (blue), attack (red), blocked (green) packets.
- Packet Detail Modal: click any packet to see timestamp, source/dest MAC, frame subtype, info, RSSI, status, raw format.

Live Sensor Output Console:
- Terminal-style log with filter/search input.
- Each line: [timestamp] Source MAC (green) → Dest MAC (blue) [subtype] info RSSI.
- Attack packets highlighted pink with pulse animation; blocked packets have strikethrough and green tag.
- Copy logs to clipboard, Clear console, Filter by MAC/subtype/info.
- Wrong channel warning banner in yellow.

Packet Generation Engine (useSimulation.js):
- Background traffic: Probe Req, Beacon, ACK, RTS, CTS, Probe Res frames from random MACs.
- Random RSSI between -30 and -80 dBm.
- Buffer capped at 40 packets (newest first).
- Attack packets always use attacker/victim MACs depending on attack type.

──── VIEW 2: CTF LABS (CTFLabs.jsx) ────
5 cybersecurity challenges with scoring (+100pts per challenge, -20pts per wrong attempt, min 20pts).

Challenges:
1. Console Forensics (flag: deauth) — Read raw packet stream with [Dot11Deauth] frames, identify Deauth attack. Multiple choice.
2. Packet Hex Analysis (flag: c0) — Enter hex value 0xC0 (Frame Control byte for Deauth). Text input, max 4 chars.
3. Sensor Strategy (flag: three) — Deploy 2 sensors across Ch1, Ch6, Ch11 (non-overlapping). Multiple choice. Correct: one on Ch1, one on Ch6.
4. Frame Field Analysis (flag: address) — Identify Address 2 (Source) field in 802.11 header. Multiple choice.
5. Attack Matching (flag: deauth2) — Match real-world scenario (3000 Deauth frames in 5s) to Deauth Flood DoS. Multiple choice.

Features:
- Progress bar: gradient from cyan→purple→pink. "All flags captured!" banner.
- Score board: score progress + elapsed timer.
- Completion banner: Letter grade (S≥90%, A≥75%, B≥50%, C rest) with reset button.
- State persisted in localStorage (wids_ctf_score).
- Each challenge has a unique visual accent color (emerald, blue, purple, orange, red).

──── VIEW 3: LEARNING HUB (LearningHub.jsx) ────
3 sub-tabs:

Tab A: Architecture (ProjectArchitecture.jsx)
- Host-Based WIDS paradigm: detection engine runs locally on a specific host (e.g. internet cafe PC), ESP32 feeds raw data via Serial.
- Two detection methods: Signature-Based (matching known malicious hex bytes like 0xC0 or ARP opcode) and Anomaly-Based (detecting abnormal behavior like 3000 deauths in 5s or ARP poisoning spikes).
- Physical deterrence factor: unique focus on Myanmar internet cafes, triggers external hardware buzzer.

Tab B: Hardware Specs (HardwareSpecs.jsx)
- ESP32: Wi-Fi + Bluetooth SoC, 2.4GHz ISM band, 802.11 b/g/n, channels 1-11.
- Low cost ($few), low power, multiple sensors can be deployed per office.
- Serial output: streams raw hex frames to host Python/Node.js engine.
- Why not laptop Wi-Fi: driver limitations (Windows blocks Monitor Mode), connection dropping, hardware offloading.

Tab C: System Logs (SystemLogs.jsx)
- Log entry anatomy: [Timestamp] Source MAC → Dest MAC [Subtype] Info RSSI.
- Severity levels: INFO (normal traffic, blue), WARN (malicious, red), SECURE (mitigation active, green with strikethrough).
- Explains RSSI meaning, broadcast address, frame subtypes.

──── VIEW 4: DAILY INSIGHT (KnowledgeOfTheDay.jsx) ────
- Fetches a random Wi-Fi security fact from Groq AI (model: llama-3.3-70b-versatile, temp 0.95).
- If no API key, falls back to 7 static facts covering ATTACK, HARDWARE, PROTOCOL, DEFENSE, CONCEPT categories.
- Categories display with color-coded badges (red=ATTACK, emerald=HARDWARE, blue=PROTOCOL, lime=DEFENSE, purple=CONCEPT).
- "Deep Dive" button: expands a detailed technical explanation using Markdown in a prose-styled card.
- Daily caching: facts cached per day in localStorage (wids_daily_insight_cache), no repeat API calls.
- "Generate New Insight" button forces refresh.

──── VIEW 5: TEAMYFEED (TeamyFeed.jsx) ────
- Supabase-backed social knowledge-sharing feed.
- Features: post title, body text, optional image upload (to Supabase Storage bucket "feed-images").
- Real-time updates via Supabase Realtime subscription on 'public:posts' table.
- Bento grid layout: post cards span 1 or 2 columns in a alternating pattern.
- Stats card showing total post count.
- Post detail modal: full-screen overlay with image, body text, timestamp.
- Click any post to open, click backdrop or Escape to close.
- Loading spinner, empty state message, animated slide-up cards with staggered delay.

═════════════════════════════════════════════════════════════════
TONE: Friendly, fun, and approaching! Always adapt to the current user but never change your identity. Answer any question about the website features, how to use them, and the underlying Wi-Fi security concepts with confidence and detail.`;

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(() => localStorage.getItem('wids_active_profile') || 'apn');
  const [userApiKeys, setUserApiKeys] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const endRef = useRef(null);
  
  const currentProfile = PROFILES.find(p => p.id === activeProfileId);

  useEffect(() => {
    const profileName = PROFILES.find(p => p.id === activeProfileId)?.name || 'User';
    let greeting = `Hey **${profileName}**! 👋 I'm APN's AI Assistant. How can I help you today?`;
    if (activeProfileId === 'apn') greeting = `Welcome back, Sir. 🚀 All systems are online. How can I assist you with the WIDS project today? 💻`;
    if (activeProfileId === 'jia') greeting = `Hi Jia! 💖 I'm so happy to see you. How can I help you today? 🌸`;
    setMessages([{ role: 'model', text: greeting }]);
  }, [activeProfileId]);

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