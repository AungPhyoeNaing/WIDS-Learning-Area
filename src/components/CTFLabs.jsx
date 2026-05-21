import React, { useState, useEffect } from 'react';
import { Flag, Terminal, CheckCircle2, XCircle, Radio, WifiOff, ShieldAlert, MonitorPlay, Clock, Hash, Search } from 'lucide-react';

const STORAGE_KEY = 'wids_ctf_score';

function loadScore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { completed: [], score: 0, startTime: null }; }
  catch { return { completed: [], score: 0, startTime: null }; }
}

function saveScore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const CHALLENGES = [
  {
    id: 'console',
    icon: MonitorPlay,
    color: 'emerald',
    title: 'Console Forensics',
    subtitle: 'Read the raw packet stream to identify the attack in progress.',
    flag: 'deauth',
    maxScore: 100,
    question: (
      <div className="space-y-4">
        <p>A WIDS sensor captured these frames from the air. Analyze the output and determine what type of attack is happening.</p>
        <div className="bg-[#0D1117] border border-slate-600 rounded font-mono text-xs sm:text-sm leading-relaxed p-2 sm:p-4 space-y-2 sm:space-y-3 shadow-inner overflow-x-auto">
          <div className="text-slate-500 whitespace-nowrap">[12:34:56] <span className="text-emerald-400 font-bold">AA:BB:CC:DD:EE:FF</span> <span className="text-slate-600">→</span> <span className="text-blue-400 font-bold">11:22:33:44:55:66</span> <span className="bg-red-900/60 text-red-400 border border-red-500 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">[Dot11Deauth]</span> Reason Code 7</div>
          <div className="text-slate-500 whitespace-nowrap">[12:34:56] <span className="text-emerald-400 font-bold">AA:BB:CC:DD:EE:FF</span> <span className="text-slate-600">→</span> <span className="text-blue-400 font-bold">11:22:33:44:55:66</span> <span className="bg-red-900/60 text-red-400 border border-red-500 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">[Dot11Deauth]</span> Reason Code 7</div>
          <div className="text-slate-500 whitespace-nowrap">[12:34:57] <span className="text-emerald-400 font-bold">AA:BB:CC:DD:EE:FF</span> <span className="text-slate-600">→</span> <span className="text-blue-400 font-bold">11:22:33:44:55:66</span> <span className="bg-red-900/60 text-red-400 border border-red-500 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">[Dot11Deauth]</span> Reason Code 7</div>
        </div>
        <div className="bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r text-sm text-blue-200">
          <strong className="text-blue-300">🔬 From the Simulator:</strong> This matches the <strong>Live Sensor Console</strong> when the <strong>Kick User</strong> attack is active. Each line: <span className="text-slate-300">timestamp</span>, <span className="text-emerald-400">source MAC</span>, <span className="text-blue-400">destination MAC</span>, <span className="text-red-400">attack tag</span>.
        </div>
        <p className="font-bold text-white">Which attack type do these captured frames represent?</p>
      </div>
    ),
    options: [
      { value: 'rogue_ap', label: 'Rogue AP / Fake Network', hint: 'Rogue APs flood Beacon Frames, not Deauth frames. Check the [bracket] tag.', correct: false },
      { value: 'deauth', label: 'Deauthentication / Kick User', hint: 'Correct! Repeated [Dot11Deauth] from the same MAC with Reason Code 7 is the signature of a Deauth flood.', correct: true },
      { value: 'mac_spoof', label: 'MAC Spoofing / Identity Theft', hint: 'MAC spoofing uses QoS Data frames, not Deauth. The attacker impersonates a MAC in data frames.', correct: false }
    ]
  },
  {
    id: 'hex',
    icon: Terminal,
    color: 'blue',
    title: 'Packet Hex Analysis',
    subtitle: 'Find the one byte in the raw 802.11 frame that reveals the attack.',
    flag: 'c0',
    maxScore: 100,
    question: (
      <div className="space-y-4">
        <p>Every 802.11 frame starts with a <strong>Frame Control</strong> field. The first byte encodes the <strong>Type</strong> and <strong>Subtype</strong>.</p>
        <div className="bg-black border border-slate-700 rounded p-2 sm:p-4 font-mono text-xs sm:text-sm text-slate-400 shadow-inner overflow-x-auto whitespace-nowrap">
          <span className="text-slate-500">/* Frame Control byte breakdown */</span><br/>
          <span className="text-slate-400">Bit:&nbsp;&nbsp; 7&nbsp;&nbsp; 6&nbsp;&nbsp; 5&nbsp;&nbsp; 4&nbsp;&nbsp; 3&nbsp;&nbsp; 2&nbsp;&nbsp; 1&nbsp;&nbsp; 0</span><br/>
          <span className="text-white">| Protocol | Type | Subtype |</span><br/>
          <span className="text-slate-500">Deauth = Type 00 (Management), Subtype 1100 (decimal 12 = 0xC0)</span>
        </div>
        <p>Below is the raw hex dump. The <strong>Frame Control</strong> byte is highlighted.</p>
        <div className="bg-black p-2 sm:p-4 rounded border border-slate-700 font-mono text-[11px] sm:text-sm text-slate-500 leading-relaxed tracking-widest shadow-inner overflow-x-auto whitespace-nowrap">
          0000 &nbsp; 00 00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee <br/>
          0010 &nbsp; ff <span className="text-white font-bold bg-blue-900/50 px-1 border border-blue-500 rounded">c0</span> 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
        </div>
        <div className="bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r text-sm text-blue-200">
          <strong className="text-blue-300">🔬 From the Simulator:</strong> Every <span className="text-red-400">[Dot11Deauth]</span> packet in the console has this <code className="bg-slate-800 px-1 rounded">0xC0</code> byte. The WIDS matches this hex signature.
        </div>
        <p className="font-bold text-white">Enter the 2-character hex value of the Frame Control byte for a Deauth frame.</p>
      </div>
    ),
    answer: (val) => { const cleaned = val.toLowerCase().trim().replace('0x', ''); return cleaned === 'c0'; }
  },
  {
    id: 'channels',
    icon: Radio,
    color: 'purple',
    title: 'Sensor Strategy',
    subtitle: 'Apply your understanding of channels to deploy sensors effectively.',
    flag: 'three',
    maxScore: 100,
    question: (
      <div className="space-y-4">
        <p>A company uses three APs on channels <strong>1</strong>, <strong>6</strong>, and <strong>11</strong> — the only non-overlapping 2.4 GHz channels. The security team has budget for <strong>two</strong> ESP32 sensors; each listens to one channel at a time.</p>
        <div className="bg-slate-900 border border-slate-700 rounded p-4 text-sm">
          <p className="text-slate-300 font-bold mb-2">Network Layout</p>
          <div className="flex items-center gap-px sm:gap-1 text-[10px] sm:text-xs font-mono">
            {[1,2,3,4,5,6,7,8,9,10,11].map(ch => (
              <div key={ch} className={`flex-1 text-center py-1 sm:py-1.5 rounded ${ch === 1 || ch === 6 || ch === 11 ? 'bg-emerald-900/60 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-600'}`}>{ch}</div>
            ))}
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-2">Ch 1, 6, and 11 do not overlap.</p>
        </div>
        <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-3 rounded-r text-sm text-yellow-200">
          <strong className="text-yellow-300">⚠️ Constraint:</strong> A sensor on channel 1 <strong>cannot</strong> hear traffic on channel 6 or 11.
        </div>
        <p className="font-bold text-white">Best way to deploy two sensors to monitor all three APs?</p>
      </div>
    ),
    options: [
      { value: 'one', label: 'Both sensors on channel 1', hint: 'Channels 6 and 11 would be completely unmonitored.', correct: false },
      { value: 'three', label: 'One on Ch1, one on Ch6; accept Ch11 is uncovered', hint: 'Correct! With two sensors you cannot cover all three channels. Enterprise solutions deploy one per channel or use channel hopping.', correct: true },
      { value: 'hop', label: 'One on Ch1, the other fast-hopping all channels', hint: 'Close! Hopping works but creates blind spots. Dedicated per-channel is more reliable.', correct: false }
    ]
  },
  {
    id: 'fields',
    icon: Hash,
    color: 'orange',
    title: 'Frame Field Analysis',
    subtitle: 'Identify which bytes in the hex dump correspond to which 802.11 frame fields.',
    flag: 'address',
    maxScore: 100,
    question: (
      <div className="space-y-4">
        <p>The 802.11 frame header contains multiple fields in a specific order. Given this hex dump of a captured frame:</p>
        <div className="bg-black p-2 sm:p-4 rounded border border-slate-700 font-mono text-[11px] sm:text-sm text-slate-500 leading-relaxed tracking-widest shadow-inner overflow-x-auto whitespace-nowrap">
          <span className="text-emerald-400">08 00</span> <span className="text-blue-400">00 00</span> <span className="text-yellow-400">AA:BB:CC:DD:EE:FF</span> <span className="text-purple-400">11:22:33:44:55:66</span>
        </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-[11px] sm:text-sm font-mono bg-slate-900/50 p-3 sm:p-4 rounded border border-slate-700">
          <div><span className="text-emerald-400">08 00</span> = Frame Control</div>
          <div><span className="text-blue-400">00 00</span> = Duration</div>
          <div><span className="text-yellow-400">6 bytes</span> = Address 1 (Destination)</div>
          <div><span className="text-purple-400">6 bytes</span> = Address 2 (Source)</div>
        </div>
        <div className="bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r text-sm text-blue-200">
          <strong className="text-blue-300">🔬 From the Simulator:</strong> The console prints <span className="text-emerald-400">source</span> → <span className="text-blue-400">destination</span> — these are the MAC addresses extracted from Address 2 and Address 1 in the frame header.
        </div>
        <p className="font-bold text-white">In the 802.11 frame header, which field contains the 6-byte MAC address of the device that <em>sent</em> the frame?</p>
      </div>
    ),
    options: [
      { value: 'fc', label: 'Frame Control', hint: 'Frame Control is 2 bytes, not 6, and encodes type/subtype, not addresses.', correct: false },
      { value: 'duration', label: 'Duration', hint: 'Duration is 2 bytes and indicates how long the channel will be reserved.', correct: false },
      { value: 'address', label: 'Address 2 (Source)', hint: 'Correct! Address 2 in the 802.11 header is the Source MAC — the hardware address of the sender. The simulator shows this in green.', correct: true },
      { value: 'addr1', label: 'Address 1 (Destination)', hint: 'Address 1 is the Destination MAC (shown in blue in the console), not the sender.', correct: false }
    ]
  },
  {
    id: 'scenarios',
    icon: Search,
    color: 'red',
    title: 'Attack Matching',
    subtitle: 'Match real-world attack descriptions to the correct Wi-Fi threat type.',
    flag: 'deauth2',
    maxScore: 100,
    question: (
      <div className="space-y-4">
        <p>You are a security analyst reviewing an alert from your WIDS. The log shows:</p>
        <div className="bg-slate-900 border border-slate-700 rounded p-4 text-sm text-slate-300 leading-relaxed">
          <p><em>"Over 3,000 deauthentication frames were sent from a single MAC address (AA:BB:CC:DD:EE:FF) to all clients on the corporate network within 5 seconds. All employees in the building lost Wi-Fi connectivity momentarily."</em></p>
        </div>
        <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-3 rounded-r text-sm text-yellow-200">
          <strong className="text-yellow-300">🔍 Key observation:</strong> The number of frames (3,000 in 5s) and the target (all clients) rules out normal network behavior.
        </div>
        <p className="font-bold text-white">What type of attack does this describe?</p>
      </div>
    ),
    options: [
      { value: 'rogue', label: 'Rogue AP (Evil Twin)', hint: 'A Rogue AP floods Beacon Frames to lure victims in, not Deauth frames to kick them off.', correct: false },
      { value: 'deauth2', label: 'Deauthentication Flood (DoS)', hint: 'Correct! A massive burst of Deauth frames from one MAC to all clients is a classic Wi-Fi Denial-of-Service attack. It disrupts all connections in the area.', correct: true },
      { value: 'macspoof', label: 'MAC Spoofing', hint: 'MAC spoofing impersonates a trusted device using QoS Data frames, not Deauth frames.', correct: false }
    ]
  }
];

