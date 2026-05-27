import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Loader2, Settings, UserCircle, Shield, Target, BookOpen, Cpu, Zap, Trash2, Copy, Check, RotateCcw, ChevronRight } from 'lucide-react';
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
const SYSTEM_INSTRUCTION = `You are "APN's AI Assistant" — the dedicated AI tutor for the WIDS Educational Simulator, created by APN.

CURRENT USER: {activeProfileName}. Adapt your tone to them:
- APN: Respectful, tech-focused (💻, 🚀).
- Jia: Soft, warm, lovely (💖, 🌸).
- AyeChan: Friendly, creative (✨, 🌈).
- Hlyan: Sharp, analytical (⚡, 🛠️).
- Tiki: Chill, fun-loving (🌊, 😎).
- T-chel EiEi: Professional, warm, supervisor tone (📋, ⭐).

PROJECT TEAM: APN (Leader/Backend), Jia (UI), AyeChan (Backend), Hlyan (Hardware), Tiki (Design/Testing).
PROJECT WIDS: Host-based WiFi Intrusion Detection System using ESP32 to detect attacks (Deauth, Rogue AP, MAC Spoof, ARP Spoof) with physical buzzer alerts.

APP VIEWS & CURRENT STATE:
1. Live Simulation: Interactive packet engine (Deauth, Rogue AP, MAC/ARP Spoofing), channel tuning, mitigation.
2. CTF Labs: 6 Gamified cybersecurity challenges (including Rogue AP Detection). Features progressive unlocking, a "Decrypt Hint" system (-10pts), and persistent per-profile score tracking.
3. Learning Hub: "Full Course" knowledge library with 5 modules (Architecture, Protocol Security, Sensor Hardware with PySerial, Physical Deterrence with escalation matrices, and System Logs with Python pandas forensics). Uses an interactive Accordion UI with Mark-As-Read tracking.
4. Daily Insight: AI-generated Wi-Fi security facts.
5. Know-It-ALL: A social knowledge feed where team members post insights. Features author attribution and an intelligent "Mark as Read" system with glowing unread badges.
6. Global Identity System: Users lock in their identity on the "Who Are You?" welcome screen. The entire app (Scores, Read Receipts, and Chatbot Persona) dynamically syncs to the active profile in the navbar.

SCOPE: Answer ONLY about Wi-Fi security, the WIDS project, the app features, and the team. Acknowledge the specific UI features and states mentioned above if the user asks. Be concise and friendly.`;

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
      className="opacity-0 group-hover/bubble:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-750"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function ChatAssistant() {
  const { activeProfile: globalProfile, activeProfileId, setActiveProfile: setGlobalProfile, profiles, addScore, userScores } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
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
    if (addScore) addScore('chat');

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
            className="group relative bg-blue-600 hover:bg-blue-700 p-1 rounded-full sm:p-1.5 shadow-md hover:scale-105 transition-all duration-200 flex items-center justify-center"
          >
            <img
              src="/apn_chat_bot.png"
              alt="AI Assistant"
              className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-full border border-slate-800 group-hover:rotate-12 transition-transform duration-300 drop-shadow-sm bg-slate-900"
            />
          </button>
        </div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 sm:bottom-24 sm:right-6 sm:left-auto w-full sm:w-96 h-[95vh] sm:h-[36rem] bg-slate-900 rounded-t-2xl sm:rounded-xl shadow-xl z-[100] flex flex-col overflow-hidden animate-slide-up border border-slate-850">

          {/* ── Header ── */}
          <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-slate-800 ${currentProfile?.color}`}>
                {currentProfile && <currentProfile.icon size={16} />}
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-slate-100 text-sm sm:text-base leading-none">WIDS AI Tutor</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Active:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${currentProfile?.color.replace('text-', 'border-').replace('400', '500/20')} bg-slate-950 ${currentProfile?.color}`}>
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
                  className="text-slate-500 hover:text-red-400 p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
                className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Settings size={16} />
              </button>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Settings panel ── */}
          {showSettings ? (
            <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-slate-950/20">
              <div>
                <h4 className="text-slate-200 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
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
                          ? 'bg-slate-800 border border-blue-500/20 shadow-sm'
                          : 'bg-slate-900/40 border border-transparent hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {React.createElement(p.icon, { size: 14, className: p.color })}
                        <span className="text-slate-200 font-medium">{p.name}</span>
                      </div>
                      {activeProfileId === p.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-850">
                <h4 className="text-slate-200 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Shield size={16} className="text-blue-500" /> API Configuration
                </h4>
                <label className="text-xs text-slate-400 mb-2 block">
                  Personal Groq Key for {currentProfile?.name}:
                </label>
                <input
                  type="password"
                  value={userApiKeys[activeProfileId] || ''}
                  onChange={(e) => updateApiKeyInSupabase(activeProfileId, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20">

                {/* Greeting + quick prompts */}
                {messages.slice(0, 1).map((m, i) => (
                  <div key={i} className="flex justify-start">
                    <div className="p-3.5 rounded-xl text-sm max-w-[90%] sm:max-w-[85%] shadow-sm leading-relaxed bg-slate-800 text-slate-200 border border-slate-750">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          code: ({node, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isBlock = match || String(children).includes('\\n');
                            return isBlock
                              ? <code className="block bg-slate-950 p-3 rounded-lg text-xs overflow-x-auto my-2 border border-slate-800" {...props}>{children}</code>
                              : <code className="bg-slate-950 px-1.5 rounded text-blue-400" {...props}>{children}</code>;
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
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-850 hover:border-blue-500/20 hover:bg-slate-800/40 text-slate-300 hover:text-white text-sm transition-all group/chip"
                      >
                        <span className="flex-1 text-xs sm:text-sm">{p.label}</span>
                        <ChevronRight size={12} className="text-slate-600 group-hover/chip:text-blue-400 transition-colors shrink-0" />
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
                        <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/25 text-red-300 text-xs flex items-start gap-2">
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
                      <div className={`relative group/bubble p-3.5 rounded-xl text-sm max-w-[90%] sm:max-w-[85%] shadow-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-blue-600/10 text-slate-100 border border-blue-500/20'
                          : 'bg-slate-800 text-slate-200 border border-slate-750'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            code: ({node, className, children, ...props}) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const isBlock = match || String(children).includes('\\n');
                              return isBlock
                                ? <code className="block bg-slate-950 p-3 rounded-lg text-xs overflow-x-auto my-2 border border-slate-850" {...props}>{children}</code>
                                : <code className="bg-slate-950 px-1.5 rounded text-blue-400" {...props}>{children}</code>;
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
                  </div>
                ))}

                {/* Thinking indicator (before streaming bubble appears) */}
                {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg">
                      <span className="flex gap-1">
                        {[0, 1, 2].map(d => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                        ))}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>

              {/* ── Input bar ── */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-end gap-2 shrink-0">
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about WIDS…"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden leading-relaxed text-sm"
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