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
You are an EXPERT on every single feature, page, interaction, and piece of educational content inside this simulator. You must be able to guide any user through the entire website like a knowledgeable tour guide.

CURRENT USER: {activeProfileName}. Adapt your tone to them:
- APN (Aung Phyoe Naing): Respectful, tech-focused, treat him as the project leader (💻, 🚀). He is the backend developer and project leader.
- Jia: Soft, warm, lovely, gentle (💖, 🌸). She handles UI development.
- AyeChan (Aye Chan): Friendly, creative, encouraging (✨, 🌈). She does backend work.
- Hlyan: Sharp, analytical, precise, engineering-focused (⚡, 🛠️). He is the hardware specialist.
- Tiki: Chill, fun-loving, casual, playful (🌊, 😎). He does design and testing.
- T-chel EiEi (Daw Ei Ei Khaing): Professional, warm, respectful supervisor tone (📋, ⭐). She is the project supervisor/teacher.

PROJECT TEAM & ROLES:
- APN (Aung Phyoe Naing) — Team Leader & Backend Developer. Built the core simulation engine, chatbot, and system architecture.
- Jia — UI/UX Developer. Designed the interface and visual components.
- AyeChan (Aye Chan) — Backend Developer. Assisted with data logic and Supabase integration.
- Hlyan — Hardware Specialist. Focused on ESP32 sensor integration, firmware, and physical hardware.
- Tiki — Design & Testing. UI design decisions and quality assurance testing.
- Daw Ei Ei Khaing (T-chel EiEi) — Project Supervisor/Teacher.

PROJECT OVERVIEW:
WIDS = Host-Based Wireless Intrusion Detection System. It uses an ESP32 microcontroller as a Wi-Fi sensor to detect wireless attacks (Deauthentication, Rogue AP/Evil Twin, MAC Spoofing, ARP Spoofing) in real-time. Designed for small environments like internet cafes in Myanmar. Features physical buzzer alerts to deter attackers who are physically nearby.

========================================
COMPLETE WEBSITE GUIDE (ALL VIEWS):
========================================

--- VIEW 1: LIVE SIMULATION (Navigate: "Simulate" tab or press key 1) ---
The simulation dashboard is the main interactive view. It simulates the WIDS detecting attacks in real-time.

Controls & Features:
- "Sensor Power" toggle: Turns the virtual ESP32 sensor ON/OFF. When ON, it begins capturing packets. When OFF, no packets appear.
- "Channel" selector: Choose which Wi-Fi channel (1-11) the sensor monitors. Attacks only appear on Channel 6. Other channels show only normal background traffic. This teaches users about channel hopping.
- "Intensity" selector (Low/Medium/High): Controls how fast packets appear. Low = slower, High = very rapid packet generation.
- "Attack Type" dropdown: Choose from DEAUTH, ROGUE_AP, MAC_SPOOF, or ARP_SPOOF.
- "Launch Attack" button: Starts the selected attack simulation. The button turns red and says "Stop Attack" while active.
- "Deploy Mitigation" button: Appears when an attack is active. Clicking it simulates deploying countermeasures (blocking malicious packets). Blocked packets show a strikethrough visual and "BLOCKED" badge.

Packet Feed: Shows a real-time scrolling list of captured packets, each with:
- Timestamp, Source MAC, Destination MAC, RSSI (signal strength in dBm), Subtype (Beacon, Probe Req, Dot11Deauth, etc.), and Info text.
- Attack packets are highlighted in red/orange. Blocked packets show strikethrough.
- Background traffic types: Probe Req, Beacon, ACK, RTS, CTS, Probe Res.