function ProgressBar({ completed, total }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-6">
      <span className="text-sm sm:text-base font-bold text-slate-400 flex-shrink-0">
        <span className="text-cyber-cyan">{completed}</span>/{total} Flags
      </span>
      <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div className="h-full bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink rounded-full transition-all duration-700 animate-gradient" style={{ width: `${(completed / total) * 100}%` }} />
      </div>
      {completed === total && (
        <span className="text-cyber-lime font-bold text-sm animate-bounce flex-shrink-0">All flags captured! 🎉</span>
      )}
    </div>
  );
}

const COLOR_MAP = {
  emerald: { bar: 'bg-cyber-cyan', iconBg: 'bg-cyber-cyan/10', iconBorder: 'border-cyber-cyan/30', iconText: 'text-cyber-cyan', gradient: 'from-cyber-cyan to-emerald-400' },
  blue: { bar: 'bg-blue-500', iconBg: 'bg-blue-500/10', iconBorder: 'border-blue-500/30', iconText: 'text-blue-400', gradient: 'from-blue-500 to-cyber-cyan' },
  purple: { bar: 'bg-cyber-purple', iconBg: 'bg-cyber-purple/10', iconBorder: 'border-cyber-purple/30', iconText: 'text-cyber-purple', gradient: 'from-cyber-purple to-cyber-pink' },
  orange: { bar: 'bg-cyber-orange', iconBg: 'bg-cyber-orange/10', iconBorder: 'border-cyber-orange/30', iconText: 'text-cyber-orange', gradient: 'from-cyber-orange to-cyber-pink' },
  red: { bar: 'bg-cyber-pink', iconBg: 'bg-cyber-pink/10', iconBorder: 'border-cyber-pink/30', iconText: 'text-cyber-pink', gradient: 'from-cyber-pink to-red-500' }
};

