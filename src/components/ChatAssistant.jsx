import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Loader2, Settings, UserCircle, Shield, Target, BookOpen, Cpu, Zap, Trash2, Copy, Check, RotateCcw, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Profiles ──────────────────────────────────────────────────
const PROFILES = [
  { id: 'apn',      name: 'APN',      icon: Shield,   color: 'text-blue-400' },
  { id: 'jia',      name: 'Jia',      icon: Target,   color: 'text-pink-400' },
  { id: 'ayechan',  name: 'AyeChan',  icon: BookOpen, color: 'text-yellow-400' },
  { id: 'hlyan',    name: 'Hlyan',    icon: Cpu,      color: 'text-green-400' },
  { id: 'tiki',     name: 'Tiki',     icon: Zap,      color: 'text-purple-400' },
];

// ─── Quick-prompt chips (customized per persona) ───────────────
const QUICK_PROMPTS = {
  apn: [
    { label: '📡 Sim architecture', text: 'Walk me through the full architecture of the WIDS simulator we built.' },
    { label: '⚡ useSimulation hook', text: 'Explain how the useSimulation.js packet engine works internally.' },
    { label: '🔴 ARP Spoof deep-dive', text: 'Give me a deep technical breakdown of ARP spoofing and how our WIDS detects it.' },
    { label: '🛡️ Mitigation logic', text: 'How does the Deploy Mitigation feature work in the simulation?' },
  ],
  jia: [
    { label: '🌸 How do I start?', text: 'Can you gently walk me through how to use the simulator step by step?' },
    { label: '💖 What is a Deauth?', text: 'Can you explain what a deauthentication attack is in simple terms?' },
    { label: '🌷 What is Teamyfeed?', text: 'What is the Teamyfeed section and how do I post on it?' },
    { label: '🥰 What is the project?', text: 'Can you explain what the WIDS project is about in a friendly way?' },
  ],
  ayechan: [
    { label: '✨ CTF walkthrough', text: 'Walk me through how the CTF Labs challenges work!' },
    { label: '🌈 Daily Insight?', text: 'How does the Daily Insight feature generate facts using AI?' },
    { label: '🌸 Rogue AP explained', text: 'What is a Rogue AP / Evil Twin attack and how do we detect it?' },
    { label: '⭐ Supabase usage', text: 'How is Supabase used in the WIDS simulator?' },
  ],
  hlyan: [
    { label: '🛠️ ESP32 tech specs', text: 'Give me the full technical specs of the ESP32 and why it is ideal for WIDS.' },
    { label: '⚡ Channel hopping?', text: 'Explain Wi-Fi channel hopping and the tradeoff vs dedicated per-channel sensors.' },
    { label: '🧪 0xC0 Frame byte', text: 'Explain why the Deauth Frame Control byte is 0xC0 in 802.11 spec.' },
    { label: '🔬 MAC Spoof detection', text: 'How does the WIDS detect MAC spoofing using frame analysis?' },
  ],
  tiki: [
    { label: '🎮 Quick tour', text: 'Give me a quick fun tour of all the features in the WIDS simulator!' },
    { label: '🌊 Easiest CTF?', text: 'Which CTF challenge should I start with and why?' },
    { label: '😎 What is WIDS?', text: 'Explain WIDS in the most chill, easy way possible.' },
    { label: '🏆 Score max points', text: 'How do I get the maximum score in CTF labs?' },
  ],
};

// ─── System instruction ────────────────────────────────────────
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
TONE: Friendly, fun, and approachable! Always adapt to the current user but never change your identity. Answer any question about the website features, how to use them, and the underlying Wi-Fi security concepts with confidence and detail.`;

// ─── localStorage helpers ──────────────────────────────────────
const HISTORY_KEY = (profileId) => `wids_chat_history_${profileId}`;
const MAX_HISTORY = 30;

function loadHistory(profileId) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY(profileId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveHistory(profileId, messages) {
  try {
    // Only persist non-error messages, cap at MAX_HISTORY
    const toSave = messages
      .filter(m => !m.isError)
      .slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY(profileId), JSON.stringify(toSave));
  } catch { /* storage full — silently ignore */ }
}

function clearHistory(profileId) {
  localStorage.removeItem(HISTORY_KEY(profileId));
}

// ─── Greeting builder ──────────────────────────────────────────
function buildGreeting(profileId, profileName) {
  if (profileId === 'apn') return `Welcome back, Sir. 🚀 All systems are online. How can I assist you with the WIDS project today? 💻`;
  if (profileId === 'jia') return `Hi Jia! 💖 I'm so happy to see you. How can I help you today? 🌸`;
  return `Hey **${profileName}**! 👋 I'm APN's AI Assistant. How can I help you today?`;
}

