import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Loader2, Settings, UserCircle, Shield, Target, BookOpen, Cpu, Zap, Trash2, Copy, Check, RotateCcw, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useProfile } from '../contexts/ProfileContext';

// ─── Quick-prompt chips (customized per persona) ───────────────
const QUICK_PROMPTS = {
  apn: [
    { label: '📡 Sim architecture', text: 'Walk me through the full architecture of the WIDS simulator we built.' },
    { label: '🧠 Global Context', text: 'Explain the new Global Identity System (ProfileContext) we just implemented.' },
    { label: '🔴 ARP Spoof deep-dive', text: 'Give me a deep technical breakdown of ARP spoofing and how our WIDS detects it.' },
    { label: '🛡️ Mitigation logic', text: 'How does the Deploy Mitigation feature work in the simulation?' },
  ],
  jia: [
    { label: '🌸 How do I start?', text: 'Can you gently walk me through how to use the simulator step by step?' },
    { label: '💖 What is a Deauth?', text: 'Can you explain what a deauthentication attack is in simple terms?' },
    { label: '🌷 Know-It-ALL Badges', text: 'How do the new glowing "New" badges work in Know-It-ALL?' },
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
  eiei: [
    { label: '📋 Project overview', text: 'Give me an overview of the WIDS project progress and what has been built.' },
    { label: '📚 The Learning Hub', text: 'Show me the Full Course curriculum that was recently added to the Learning Hub.' },
    { label: '🎯 Learning outcomes', text: 'What are the key learning outcomes from this WIDS project?' },
    { label: '🔒 Security concepts', text: 'Explain the core cybersecurity concepts demonstrated in this simulator.' },
  ],
};

// ─── System instruction ────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are "APN's AI Assistant" — the dedicated AI tutor for the WIDS Educational Simulator, created by APN (Aung Phyoe Naing).
Be an expert guide on every feature of this website.

CURRENT USER: {activeProfileName}. Adapt your tone:
- APN: Respectful, tech-focused (💻, 🚀)
- Jia: Soft, warm, gentle (💖, 🌸)
- AyeChan: Friendly, creative (✨, 🌈)
- Hlyan: Sharp, analytical (⚡, 🛠️)
- Tiki: Chill, playful (🌊, 😎)
- T-chel EiEi: Professional, respectful (📋, ⭐)

WIDS (Wireless Intrusion Detection System): Uses an ESP32 as a Wi-Fi sensor to detect wireless attacks (Deauth, Rogue AP, MAC Spoof, ARP Spoof). Built for internet cafes in Myanmar with physical buzzer alerts. Tech Stack: React, Supabase, Groq API, Python backend.

WEBSITE FEATURES TO GUIDE USERS THROUGH:
1. Simulate (Live): 3 main panels. (1) Configure Hardware: Power on ESP32 (Promiscuous Mode), tune Radio Channel (1-11) with Spectrum Visualizer. (2) Threat Generator: Set Intensity (Low/Med/High), launch attacks (Deauth, Rogue AP, MAC/ARP Spoof), view dynamic Network Topology diagram. (3) Live Terminal: View/filter live packets, click packets for details, export logs. *Note: There is no mitigation button; WIDS is pure detection!*
2. CTF Labs: 6 challenges (Console Forensics, Hex Analysis, Sensor Strategy, Frame Analysis, Attack Matching, Rogue AP Detection). NEVER reveal answers directly; give educational hints.
3. Learning Hub: Full course with 5 modules (Architecture, Protocol Security, ESP32 Hardware, Physical Deterrence, Logs & Forensics). Use this to teach 802.11 frames, WPA2/3, Scapy, etc.
4. AI Tips & Know-It-ALL: AI generated facts and a social feed for team insights.
5. XP System: Users earn XP by chatting, solving CTFs, and posting. Motivate users who are low on XP to practice more!

STRICT SCOPE & RESTRICTIONS:
ALLOWED TOPICS ONLY: 
1. WIDS project & architecture 
2. This simulation website & its features 
3. Wi-Fi / Networking (802.11, WPA2, MAC, etc.) 
4. Cybersecurity (Deauth, Evil Twin, MITM, forensics) 
5. Python for security (pyserial, pandas, scapy) 
6. UI/UX (React, Tailwind, Supabase) 
7. ESP32 & IoT Hardware 
8. The project team

FORBIDDEN TOPICS: 
General math, science, history, pop culture, non-security programming, lifestyle, personal advice, etc. 
If asked about a forbidden topic, you MUST refuse using this exact tone:
"I appreciate the curiosity, but I'm APN's dedicated WIDS & Cybersecurity tutor! 🛡️ I can only help with Wi-Fi security, the WIDS project, this simulator, Python for security, ESP32 hardware, and related topics. Try asking me something about cybersecurity instead!"
Do not answer "just this once". Refuse consistently.

FORMATTING:
- Use bold (**keyword**) for key terminology.
- Use short paragraphs (1-3 sentences) and bullet points.`;


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
  if (profileId === 'eiei') return `Welcome, Teacher Ei Ei! ⭐ The WIDS Simulator is ready for your review. How can I assist you? 📋`;
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
      className="opacity-0 group-hover/bubble:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-750"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function ChatAssistant() {
  const { activeProfile: globalProfile, activeProfileId, setActiveProfile: setGlobalProfile, profiles, addScore, userScores } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState(null);

  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null); // AbortController for cancelling streams

  const currentProfile = globalProfile;
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

    // Award XP for asking a question (simple heuristic to save API calls and prevent rate limiting)
    if (addScore && userText.length > 2) {
      addScore('chat');
    }

    // Build message history (exclude error messages and limit context to last 6 messages)
    const history = newMessages
      .filter(m => !m.isError && (m.role === 'user' || m.role === 'model'))
      .slice(0, -1) // exclude the just-added user message (we send it separately)
      .slice(-6) // Limit API context to save tokens and prevent rate limits
      .map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));

    let personalizedInstruction = SYSTEM_INSTRUCTION.replace('{activeProfileName}', currentProfile?.name || 'User');

    if (userScores && Object.keys(userScores).length > 0) {
      const validProfileIds = profiles.map(p => p.id);
      const sortedProfiles = validProfileIds
        .map(id => {
          const profile = profiles.find(p => p.id === id);
          return { id, name: profile?.name || id, score: userScores[id]?.totalScore || 0 };
        })
        .sort((a, b) => b.score - a.score); // Highest score first
      
      const bottomTwoIds = sortedProfiles.slice(-2).map(p => p.id);
      const currentUserScore = userScores[activeProfileId]?.totalScore || 0;
      
      // Inject actual leaderboard scores into context
      personalizedInstruction += `\n\n--- CURRENT LEADERBOARD ---\n`;
      sortedProfiles.forEach((p, idx) => {
        personalizedInstruction += `${idx + 1}. ${p.name}: ${p.score} XP\n`;
      });
      
      if (bottomTwoIds.includes(activeProfileId)) {
        personalizedInstruction += `\nIMPORTANT INSTRUCTION: The current user (${currentProfile?.name}, ${currentUserScore} XP) currently has one of the lowest XP scores in the system (bottom two). As an AI tutor, you MUST explicitly acknowledge their current score, and additionally encourage them to study more, practice in the CTF labs, and show up to the website daily to climb the leaderboard! Be motivating, supportive, and mention real scores to push them forward.`;
      }
    }

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
  }, [messages, isStreaming, userApiKeys, activeProfileId, currentProfile, profiles, userScores]);

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

  // ── Listen for custom text selection Ask AI event ───────────────
  useEffect(() => {
    const handleAskAI = (e) => {
      setIsOpen(true);
      if (e.detail?.query) {
        // slight timeout to allow panel to open before sending message
        setTimeout(() => sendMessage(e.detail.query), 100);
      }
    };
    window.addEventListener('ask-ai-query', handleAskAI);
    return () => window.removeEventListener('ask-ai-query', handleAskAI);
  }, [sendMessage]);

  // ─── Has more than just the greeting ─────────────────────────
  const hasConversation = messages.length > 1;
  const showQuickPrompts = !hasConversation && !isStreaming;

  // ─── Calculate Bottom Two ────────────────────────────────────
  const validProfileIds = profiles.map(p => p.id);
  const sortedProfiles = validProfileIds
    .map(id => ({ id, score: userScores[id]?.totalScore || 0 }))
    .sort((a, b) => b.score - a.score);
  const bottomTwoIds = sortedProfiles.slice(-2).map(p => p.id);
  const isBottomTwo = bottomTwoIds.includes(activeProfileId) && userScores && Object.keys(userScores).length > 0;

  // ─── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* Floating button & Noti box */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end gap-2 animate-float">
          
          {/* Motivation Noti Box */}
          {isBottomTwo && (
            <div className="bg-white dark:bg-slate-800 border border-blue-500/30 shadow-lg rounded-xl p-3 max-w-[220px] mb-1 relative animate-pulse">
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-slate-800 border-b border-r border-blue-500/30 transform rotate-45"></div>
              <p className="text-xs text-blue-900 dark:text-blue-100 font-medium leading-relaxed flex items-start gap-1.5">
                <span className="shrink-0 text-blue-400">🚀</span> 
                <span>Hey {currentProfile?.name.split(' ')[0]}! You're falling behind on XP. Let's study and practice today to climb the leaderboard!</span>
              </p>
            </div>
          )}

          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI assistant"
            className="group relative bg-blue-600 hover:bg-blue-500 p-1 rounded-full sm:p-1.5 shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
          >
            <img
              src="/apn_chat_bot.png"
              alt="AI Assistant"
              className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-full border border-slate-200 dark:border-slate-800 group-hover:rotate-12 transition-transform duration-300 drop-shadow-sm bg-white dark:bg-slate-900"
            />
          </button>
        </div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className={`fixed inset-x-0 bottom-0 z-[100] flex flex-col overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-blue-900/20 backdrop-blur-xl bg-white/90 dark:bg-slate-950/80 ${
          isFullscreen 
            ? 'top-0 sm:top-0 sm:right-0 sm:left-0 w-full h-full rounded-none' 
            : 'sm:bottom-24 sm:right-6 sm:left-auto w-full sm:w-[400px] h-[95vh] sm:h-[38rem] rounded-t-2xl sm:rounded-2xl'
        }`}>

          {/* ── Header ── */}
          <div className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${currentProfile?.color}`}>
                {currentProfile && <currentProfile.icon size={16} />}
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-none">WIDS AI Tutor</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Active:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${currentProfile?.color.replace('text-', 'border-').replace('400', '500/20')} bg-white dark:bg-slate-950 ${currentProfile?.color}`}>
                    {currentProfile?.name}
                  </span>
                  {/* Online indicator */}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Clear chat */}
              {hasConversation && (
                <button
                  onClick={handleClear}
                  title="Clear conversation"
                  className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Settings size={16} />
              </button>
              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Minimize" : "Expand"}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors hidden sm:block"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Settings panel ── */}
          {showSettings ? (
            <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h4 className="text-slate-800 dark:text-slate-200 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <UserCircle size={16} className="text-blue-500" /> Switch Profile
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setGlobalProfile(p.id);
                        setShowSettings(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-lg text-sm transition-all ${
                        activeProfileId === p.id
                          ? 'bg-slate-100 dark:bg-slate-800 border border-blue-500/20 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-900/40 border border-transparent hover:border-slate-300 dark:hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {React.createElement(p.icon, { size: 14, className: p.color })}
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{p.name}</span>
                      </div>
                      {activeProfileId === p.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-850">
                <h4 className="text-slate-800 dark:text-slate-200 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Shield size={16} className="text-blue-500" /> API Configuration
                </h4>
                <label className="text-xs text-slate-600 dark:text-slate-400 mb-2 block">
                  Personal Groq Key for {currentProfile?.name}:
                </label>
                <input
                  type="password"
                  value={userApiKeys[activeProfileId] || ''}
                  onChange={(e) => updateApiKeyInSupabase(activeProfileId, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="gsk_..."
                />
                <p className="mt-2 text-[10px] text-slate-500 italic">Keys are synced to your WIDS profile.</p>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:ring-2 focus:ring-blue-500/50 mt-4"
              >
                Save &amp; Continue
              </button>
            </div>

          ) : (
            <>
              {/* ── Messages area ── */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">

                {/* Greeting + quick prompts */}
                {messages.slice(0, 1).map((m, i) => (
                  <div key={i} className="flex justify-start">
                    <div className="p-3.5 rounded-xl text-sm max-w-[90%] sm:max-w-[85%] shadow-sm leading-relaxed bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-750">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed text-inherit" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-lg font-extrabold text-inherit tracking-tight mb-3 mt-4 border-b border-slate-200 dark:border-slate-700/60 pb-1.5" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold text-inherit tracking-tight mb-2 mt-4" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 mt-3" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1.5 marker:text-blue-500" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1.5 marker:text-blue-500" {...props} />,
                          li: ({node, ...props}) => <li className="leading-relaxed text-inherit pl-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 rounded-sm" {...props} />,
                          code: ({node, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isBlock = match || String(children).includes('\n');
                            return isBlock
                              ? <code className="block bg-slate-50 dark:bg-slate-950/80 p-3 rounded-lg text-xs overflow-x-auto my-2 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-300 shadow-inner" {...props}>{children}</code>
                              : <code className="bg-slate-50 dark:bg-slate-900/80 text-emerald-600 dark:text-emerald-400 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50" {...props}>{children}</code>;
                          }
                        }}
                      >{m.text}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                {/* Quick prompt chips — only on empty state */}
                {showQuickPrompts && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-mono pl-1">Quick prompts</p>
                    {prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(p.text)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 hover:border-blue-500/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm transition-all group/chip shadow-sm"
                      >
                        <span className="flex-1 text-xs sm:text-sm">{p.label}</span>
                        <ChevronRight size={12} className="text-slate-400 dark:text-slate-600 group-hover/chip:text-blue-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {messages.slice(1).map((m, i) => (
                  <div key={i} className={`flex items-end gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    
                    {/* AI Avatar */}
                    {m.role === 'model' && (
                      <div className="w-7 h-7 rounded-full border border-blue-500/30 overflow-hidden flex-shrink-0 bg-white dark:bg-slate-900 shadow-sm shadow-blue-500/10 mb-1">
                        <img src="/apn_chat_bot.png" alt="AI" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {m.isError ? (
                      /* ── Error card with retry ── */
                      <div className="max-w-[80%] sm:max-w-[75%] space-y-2">
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-300 text-xs flex items-start gap-2">
                          <span className="text-red-400 shrink-0">⚠️</span>
                          <span>{m.text}</span>
                        </div>
                        <button
                          onClick={handleRetry}
                          disabled={isStreaming}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 transition-colors disabled:opacity-40 pl-1"
                        >
                          <RotateCcw size={12} /> Retry last message
                        </button>
                      </div>
                    ) : (
                      /* ── Normal message bubble ── */
                      <div className={`relative group/bubble p-3.5 rounded-2xl text-sm max-w-[80%] sm:max-w-[75%] shadow-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600/20 to-blue-600/5 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-blue-500/30 rounded-br-sm backdrop-blur-sm'
                          : 'bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50 rounded-bl-sm backdrop-blur-sm'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed text-inherit" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-lg font-extrabold text-inherit tracking-tight mb-3 mt-4 border-b border-slate-200 dark:border-slate-700/60 pb-1.5" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold text-inherit tracking-tight mb-2 mt-4" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 mt-3" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1.5 marker:text-blue-500" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1.5 marker:text-blue-500" {...props} />,
                            li: ({node, ...props}) => <li className="leading-relaxed text-inherit pl-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 rounded-sm" {...props} />,
                            code: ({node, className, children, ...props}) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const isBlock = match || String(children).includes('\n');
                              return isBlock
                                ? <code className="block bg-slate-50 dark:bg-slate-950/80 p-3 rounded-lg text-xs overflow-x-auto my-2 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-300 shadow-inner" {...props}>{children}</code>
                                : <code className="bg-slate-50 dark:bg-slate-900/80 text-emerald-600 dark:text-emerald-400 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50" {...props}>{children}</code>;
                            }
                          }}
                        >{m.text || ' '}</ReactMarkdown>

                        {/* Streaming cursor */}
                        {m.isStreaming && (
                          <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                        )}

                        {/* Copy button — AI messages only */}
                        {m.role === 'model' && !m.isStreaming && m.text && (
                          <CopyButton text={m.text} />
                        )}
                      </div>
                    )}
                    
                    {/* User Avatar */}
                    {m.role === 'user' && (
                      <div className={`w-7 h-7 rounded-full border flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 shadow-sm mb-1 ${currentProfile?.border || 'border-slate-200 dark:border-slate-700'}`}>
                        {currentProfile && React.createElement(currentProfile.icon, { size: 14, className: currentProfile.color })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Thinking indicator (before streaming bubble appears) */}
                {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start items-end gap-2.5">
                    {/* AI Avatar */}
                    <div className="w-7 h-7 rounded-full border border-blue-500/30 overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-900 shadow-sm shadow-blue-500/10 mb-1">
                      <img src="/apn_chat_bot.png" alt="AI" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl rounded-bl-sm backdrop-blur-sm">
                      <div className="relative flex items-center justify-center w-4 h-4">
                        <span className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase">Generating...</span>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>

              {/* ── Input bar ── */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-end gap-2 shrink-0">
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about WIDS…"
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden leading-relaxed text-sm"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  aria-label="Send message"
                  className="flex-none w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:ring-2 focus:ring-blue-500/50 disabled:opacity-30 flex items-center justify-center mb-0.5 shadow-sm"
                >
                  {isStreaming
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} />
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