function ChallengeCard({ challenge, challengeIndex, onComplete, isCompleted, score, setScore, allCompleted }) {
  const [selection, setSelection] = useState(null);
  const [textValue, setTextValue] = useState('');
  const [submitAttempts, setSubmitAttempts] = useState(0);
  // Guard: ensure captureFlag only fires once per card, even under rapid clicks
  const flagCaptured = React.useRef(false);

  const Icon = challenge.icon;
  const c = COLOR_MAP[challenge.color] || COLOR_MAP.emerald;

  const captureFlag = () => {
    if (flagCaptured.current || isCompleted) return; // prevent double-scoring
    flagCaptured.current = true;
    const deduction = submitAttempts * 20;
    const earned = Math.max(20, challenge.maxScore - deduction);
    setScore(prev => prev + earned);
    onComplete(challenge.id);
  };

  if (isCompleted) {
    return (
      <div className="border border-emerald-500/50 rounded-xl p-4 sm:p-6 bg-emerald-900/10 relative overflow-hidden opacity-80 card-pop">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-cyber-lime" />
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 rounded-full bg-emerald-900/50 border border-emerald-500/50 flex-shrink-0"><CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-400" /></div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-emerald-400 flex flex-wrap items-center gap-2">
              {challenge.title} <span className="text-[10px] sm:text-xs bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">Flag captured 🚩</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Completed — view the next challenge below.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleMultiChoice = (value) => {
    setSelection(value);
    const opt = challenge.options.find(o => o.value === value);
    if (opt && opt.correct) {
      captureFlag();
    }
  };

  const handleTextSubmit = () => {
    setSubmitAttempts(prev => prev + 1);
    if (challenge.answer(textValue)) {
      captureFlag();
    }
  };

  return (
      <div className="glass-card rounded-xl p-4 sm:p-6 relative overflow-hidden card-pop">
        <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${c.gradient}`} />
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-lg ${c.iconBg} border ${c.iconBorder} flex-shrink-0`}><Icon className={`w-4 sm:w-5 h-4 sm:h-5 ${c.iconText}`} /></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">Challenge {challengeIndex + 1}: {challenge.title}</h3>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Flag: {challenge.flag}</span>
              {challenge.maxScore && <span className="text-[10px] text-cyber-lime font-mono">+{challenge.maxScore}pts</span>}
            </div>
            <p className="text-sm sm:text-base text-slate-400 mt-1">{challenge.subtitle}</p>
          </div>
        </div>

      {challenge.question}

      {challenge.options && (
        <div className="mt-5 space-y-2">
          {challenge.options.map(opt => {
            const isSelected = selection === opt.value;
            const isRevealed = selection !== null;
            const isCorrect = isSelected && opt.correct;
            const isWrong = isSelected && !opt.correct;
            return (
              <button
                key={opt.value}
                onClick={() => handleMultiChoice(opt.value)}
                disabled={isRevealed}
                className={`w-full text-left p-3 sm:p-4 rounded-lg text-sm sm:text-base font-medium border transition-all flex items-start gap-3 ${
                  isCorrect ? 'bg-emerald-900/30 border-emerald-500 text-emerald-200' :
                  isWrong ? 'bg-red-900/30 border-red-500 text-red-200' :
                  isRevealed && opt.correct ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-300' :
                  'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
                }`}
              >
                <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                  isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' :
                  isWrong ? 'border-red-500 bg-red-500 text-white' :
                  'border-slate-600 text-transparent'
                }`}>{isCorrect ? '✓' : isWrong ? '✗' : ''}</span>
                <div>
                  <span className={isCorrect || (isRevealed && opt.correct) ? 'text-emerald-300' : isWrong ? 'text-red-200' : 'text-slate-200'}>{opt.label}</span>
                  {isRevealed && <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${opt.correct ? 'text-emerald-400' : 'text-slate-400'}`}>{opt.hint}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {challenge.answer && (
        <div className="mt-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              type="text" placeholder="e.g. A1" maxLength={4}
              value={textValue} onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              aria-label="Enter hex flag answer"
              className="bg-slate-900 border-2 border-slate-600 rounded px-4 py-3 sm:py-2.5 text-white font-mono text-center uppercase focus:outline-none focus:border-blue-500 w-full sm:w-32"
            />
            <button onClick={handleTextSubmit} aria-label="Submit answer" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 sm:py-2.5 rounded font-bold text-sm transition-colors shadow-lg">
              Submit Flag
            </button>
          </div>
          {submitAttempts > 0 && !challenge.answer(textValue) && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm sm:text-base text-red-200 font-bold">Incorrect flag (-20 pts)</p>
                <p className="text-xs sm:text-sm text-red-300 mt-1">Hint: Look for the byte highlighted in <span className="text-blue-300">blue</span> in the hex dump above. The Frame Control byte uses hex digits (0-9, A-F).</p>
              </div>
            </div>
          )}
          {challenge.answer(textValue) && (
            <div className="mt-3 p-3 bg-emerald-900/30 border border-emerald-500/50 rounded flex items-start gap-2 animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-emerald-200"><strong className="text-emerald-400">Flag captured! +{Math.max(20, challenge.maxScore - submitAttempts * 20)}pts</strong> The hex code <code className="bg-slate-800 px-1 rounded text-white">0xC0</code> decodes as: Type=00 (Management), Subtype=1100 (12 = Deauth).</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBoard({ score, totalPossible, elapsed }) {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-cyber-lime" />
        <span className="text-slate-400">Score:</span>
        <span className="text-white font-extrabold font-mono text-lg">{score}</span>
        <span className="text-slate-600">/ {totalPossible}</span>
      </div>
      {elapsed > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyber-purple" />
          <span className="text-slate-400">Time:</span>
          <span className="text-white font-mono">{Math.floor(elapsed / 60)}m {elapsed % 60}s</span>
        </div>
      )}
    </div>
  );
}

function CompletionBanner({ score, totalPossible, onReset }) {
  const pct = Math.round((score / totalPossible) * 100);
  const grade = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 50 ? 'B' : 'C';
  const gradeColor = grade === 'S' ? 'text-cyber-lime' : grade === 'A' ? 'text-cyber-cyan' : grade === 'B' ? 'text-cyber-purple' : 'text-cyber-orange';
  return (
    <div className="mt-6 sm:mt-8 p-4 sm:p-8 bg-gradient-to-r from-cyber-cyan/10 via-cyber-purple/10 to-cyber-pink/10 border border-cyber-cyan/30 rounded-xl text-center animate-bounce-in">
      <Flag className="w-10 sm:w-12 h-10 sm:h-12 text-cyber-lime mx-auto mb-3 animate-bounce" />
      <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">Operation Complete 🎉</h3>
      <div className="inline-block glass-card border border-slate-700 rounded-xl p-4 my-4 text-center">
        <p className={`text-5xl font-extrabold ${gradeColor} mb-1`}>{grade}</p>
        <p className="text-lg text-white font-bold">{score} / {totalPossible}</p>
        <p className="text-xs text-slate-500">{pct}% accuracy</p>
      </div>
      <p className="text-slate-400 text-sm max-w-lg mx-auto mb-4">
        You've completed all {CHALLENGES.length} challenges. Return to the <strong>Live Simulation</strong> to apply your skills in real-time, or reset your progress to try again.
      </p>
      <button onClick={onReset} className="glass-card hover:bg-slate-700/50 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all btn-press">
        Reset Progress
      </button>
    </div>
  );
}

export default function CTFLabs() {
  const [completed, setCompleted] = useState(() => loadScore().completed);
  const [score, setScore] = useState(() => loadScore().score);
  const [startTime, setStartTime] = useState(() => loadScore().startTime);
  const [elapsed, setElapsed] = useState(0);

  // Persist score/completion state
  useEffect(() => {
    saveScore({ completed, score, startTime });
  }, [completed, score, startTime]);

  // Elapsed timer
  useEffect(() => {
    if (!startTime || completed.length === CHALLENGES.length) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, completed.length]);

  const handleComplete = (challengeId) => {
    if (!completed.includes(challengeId)) {
      const newCompleted = [...completed, challengeId];
      setCompleted(newCompleted);
      if (newCompleted.length === 1) {
        const now = Date.now();
        setStartTime(now);
      }
    }
  };

  const handleReset = () => {
    setCompleted([]);
    setScore(0);
    setStartTime(null);
    setElapsed(0);
  };

  const totalPossible = CHALLENGES.length * 100;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass-card p-3 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-lime via-emerald-400 to-cyber-cyan" />
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 rounded-lg bg-cyber-lime/10 border border-cyber-lime/30"><Flag className="w-5 sm:w-6 h-5 sm:h-6 text-cyber-lime" /></div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">Capture The Flag Challenges</h2>
              <p className="text-slate-400 text-sm">Test your Wi-Fi security knowledge. Each challenge awards up to 100pts — wrong answers cost 20pts.</p>
            </div>
          </div>
          <ScoreBoard score={score} totalPossible={totalPossible} elapsed={elapsed} />
        </div>
      </div>

      <div className="glass-card p-6 rounded-xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink" />
        <ProgressBar completed={completed.length} total={CHALLENGES.length} />

        <div className="space-y-6">
          {CHALLENGES.map((challenge, i) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              challengeIndex={i}
              onComplete={handleComplete}
              isCompleted={completed.includes(challenge.id)}
              score={score}
              setScore={setScore}
            />
          ))}
        </div>

        {completed.length === CHALLENGES.length && (
          <CompletionBanner score={score} totalPossible={totalPossible} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}