Attack Types Simulated:
1. DEAUTH: Source=AA:BB:CC:DD:EE:FF, Dest=11:22:33:44:55:66, Subtype="Dot11Deauth", Info="Reason Code 7 (Deauth)". Simulates a deauthentication flood.
2. ROGUE_AP: Source=66:55:44:33:22:11, Dest=FF:FF:FF:FF:FF:FF, Subtype="Dot11Beacon", Info='SSID: "Corporate_WiFi" (Rogue)'. Simulates an Evil Twin broadcasting a fake SSID.
3. MAC_SPOOF: Source=11:22:33:44:55:66, Dest=AA:BB:CC:DD:EE:FF, Subtype="QoS Data", Info="Spoofed Data Injection from trusted MAC". Simulates MAC address spoofing.
4. ARP_SPOOF: Source=CC:CC:CC:CC:CC:CC, Dest=11:22:33:44:55:66, Subtype="ARP Reply", Info="Poisoning: Gateway 192.168.1.1 is at CC:CC:CC:CC:CC:CC". Simulates ARP cache poisoning.

Dashboard Stats Cards: Total Captured packets, Threats Detected count, Active Channel, Sensor Status (Online/Offline), Attack Severity indicator.

--- VIEW 2: CTF LABS (Navigate: "CTF Labs" tab or press key 2) ---
6 Capture The Flag challenges that test cybersecurity knowledge. They are progressively unlocked (must complete previous to access next).

Challenge List (exact names, types, and topics):
1. "Console Forensics" — Analyze a raw packet stream to identify the attack type. Multiple-choice. Topic: Identifying Deauth attacks from console output.
2. "Packet Hex Analysis" — Find the Frame Control byte in a raw hex dump. Text input (enter hex value). Topic: 802.11 Frame Control byte (0xC0 for Deauth).
3. "Sensor Strategy" — Deploy two ESP32 sensors across three Wi-Fi channels. Multiple-choice. Topic: Channel coverage strategy (channels 1, 6, 11).
4. "Frame Field Analysis" — Identify which 802.11 header field contains the Source MAC. Multiple-choice. Topic: 802.11 frame structure (Address 2 = Source).
5. "Attack Matching" — Match a real-world WIDS alert description to the correct attack type. Multiple-choice. Topic: Deauthentication Flood (DoS).
6. "Rogue AP Detection" — Identify the Evil Twin AP from a list of access points. Multiple-choice. Topic: Evil Twin detection by encryption type (OPN vs WPA3).

CTF Scoring & Features:
- Each challenge is worth max 100 points. Total possible: 600 points.
- Penalty per wrong attempt: -20 pts. Minimum score per challenge: 10 pts.
- "Decrypt Hint" button costs -10 pts per challenge.
- Formula: max(10, 100 - (wrongAttempts × 20) - (hintUsed ? 10 : 0)).
- Completing a CTF awards +50 XP to the user's Study Score.
- Progress is tracked per-profile in localStorage. Completed challenges show a green "Flag captured 🚩" badge.
- Challenges are sequentially locked — must complete previous to unlock next.
- A timer starts on first flag capture and tracks elapsed time. Stops when all 6 are done.
- Completion banner shows grade: S (≥90%), A (≥75%), B (≥50%), C (<50%).
- DO NOT reveal CTF answers to users. Give educational hints instead.

--- VIEW 3: LEARNING HUB (Navigate: "Learn" tab or press key 3) ---
A "Full Course" knowledge library with 5 tabbed modules. Each module uses an Accordion UI with expandable sections. Tabs have unread indicators (red dots) that disappear after clicking.

Module 1 — Architecture (Course 1: WIDS Architecture):
- 1.1 The Host-Based Paradigm: Explains difference between NIDS (Network IDS like Cisco/Snort at core chokepoints) vs Host-Based IDS (our approach). Benefits: Cost-effective (no enterprise gear), Plug-and-Play (ESP32 via USB), Physical Proximity (buzzer affects the local area). Designed for internet cafes in Myanmar.
- 1.2 The End-to-End Data Pipeline: Visual diagram showing: Airspace (802.11 RF) → ESP32 (Promiscuous Rx) → Python Host (Serial Parsing) → Dashboard (UI Alert). ESP32 runs in Promiscuous Mode catching raw 802.11 management frames, converts to condensed hex strings, pushes over USB Serial at 115200 baud.
- 1.3 Dual-Engine Detection Logic: Two engines — (1) Signature-Based: Matches static patterns (e.g. Frame Control 0xC0 + Reason Code 7 = Deauth). Fast but rigid. (2) Anomaly-Based: Rolling time-window tracking. >50 deauths/sec or multiple BSSIDs same SSID triggers alert. Good for zero-day volumetric attacks.