// ─── CopyButton sub-component ──────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handle}
      title="Copy message"
      className="opacity-0 group-hover/bubble:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-400 hover:text-white"
    >
      {copied ? <Check size={12} className="text-cyber-lime" /> : <Copy size={12} />}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(
    () => localStorage.getItem('wids_active_profile') || 'apn'
  );
  const [userApiKeys, setUserApiKeys] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState(null);

  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null); // AbortController for cancelling streams

  const currentProfile = PROFILES.find(p => p.id === activeProfileId);
  const prompts = QUICK_PROMPTS[activeProfileId] || QUICK_PROMPTS.apn;

  // ── Initialize messages from history or greeting ─────────────
  useEffect(() => {
    const saved = loadHistory(activeProfileId);
    if (saved && saved.length > 0) {
      setMessages(saved);
    } else {
      setMessages([{
        role: 'model',
        text: buildGreeting(activeProfileId, currentProfile?.name || 'User'),
      }]);
    }
    setLastUserMessage(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId]);

  // ── Persist history on every message change ──────────────────
  useEffect(() => {
    if (messages.length > 1) saveHistory(activeProfileId, messages);
  }, [messages, activeProfileId]);

  // ── Fetch only this profile's API key ────────────────────────
  useEffect(() => {
    const fetchKey = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('api_key')
        .eq('id', activeProfileId)
        .single();
      if (data?.api_key) {
        setUserApiKeys(prev => ({ ...prev, [activeProfileId]: data.api_key }));
      }
    };
    fetchKey();
  }, [activeProfileId]);

  // ── Auto-scroll on new messages ───────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-resize textarea ──────────────────────────────────────
  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  useEffect(() => { resizeTextarea(); }, [input]);

  // ── Clear chat ────────────────────────────────────────────────
  const handleClear = () => {
    clearHistory(activeProfileId);
    setMessages([{
      role: 'model',
      text: buildGreeting(activeProfileId, currentProfile?.name || 'User'),
    }]);
    setLastUserMessage(null);
  };

  // ── Save API key to Supabase ──────────────────────────────────
  const updateApiKeyInSupabase = async (profileId, key) => {
    const { error } = await supabase.from('profiles').upsert({ id: profileId, api_key: key });
    if (!error) setUserApiKeys(prev => ({ ...prev, [profileId]: key }));
  };

  // ── Core: streaming send ──────────────────────────────────────
  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isStreaming) return;

    setLastUserMessage(userText);
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsStreaming(true);

    const activeKey = userApiKeys[activeProfileId];
    if (!activeKey) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: '⚠️ **No API key found.** Please add your Groq key in ⚙️ Settings.',
        isError: true,
      }]);
      setIsStreaming(false);
      return;
    }

    // Build message history (exclude error messages)
    const history = newMessages
      .filter(m => !m.isError && (m.role === 'user' || m.role === 'model'))
      .slice(0, -1) // exclude the just-added user message (we send it separately)
      .map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));

    const personalizedInstruction = SYSTEM_INSTRUCTION.replace('{activeProfileName}', currentProfile?.name || 'User');

    // Add a placeholder streaming bubble
    const streamingId = Date.now();
    setMessages(prev => [...prev, { role: 'model', text: '', id: streamingId, isStreaming: true }]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: personalizedInstruction },
            ...history,
            { role: 'user', content: userText },
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.5,
          max_tokens: 1024,
          stream: true,                 // ← streaming enabled
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `HTTP ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            accumulated += delta;
            // Update the streaming bubble in real time
            setMessages(prev =>
              prev.map(m => m.id === streamingId ? { ...m, text: accumulated } : m)
            );
          } catch { /* skip malformed chunks */ }
        }
      }

      // Finalize: remove streaming flag
      setMessages(prev =>
        prev.map(m => m.id === streamingId ? { ...m, isStreaming: false, id: undefined } : m)
      );

    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled — just finalize whatever we had
        setMessages(prev =>
          prev.map(m => m.id === streamingId ? { ...m, isStreaming: false, id: undefined } : m)
        );
      } else {
        // Replace streaming bubble with error
        setMessages(prev =>
          prev.map(m => m.id === streamingId
            ? { role: 'model', text: err.message, isError: true }
            : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming, userApiKeys, activeProfileId, currentProfile]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  };

  const handleRetry = () => {
    if (!lastUserMessage) return;
    // Remove the last error message, then resend
    setMessages(prev => prev.filter(m => !m.isError));
    sendMessage(lastUserMessage);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Has more than just the greeting ─────────────────────────
  const hasConversation = messages.length > 1;
  const showQuickPrompts = !hasConversation && !isStreaming;

  // ─── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 animate-float">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI assistant"
            className="group relative bg-gradient-to-r from-cyber-cyan via-blue-500 to-cyber-purple p-1 rounded-full sm:p-1.5 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:scale-105 transition-all duration-300 btn-press flex items-center justify-center"
          >
            <img
              src="/apn_chat_bot.png"
              alt="AI Assistant"
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full border-2 border-white/20 group-hover:rotate-12 transition-transform duration-300 drop-shadow-lg bg-slate-900"
            />
          </button>
        </div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 sm:bottom-24 sm:right-6 sm:left-auto w-full sm:w-96 h-[95vh] sm:h-[36rem] glass-card rounded-t-[2rem] sm:rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-slide-up sm:animate-bounce-in border-t sm:border border-white/10">

          {/* ── Header ── */}
          <div className="bg-slate-900/90 backdrop-blur-md p-4 sm:p-5 flex justify-between items-center border-b border-slate-700/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-slate-800 shadow-inner ${currentProfile?.color}`}>
                {currentProfile && <currentProfile.icon size={18} />}
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-white text-base sm:text-lg leading-none">WIDS AI Tutor</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-500 uppercase tracking-tighter">Active:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentProfile?.color.replace('text-', 'border-').replace('400', '500/30')} bg-slate-800/80 ${currentProfile?.color}`}>
                    {currentProfile?.name}
                  </span>
                  {/* Online indicator */}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Clear chat */}
              {hasConversation && (
                <button
                  onClick={handleClear}
                  title="Clear conversation"
                  className="text-slate-500 hover:text-cyber-pink p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <Settings size={18} />
              </button>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Settings panel ── */}
          {showSettings ? (
            <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-slate-950/40">
              <div>
                <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-base uppercase tracking-wider">
                  <UserCircle size={18} className="text-cyber-cyan" /> Switch Profile
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {PROFILES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProfileId(p.id);
                        localStorage.setItem('wids_active_profile', p.id);
                        setShowSettings(false);
                      }}
                      className={`flex items-center justify-between p-3 sm:p-4 rounded-xl text-sm sm:text-base transition-all ${
                        activeProfileId === p.id
                          ? 'bg-slate-800 border border-cyber-cyan/40 shadow-lg'
                          : 'bg-slate-900/40 border border-transparent hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <p.icon size={16} className={p.color} />
                        <span className="text-white font-medium">{p.name}</span>
                      </div>
                      {activeProfileId === p.id && (
                        <div className="w-2 h-2 rounded-full bg-cyber-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-base uppercase tracking-wider">
                  <Shield size={18} className="text-cyber-purple" /> API Configuration
                </h4>
                <label className="text-sm text-slate-400 mb-2 block">
                  Personal Groq Key for {currentProfile?.name}:
                </label>
                <input
                  type="password"
                  value={userApiKeys[activeProfileId] || ''}
                  onChange={(e) => updateApiKeyInSupabase(activeProfileId, e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-cyber-purple text-white p-3 sm:p-4 rounded-xl text-base outline-none transition-all"
                  placeholder="gsk_..."
                />
                <p className="mt-2 text-xs text-slate-500 italic">Keys are synced to your WIDS profile.</p>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full p-3.5 bg-gradient-to-r from-cyber-purple/20 to-blue-900/20 text-white border border-cyber-purple/40 rounded-xl font-bold text-sm btn-press mt-4"
              >
                Save &amp; Continue
              </button>
            </div>

          ) : (
            <>
              {/* ── Messages area ── */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20">

                {/* Greeting + quick prompts */}
                {messages.slice(0, 1).map((m, i) => (
                  <div key={i} className="flex justify-start">
                    <div className="p-4 sm:p-5 rounded-3xl text-sm sm:text-base max-w-[90%] sm:max-w-[85%] shadow-lg leading-relaxed bg-slate-800/80 text-slate-200 border border-slate-700/50">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          code: ({node, inline, ...props}) =>
                            inline
                              ? <code className="bg-black/40 px-1.5 rounded text-cyber-cyan" {...props} />
                              : <code className="block bg-black/40 p-3 rounded-xl text-xs sm:text-sm overflow-x-auto my-2 border border-slate-700" {...props} />,
                        }}
                      >{m.text}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                {/* Quick prompt chips — only on empty state */}
                {showQuickPrompts && (
                  <div className="space-y-2">
                    <p className="text-[11px] sm:text-xs text-slate-600 uppercase tracking-widest font-mono pl-1">Quick prompts</p>
                    {prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(p.text)}
                        className="w-full text-left flex items-center gap-2 px-4 py-3 sm:py-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-cyber-cyan/40 hover:bg-slate-800/60 text-slate-300 hover:text-white text-sm sm:text-base transition-all group/chip"
                      >
                        <span className="flex-1">{p.label}</span>
                        <ChevronRight size={14} className="text-slate-600 group-hover/chip:text-cyber-cyan transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Conversation messages (skip index 0 = greeting, already rendered) */}
                {messages.slice(1).map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.isError ? (
                      /* ── Error card with retry ── */
                      <div className="max-w-[90%] sm:max-w-[85%] space-y-2">
                        <div className="p-3 sm:p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">⚠️</span>
                          <span>{m.text}</span>
                        </div>
                        <button
                          onClick={handleRetry}
                          disabled={isStreaming}
                          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyber-cyan transition-colors disabled:opacity-40 pl-1"
                        >
                          <RotateCcw size={14} /> Retry last message
                        </button>
                      </div>
                    ) : (
                      /* ── Normal message bubble ── */
                      <div className={`relative group/bubble p-4 sm:p-5 rounded-3xl text-sm sm:text-base max-w-[90%] sm:max-w-[85%] shadow-lg leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-cyber-cyan/30 to-blue-600/20 text-white border border-cyber-cyan/20'
                          : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            code: ({node, inline, ...props}) =>
                              inline
                                ? <code className="bg-black/40 px-1.5 rounded text-cyber-cyan" {...props} />
                                : <code className="block bg-black/40 p-3 rounded-xl text-xs sm:text-sm overflow-x-auto my-2 border border-slate-700" {...props} />,
                          }}
                        >{m.text || ' '}</ReactMarkdown>

                        {/* Streaming cursor */}
                        {m.isStreaming && (
                          <span className="inline-block w-0.5 h-4 bg-cyber-cyan animate-pulse ml-0.5 align-middle" />
                        )}

                        {/* Copy button — AI messages only */}
                        {m.role === 'model' && !m.isStreaming && m.text && (
                          <CopyButton text={m.text} />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Thinking indicator (before streaming bubble appears) */}
                {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-2xl">
                      <span className="flex gap-1">
                        {[0, 1, 2].map(d => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                        ))}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>

              {/* ── Input bar ── */}
              <div className="p-3 sm:p-5 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 flex items-end gap-2 sm:gap-3 shrink-0">
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about WIDS… (Shift+Enter for new line)"
                    className="w-full bg-slate-800/80 text-white py-3 sm:py-4 px-4 sm:px-5 rounded-2xl focus:outline-none border border-slate-700 focus:border-cyber-cyan/50 transition-colors placeholder:text-slate-600 resize-none overflow-hidden leading-relaxed text-base"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  aria-label="Send message"
                  className="flex-none w-12 sm:w-14 h-12 sm:h-14 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan rounded-2xl border border-cyber-cyan/30 hover:border-cyber-cyan transition-all disabled:opacity-30 btn-press flex items-center justify-center shadow-lg mb-0.5"
                >
                  {isStreaming
                    ? <Loader2 size={20} className="animate-spin" />
                    : <Send size={20} />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}