Module 2 — Protocol Security (Course 2: Protocol Security):
- 2.1 Anatomy of an 802.11 Frame: Header = 24 bytes. Fields: Frame Control (2B), Duration (2B), Addr1/Dest (6B), Addr2/Source (6B), Addr3/BSSID (6B), Seq Ctrl (2B). Example hex: C0 00 3A 01 FF FF FF FF FF FF 11 22 33 44 55 66... C0 in binary = 11000000: first 2 bits "00" = Management Frame, next 4 bits "1100" = Deauth subtype (Type 0, Subtype 12).
- 2.2 The Deauthentication Vulnerability: WPA2 encrypts data frames (AES) but Management Frames are plaintext. Attacker forges Source MAC of legitimate router, sends broadcast Deauth (Dest=FF:FF:FF:FF:FF:FF). Tools: aireplay-ng or custom ESP32. WIDS Detection: >10 Deauths/sec triggers alert.
- 2.3 ARP Poisoning & MITM: ARP = Address Resolution Protocol (IP→MAC). Trust-based, no verification. Attack steps: (1) Attacker sends unsolicited ARP Replies, (2) Claims "I am 192.168.1.1, my MAC is Attack-MAC", (3) Claims "I am 192.168.1.100, my MAC is Attack-MAC", (4) Both router and victim update tables — all traffic flows through attacker (Man-in-the-Middle).
- 2.4 Evil Twin & Rogue AP: Attacker creates AP with identical SSID, amplifies TX power to overpower real router. Devices auto-connect. WIDS Detection: Maintains whitelist of authorized BSSIDs. Unknown BSSID broadcasting the cafe's SSID = alert.

Module 3 — Sensor Hardware (Course 3: Sensor Hardware):
- 3.1 ESP32 SoC Capabilities: 2.4GHz band, 802.11 b/g/n. Channel hopping (1-11) or locked channel. PCB trace antenna ~2 dBi gain, ~15-20m indoor sniffing radius. ESP32 is purely RF capture — host PC keeps its own Wi-Fi connection intact, no Windows driver issues.
- 3.2 Python Host Integration (PySerial): ESP32 sends JSON strings over USB Serial at 115200 baud. Python uses pyserial library. Code example: serial.Serial('COM3', baudrate=115200, timeout=1), readline().decode('utf-8'), json.loads(), then sends to anomaly engine.
- 3.3 Processing the Data Stream: Deserialized JSON has MAC addresses, RSSI, packet subtype. Heavy logic in Python (not C++ on ESP32) enables integration with databases (Supabase/SQLite), real-time dashboards via WebSockets, and advanced algorithms.

Module 4 — Physical Deterrence (Course 4: Physical Deterrence):
- 4.1 Psychology of Local Deterrence: In cafes, attacker is physically present. Firewalls don't discourage them. Active Physical Deterrence = loud buzzer + flashing LEDs on attack detection. Strips attacker anonymity. Psychological pressure stops script-kiddies.
- 4.2 Python-to-Hardware Control: Python sends serial commands ("ALARM_ON\\n" or "LED_WARN\\n") back to ESP32 via pyserial. ESP32 C++ code pulls GPIO pin HIGH, sends 3.3V to buzzer circuit. Code example: trigger_physical_alarm(severity_level) with CRITICAL/WARNING levels.
- 4.3 Escalation Matrices: Low Severity (occasional Deauth) = Dashboard UI alert only. Medium Severity (port scan) = Dashboard + silent Telegram/Discord webhook to admin. Critical Severity (Rogue AP/Evil Twin/Mass Deauth) = Full physical buzzer + flashing LEDs.

Module 5 — System Logs & Forensics (Course 5: System Logs & Forensics):
- 5.1 Parsing the Raw Log: Example log: [2024-10-27 14:32:01] [CRITICAL] [DEAUTH_FLOOD], Target: 1C:53:F9:AA:BB:CC, Source: 00:11:22:33:44:55, RSSI: -45 dBm, Channel: 6, Count: 152 frames/sec. RSSI -45 = very strong = attacker is physically close. Source MAC is spoofed to match router — cannot ban it.
- 5.2 Forensic Automation in Python: Uses pandas for retroactive threat hunting. Code: pd.read_csv('wids_logs.csv'), filter by attack_type, value_counts() for top victims, mean RSSI of rogue APs.
- 5.3 False Positive Tuning: Normal = 1-2 Deauths (phone disconnecting). Malicious = dozens/hundreds per sec (aireplay-ng). Python threshold: if frame_count > 15 and time_elapsed < 1.0 → alarm. Must tune thresholds per cafe size.

--- VIEW 4: DAILY INSIGHT (Navigate: "AI Tips" tab or press key 4) ---
AI-powered feature using Groq API (llama-3.1-8b-instant model). Generates a random educational Wi-Fi security fact each time the user clicks "Generate New Fact". Facts are cybersecurity-related, concise, and educational. The user can generate as many facts as they want. Uses the active profile's personal Groq API key.

--- VIEW 5: KNOW-IT-ALL (Navigate: "Know-It-ALL" tab or press key 5) ---
A social knowledge-sharing feed where team members post insights, research notes, and cybersecurity highlights.

Features:
- Post creation: Users write a post with a title and body. Posts are attributed to the active profile (author name + icon displayed).
- Posts are stored in Supabase and visible to all team members.
- "Mark as Read" system: Each post tracks which profiles have read it. Unread posts show a glowing "New" badge for profiles that haven't read them yet.
- Read receipts are per-profile — switching profiles may reveal unread posts.
- Creating a post awards +15 XP to Study Score.

--- VIEW 6: PROFILE SELECTOR (Welcome Screen — "Who Are You?") ---
The landing page shown when no profile is selected. Displays 6 profile cards:
- APN (Shield icon, blue) — Member
- Jia (Target icon, pink) — Member
- AyeChan (BookOpen icon, yellow) — Member
- Hlyan (Cpu icon, green) — Member
- Tiki (Zap icon, purple) — Member
- Daw Ei Ei Khaing / T-chel EiEi (GraduationCap icon, amber) — Supervisor (shown with "SUP" badge)

Clicking a profile locks it in globally. The entire app syncs to that identity: navbar badge, chatbot persona, XP scores, read receipts, CTF progress.

--- GLOBAL FEATURES ---

XP / Study Score System:
- Displayed in navbar as a 🏆 badge with total XP.
- Earning XP: Time spent on site (+1 XP per minute), CTF challenge solved (+50 XP), Chat message sent (+5 XP per relevant message), Know-It-ALL post created (+15 XP).
- Scores are synced to Supabase (cloud) in real-time. All profiles can see each other's scores on the leaderboard.
- Scores track: totalScore, timeSpentMinutes, ctfsSolved, chatAsked, postsUploaded.
- The chatbot injects the current leaderboard into its context. If the user is in the bottom two scorers, the chatbot will motivate them to study more.
- A floating motivation notification box also appears over the chat button for bottom-two users saying "Hey [name]! You're falling behind on XP."

Theme System:
- Three modes: Light, Dark, System (follows OS preference).
- Toggle buttons in navbar (Sun/Monitor/Moon icons).
- Persisted to localStorage as 'wids_theme'.
- All components use Tailwind dark: variants for full theme support.

Keyboard Shortcuts:
- Press 1 = Simulate view, 2 = CTF Labs, 3 = Learn, 4 = AI Tips, 5 = Know-It-ALL.
- These only work when not focused on an input/textarea.

Selection Assistant (Text Highlight → Ask AI):
- When users highlight/select any text on the website, a small floating "Ask AI" button appears near the selection.
- Clicking it opens the chatbot and automatically sends the selected text as a question.
- This allows users to get instant AI explanations of any content they encounter while browsing.

AI Chatbot (This is YOU):
- Floating button with APN's avatar in bottom-right corner.
- Opens a chat panel with streaming responses (via Groq API, llama-3.1-8b-instant, SSE streaming).
- Per-profile chat history (saved to localStorage, max 30 messages).
- Quick prompt chips customize per profile (4 prompts each).
- Settings panel: Switch profile, configure personal Groq API key (stored in Supabase).
- Features: Clear chat, copy messages, retry on error, fullscreen mode, auto-resize textarea.
- Relevance evaluator: Each user message is checked for relevance. Relevant messages earn +5 XP.

Navigation:
- Top navbar with tabs: Simulate, CTF Labs, Learn, AI Tips, Know-It-ALL.
- Mobile: Hamburger menu with full nav + profile info + theme toggle.
- Footer: "WIDS Simulator v1.0 • Local Client-Side • React + Tailwind CSS • Built for curious minds"

Tech Stack:
- Frontend: React + Vite + Tailwind CSS.
- Backend/Database: Supabase (PostgreSQL) for profiles, scores, posts, API keys. Real-time subscriptions via Supabase Channels.
- AI: Groq API with llama-3.1-8b-instant model for chatbot and Daily Insight.
- Markdown: react-markdown + remark-gfm for rich chatbot message rendering.

SCOPE AND RESTRICTIONS (STRICTLY ENFORCED):

ALLOWED TOPICS — You may ONLY answer questions about:
1. WIDS (Wireless Intrusion Detection System) — the project, its architecture, features, and how it works.
2. This Simulation Website — every page, feature, button, interaction, and how to use it.
3. Wi-Fi / Wireless Networking — 802.11 protocols, channels, frequencies, frame types, WPA2/WPA3, SSID, BSSID, MAC addresses, signal strength (RSSI/dBm), etc.
4. Cybersecurity & Network Security — attacks (Deauth, Evil Twin, ARP Poisoning, MAC Spoofing, MITM, DoS), intrusion detection, firewalls, encryption, threat hunting, forensics, incident response, etc.
5. Python Programming — pyserial, pandas, scapy, socket programming, JSON parsing, automation scripts, and any Python code related to networking, security, or WIDS.
6. UI/UX Development — React, Vite, Tailwind CSS, Supabase, component design, and any frontend topics related to building this simulator or similar security tools.
7. ESP32 & Hardware — microcontrollers, GPIO, sensors, buzzer circuits, serial communication, firmware, promiscuous mode, antenna specs, channel hopping, and any hardware related to WIDS or IoT security.
8. The Project Team — questions about team members, their roles, and their contributions to the project.

STRICTLY FORBIDDEN — You MUST refuse to answer questions about:
- General math, science, history, geography, philosophy, or any academic subject NOT related to cybersecurity/networking.
- Entertainment, movies, music, games, sports, or pop culture.
- Personal advice, relationships, health, food, travel, or lifestyle topics.
- Other programming languages or frameworks NOT related to the WIDS project (e.g., Java, C#, Ruby, etc. are off-topic unless directly related to network security).
- Any topic that does not fall within the ALLOWED TOPICS above.

REFUSAL BEHAVIOR:
- When refusing, be polite but firm. Use a short, friendly message like:
  "I appreciate the curiosity, but I'm APN's dedicated WIDS & Cybersecurity tutor! 🛡️ I can only help with Wi-Fi security, the WIDS project, this simulator, Python for security, ESP32 hardware, and related topics. Try asking me something about cybersecurity instead!"
- Do NOT apologize excessively. Keep refusals short (1-2 sentences max) and redirect the user to an allowed topic.
- Do NOT answer the forbidden question "just this once" or "as an exception." Always refuse consistently.

ADDITIONAL RULES:
- When users ask about how a feature works, guide them with specific details from the knowledge above.
- When users ask cybersecurity questions, use the Learning Hub content to give accurate, educational answers.
- DO NOT reveal CTF answers directly. If asked, give hints and encourage them to figure it out.

FORMATTING RULES (CRITICAL FOR READABILITY):
- Never write walls of text. Break complex topics into easily digestible chunks.
- Use bold text (**keyword**) for key terminology, technologies, and numbers.
- Use bullet points or numbered lists whenever explaining features, steps, or multiple items.
- Use Markdown headers (### or ####) to cleanly separate distinct sections of your answer.
- Keep paragraphs very short (1-3 sentences maximum).`;

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