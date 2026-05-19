import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Activity, WifiOff, ShieldAlert, MonitorPlay, Power, Sliders, ShieldCheck, Lightbulb, Search, Settings, Terminal, Trash2, Download, X, AlertTriangle, Radio, Wifi } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';

// ─── Signal Meter ──────────────────────────────────────────────
function SignalMeter({ rssi }) {
  const bars = 5;
  const filled = Math.max(1, Math.min(bars, Math.ceil((rssi + 80) / 10)));
  const colors = ['bg-cyber-pink', 'bg-cyber-orange', 'bg-cyber-lime', 'bg-cyber-cyan', 'bg-emerald-400'];
  return (
    <div className="flex items-center gap-1.5" aria-label={`Signal strength: ${rssi} dBm`}>
      {Array.from({ length: bars }, (_, i) => (
        <div key={i} className={`w-1.5 rounded-full transition-all duration-700 ${i < filled ? colors[i] : 'bg-slate-700'}`} style={{ height: `${6 + i * 3}px` }} />
      ))}
      <span className="text-[10px] text-slate-500 ml-1 font-mono">{rssi} dBm</span>
    </div>
  );
}

// ─── RSSI History Sparkline ────────────────────────────────────
function RssiHistory({ packets, maxPoints = 20 }) {
  const values = useMemo(() => {
    return packets.slice(0, maxPoints).reverse().map(p => p.rssi);
  }, [packets, maxPoints]);

  if (values.length < 2) return null;
  const min = -80, max = -30, range = max - min;
  const w = 80, h = 24;
  const xStep = w / (values.length - 1);
  const points = values.map((v, i) => `${i * xStep},${h - ((v - min) / range) * h}`).join(' ');

  return (
    <div className="flex items-center gap-2" aria-label="RSSI history chart">
      <svg width={w} height={h} className="overflow-visible">
        <defs>
          <linearGradient id="rssiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="url(#rssiGrad)" strokeWidth="1.5" points={points} className="drop-shadow-[0_0_2px_rgba(0,240,255,0.3)]" />
        {values.length > 0 && (
          <circle cx={w} cy={h - ((values[values.length - 1] - min) / range) * h} r="2" fill="#00f0ff" />
        )}
      </svg>
      <span className="text-[9px] text-slate-600 font-mono">RSSI</span>
    </div>
  );
}

// ─── Channel Spectrum Visualizer ───────────────────────────────
function ChannelSpectrum({ sensorChannel, targetChannel, isAttackActive, sensorOn, isMitigated }) {
  const canSee = isAttackActive && sensorOn && sensorChannel === targetChannel;
  const wrongCh = isAttackActive && sensorOn && sensorChannel !== targetChannel;
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">2.4 GHz Spectrum</span>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          {sensorOn && <span className="text-cyber-cyan">Sensor: CH {sensorChannel}</span>}
          {isAttackActive && <span className="text-cyber-pink">Attack: CH {targetChannel}</span>}
        </div>
      </div>
      <div className="flex gap-0.5 rounded-lg overflow-hidden h-8">
        {[1,2,3,4,5,6,7,8,9,10,11].map(ch => {
          const isSensor = ch === sensorChannel && sensorOn;
          const isTarget = ch === targetChannel;
          const isActive = isTarget && canSee;
          const isBlocked = isTarget && isMitigated;
          const hasInterference = isTarget && wrongCh;
          return (
            <div key={ch} className="flex-1 relative group">
              <div className={`h-full w-full rounded-sm transition-all duration-300 flex items-center justify-center text-[9px] font-bold font-mono ${
                isBlocked ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-500' :
                isActive ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink shadow-[0_0_8px_rgba(255,45,149,0.5)] animate-pulse-fast' :
                isSensor ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan shadow-[0_0_8px_rgba(0,240,255,0.4)]' :
                hasInterference ? 'bg-yellow-900/60 text-yellow-400 border border-yellow-500 animate-wiggle' :
                isTarget ? 'bg-slate-700 text-slate-300 border border-slate-500' :
                'bg-slate-800 text-slate-600 border border-slate-700/50'
              }`}>
                {ch}
              </div>
              {isTarget && (
                <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  isBlocked ? 'bg-emerald-400' : isActive ? 'bg-cyber-pink animate-pulse' : 'bg-slate-400'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      {sensorOn && <div className="mt-1 flex justify-between text-[8px] text-slate-700 font-mono">
        <span>2400 MHz</span>
        <span>2483 MHz</span>
      </div>}
    </div>
  );
}

// ─── Packet Distribution Stacked Bar ──────────────────────────
function PacketDistribution({ packets }) {
  const total = packets.length;
  if (total === 0) return null;
  const attack = packets.filter(p => p.isAttack).length;
  const blocked = packets.filter(p => p.isBlocked).length;
  const normal = total - attack - blocked;
  const aPct = (attack / total) * 100;
  const bPct = (blocked / total) * 100;
  const nPct = (normal / total) * 100;
  if (nPct === 0 && aPct === 0 && bPct === 0) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Traffic Distribution</span>
        <div className="flex items-center gap-3 text-[9px]">
          {normal > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> {normal}</span>}
          {attack > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> {attack}</span>}
          {blocked > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> {blocked}</span>}
        </div>
      </div>
      <div className="h-3 bg-slate-900 rounded-full overflow-hidden flex">
        {nPct > 0 && <div className="h-full bg-blue-500/60 transition-all duration-500" style={{ width: `${nPct}%` }} />}
        {attack > 0 && <div className="h-full bg-red-500/60 transition-all duration-500" style={{ width: `${aPct}%` }} />}
        {bPct > 0 && <div className="h-full bg-emerald-500/60 transition-all duration-500" style={{ width: `${bPct}%` }} />}
      </div>
    </div>
  );
}

// ─── Network Topology Diagram ──────────────────────────────────
function NetworkTopology({ isAttackActive, attackType, isMitigated, sensorOn }) {
  const arrowColor = isMitigated ? '#10b981' : (isAttackActive ? '#ff2d95' : '#64748b');
  const arrowAnimate = isAttackActive && !isMitigated ? 'animate-pulse' : '';
  const attackLabel = attackType === 'DEAUTH' ? 'Deauth flood' : attackType === 'ROGUE_AP' ? 'Fake Beacon' : 'Spoofed Data';
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-2">
      {/* Attacker */}
      <div className="flex flex-col items-center gap-1.5">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all ${
          isAttackActive && !isMitigated ? 'bg-cyber-pink/20 border-cyber-pink shadow-[0_0_15px_rgba(255,45,149,0.3)]' : 'bg-slate-900 border-slate-700'
        }`}>
          <WifiOff className={`w-6 h-6 ${isAttackActive && !isMitigated ? 'text-cyber-pink' : 'text-slate-500'}`} />
        </div>
        <span className="text-[10px] font-bold text-slate-400">Attacker</span>
        {isAttackActive && !isMitigated && <span className="text-[8px] text-cyber-pink font-mono">{attackLabel}</span>}
        {isMitigated && <span className="text-[8px] text-emerald-400 font-mono">Blocked</span>}
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center relative">
        <div className={`w-16 h-0.5 ${isMitigated ? 'bg-emerald-500' : isAttackActive ? 'bg-cyber-pink' : 'bg-slate-700'}`} />
        <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-current ${isMitigated ? 'text-emerald-500' : isAttackActive ? 'text-cyber-pink' : 'text-slate-700'}`} />
        {isAttackActive && !isMitigated && (
          <span className="absolute -top-5 text-[8px] text-cyber-pink font-mono whitespace-nowrap animate-pulse">→ malicious frames</span>
        )}
        {isMitigated && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 animate-bounce" />
          </div>
        )}
      </div>

      {/* Victim */}
      <div className="flex flex-col items-center gap-1.5">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${
          isAttackActive && !isMitigated ? 'bg-yellow-900/30 border-yellow-600' : 'bg-slate-900 border-slate-700'
        }`}>
          <Activity className={`w-6 h-6 ${isAttackActive && !isMitigated ? 'text-yellow-400' : 'text-slate-500'}`} />
        </div>
        <span className="text-[10px] font-bold text-slate-400">Victim</span>
        {isAttackActive && !isMitigated && <span className="text-[8px] text-yellow-400 font-mono">Disconnecting</span>}
      </div>
    </div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────
function StatsBar({ packets, totalCaptured, isAttackActive, attackType, sensorOn, sensorChannel, targetChannel, isMitigated }) {
  const total = packets.length;
  const attackPkts = packets.filter(p => p.isAttack).length;
  const blockedPkts = packets.filter(p => p.isBlocked).length;
  const normalPkts = total - attackPkts - blockedPkts;
  const detected = isAttackActive && sensorOn && sensorChannel === targetChannel;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
      <div className="glass-card p-3 rounded-xl text-center card-pop">
        <p className="text-2xl font-extrabold text-white font-mono">{totalCaptured}</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">Total seen</p>
      </div>
      <div className="glass-card p-3 rounded-xl text-center card-pop">
        <p className="text-2xl font-extrabold text-slate-300 font-mono">{total}</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">In buffer</p>
      </div>
      <div className="glass-card p-3 rounded-xl text-center card-pop">
        <p className={`text-2xl font-extrabold font-mono ${normalPkts > 0 ? 'text-blue-400' : 'text-slate-600'}`}>{normalPkts}</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">Normal</p>
      </div>
      <div className="glass-card p-3 rounded-xl text-center card-pop">
        <p className={`text-2xl font-extrabold font-mono ${attackPkts > 0 ? 'text-cyber-pink' : 'text-slate-600'}`}>{attackPkts}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{isMitigated ? 'Malicious' : (detected ? 'Attacks' : 'Anomalies')}</p>
      </div>
      <div className="glass-card p-3 rounded-xl text-center card-pop">
        <p className={`text-2xl font-extrabold font-mono ${blockedPkts > 0 ? 'text-cyber-lime' : 'text-slate-600'}`}>{blockedPkts}</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">Blocked</p>
      </div>
    </div>
  );
}

// ─── Detection Badge ────────────────────────────────────────────
function DetectionBadge({ isAttackActive, attackType, sensorOn, sensorChannel, targetChannel, isMitigated }) {
  const canSee = isAttackActive && sensorOn && sensorChannel === targetChannel;
  if (!canSee && !isAttackActive) return null;
  if (!sensorOn) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-xs text-slate-400">
      <div className="w-2 h-2 rounded-full bg-slate-600" /> Sensor offline
    </div>
  );
  if (isAttackActive && sensorOn && sensorChannel !== targetChannel) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/30 border border-yellow-500/30 text-xs text-yellow-400">
      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /> Wrong channel — tune to Ch {targetChannel}
    </div>
  );
  if (isMitigated) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-xs text-emerald-400">
      <ShieldCheck className="w-3 h-3" /> Mitigated — {attackType === 'DEAUTH' ? 'Deauth' : attackType === 'ROGUE_AP' ? 'Rogue AP' : 'MAC Spoof'} blocked
    </div>
  );
  if (canSee) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-pink/10 border border-cyber-pink/30 text-xs text-cyber-pink animate-pulse-fast">
      <div className="w-2 h-2 rounded-full bg-cyber-pink" />
      {attackType === 'DEAUTH' ? 'Deauth flood detected' : attackType === 'ROGUE_AP' ? 'Rogue AP detected' : 'MAC spoofing detected'}
    </div>
  );
  return null;
}

// ─── Packet Detail Modal ───────────────────────────────────────
function PacketDetail({ pkt, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-bounce-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h3 className="font-bold text-white flex items-center gap-2"><Terminal className="w-4 h-4 text-cyber-cyan" /> Packet Details</h3>
          <button onClick={onClose} aria-label="Close packet details"><X className="w-4 h-4 text-slate-400 hover:text-white transition-colors" /></button>
        </div>
        <div className="p-4 font-mono text-sm space-y-3">
          {[
            ['Timestamp', pkt.timestamp],
            ['Source MAC', pkt.source],
            ['Destination MAC', pkt.dest],
            ['Frame Subtype', pkt.subtype],
            ['Info', pkt.info],
            ['Signal (RSSI)', `${pkt.rssi} dBm`],
            ['Status', pkt.isBlocked ? 'Blocked by firewall' : pkt.isAttack ? 'Malicious' : 'Normal'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start gap-3">
              <span className="text-slate-500 w-32 flex-shrink-0 text-xs uppercase tracking-wider">{label}</span>
              <span className={`${label === 'Frame Subtype' && pkt.isAttack ? 'text-cyber-pink font-bold' : label === 'Status' && pkt.isBlocked ? 'text-cyber-lime font-bold' : 'text-white'}`}>{value}</span>
            </div>
          ))}
          <div className="border-t border-slate-700/50 pt-3 mt-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Raw format</p>
            <div className="bg-black/50 rounded-lg p-2 text-xs text-slate-400 leading-relaxed">
              [{pkt.timestamp}] {pkt.source} → {pkt.dest} [{pkt.subtype}] {pkt.info}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function SimulationDashboard({ isAttackActive, attackType, setAttackState }) {
  const [sensorOn, setSensorOn] = useState(false);
  const [sensorChannel, setSensorChannel] = useState(1);
  const [isMitigated, setIsMitigated] = useState(false);
  const [filter, setFilter] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [detailPkt, setDetailPkt] = useState(null);
  const consoleRef = useRef(null);

  const { packets, totalCaptured } = useSimulation(isAttackActive, attackType, sensorOn, sensorChannel, isMitigated, intensity);
  const targetChannel = 6;
  const latestRssi = packets.length > 0 ? packets[0].rssi : -60;

  useEffect(() => {
    if (consoleRef.current && packets.length > 0) consoleRef.current.scrollTop = 0;
  }, [packets]);

  const triggerAttack = useCallback((type) => {
    setIsMitigated(false);
    if (isAttackActive && attackType === type) setAttackState(false, null);
    else setAttackState(true, type);
  }, [isAttackActive, attackType, setAttackState]);

  const handleMitigate = () => setIsMitigated(true);

  const clearConsole = () => { setAttackState(false, null); setIsMitigated(false); };

  const exportLogs = () => {
    const lines = packets.map(p => `[${p.timestamp}] ${p.source} → ${p.dest} [${p.subtype}] ${p.info} (${p.rssi}dBm)${p.isBlocked ? ' [BLOCKED]' : ''}`);
    const text = `WIDS Session Log\n${'='.repeat(60)}\nSensor: ${sensorOn ? 'ONLINE' : 'OFFLINE'} | Channel: ${sensorChannel} | Intensity: ${intensity}\n${'='.repeat(60)}\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const filteredPackets = filter.trim()
    ? packets.filter(p => p.source.toLowerCase().includes(filter.toLowerCase()) || p.dest.toLowerCase().includes(filter.toLowerCase()) || p.subtype.toLowerCase().includes(filter.toLowerCase()) || p.info.toLowerCase().includes(filter.toLowerCase()))
    : packets;

  return (
    <div className="space-y-6">

      {/* ─── 1. Hardware Control Panel ─── */}
      <div className="glass-card p-6 rounded-2xl shadow-xl card-pop">
        <h2 className="text-xl font-extrabold text-cyber-cyan mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-cyber-cyan animate-spin-slow" /> 1. Configure Hardware (WIDS Sensor)
        </h2>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setSensorOn(!sensorOn)}
                aria-label={sensorOn ? 'Power off ESP32 sensor' : 'Power on ESP32 sensor'}
                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 flex-shrink-0 btn-press ${
                  sensorOn ? 'bg-cyber-cyan/20 border-cyber-cyan shadow-[0_0_25px_rgba(0,240,255,0.5)] animate-glow' : 'bg-slate-900 border-slate-600 hover:border-slate-500'
                }`}
              >
                <Power className={`w-8 h-8 ${sensorOn ? 'text-cyber-cyan' : 'text-slate-500'}`} />
              </button>
              <div>
                <h3 className="text-white font-extrabold text-lg">ESP32 Power</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">Status: {sensorOn ? <span className="text-cyber-cyan">ONLINE</span> : <span className="text-slate-500">OFFLINE</span>}</p>
              </div>
            </div>
            <div className="bg-blue-900/20 border-l-2 border-blue-500 p-3 text-xs text-blue-200 rounded-r">
              <strong className="flex items-center text-blue-400 mb-1"><Lightbulb className="w-3 h-3 mr-1" /> Knowledge: Promiscuous Mode</strong>
              Normally, Wi-Fi chips ignore traffic not meant for them. Powering this sensor activates <strong>"Promiscuous Mode"</strong>, forcing it to eavesdrop on <em>every</em> invisible frame flying through the air.
            </div>
          </div>

          <div className="flex-1 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-slate-300 flex items-center">
                <Sliders className="w-4 h-4 mr-2 text-cyber-purple" /> Radio Frequency Tuning
              </label>
              {sensorOn && (
                <div className="flex items-center gap-3">
                  <RssiHistory packets={packets} />
                  <SignalMeter rssi={latestRssi} />
                </div>
              )}
            </div>
            <div className="flex gap-4 items-center mb-4">
              <input type="range" min="1" max="11" value={sensorChannel} onChange={(e) => setSensorChannel(Number(e.target.value))} disabled={!sensorOn} aria-label="Sensor channel selector" className="flex-1 accent-cyber-cyan disabled:opacity-50" />
              <span className="bg-cyber-cyan/10 text-cyber-cyan font-mono px-3 py-2 rounded-lg border border-cyber-cyan/30 text-sm font-bold min-w-[80px] text-center">CH {sensorChannel}</span>
            </div>

            {/* Channel Spectrum Visualizer */}
            <ChannelSpectrum sensorChannel={sensorChannel} targetChannel={targetChannel} isAttackActive={isAttackActive} sensorOn={sensorOn} isMitigated={isMitigated} />

            <div className="bg-blue-900/20 border-l-2 border-blue-500 p-3 text-xs text-blue-200 rounded-r mt-4">
               <strong className="flex items-center text-blue-400 mb-1"><Lightbulb className="w-3 h-3 mr-1" /> Knowledge: Wi-Fi Channels</strong>
               Wi-Fi transmits over radio frequencies divided into "Channels" (1 through 11 in the 2.4GHz band). If the attacker is striking Channel 6, but your sensor is tuned to Channel 1, you won't detect the attack! <strong>Hint: Tune to Channel 6.</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Attack Control Panel ─── */}
      <div className="glass-card p-6 rounded-2xl shadow-xl relative overflow-hidden">
        {isMitigated && (
           <div className="absolute inset-0 bg-emerald-900/90 z-20 flex flex-col items-center justify-center backdrop-blur-md border-2 border-emerald-500 rounded-2xl p-6 text-center animate-bounce-in">
              <ShieldCheck className="w-20 h-20 text-emerald-400 mb-4 animate-bounce" />
              <h2 className="text-3xl font-extrabold text-white mb-2">Threat Neutralized! 🎉</h2>
              <div className="bg-black/30 p-4 rounded-lg text-emerald-200 mb-6 max-w-md">
                <strong className="flex items-center justify-center text-emerald-400 mb-2"><Lightbulb className="w-4 h-4 mr-2" /> Knowledge: Active Mitigation</strong>
                Your WIDS has transformed from a passive listener into an active firewall. It generated a rule targeting the attacker's MAC address and is now dropping their malicious frames before they can harm the network.
              </div>
              <button onClick={() => triggerAttack(attackType)} aria-label="Reset simulation" className="bg-gradient-to-r from-emerald-600 to-cyber-cyan hover:opacity-90 text-white px-8 py-3 rounded-lg font-bold shadow-xl transition-all btn-press hover:scale-105">Reset Simulation</button>
           </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-700/50 pb-4">
          <h2 className="text-xl font-extrabold text-cyber-pink flex items-center">
            <MonitorPlay className="mr-2 h-5 w-5" /> 2. Threat Generator
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <DetectionBadge isAttackActive={isAttackActive} attackType={attackType} sensorOn={sensorOn} sensorChannel={sensorChannel} targetChannel={targetChannel} isMitigated={isMitigated} />
            {isAttackActive && sensorOn && sensorChannel === targetChannel && !isMitigated && (
              <button onClick={handleMitigate} aria-label="Deploy active mitigation against attacker" className="bg-gradient-to-r from-emerald-600 to-cyber-lime hover:opacity-90 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center animate-pulse-fast shadow-[0_0_20px_rgba(16,185,129,0.6)] btn-press">
                <ShieldCheck className="w-5 h-5 mr-2" /> Deploy Mitigation
              </button>
            )}
          </div>
        </div>

        {/* Attack Intensity */}
        <div className="flex items-center gap-3 mb-4 text-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Intensity:</span>
          {['low', 'medium', 'high'].map(level => (
            <button key={level} onClick={() => setIntensity(level)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all btn-press ${intensity === level ? 'bg-gradient-to-r from-cyber-purple/30 to-cyber-pink/30 border-cyber-purple text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
              {level === 'low' ? '🐌 Low' : level === 'medium' ? '⚡ Medium' : '🔥 High'}
            </button>
          ))}
          <span className="text-[10px] text-slate-600 ml-auto">Attack rate: {intensity === 'low' ? '0.8/s' : intensity === 'medium' ? '1.6/s' : '5/s'}</span>
        </div>

        {/* Network Topology Visual */}
        {(sensorOn || isAttackActive) && (
          <div className="mb-5 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Network Topology</span>
              {!sensorOn && <span className="text-[9px] text-slate-600">(sensor offline)</span>}
              {sensorOn && !isAttackActive && <span className="text-[9px] text-emerald-600">monitoring...</span>}
            </div>
            <NetworkTopology isAttackActive={isAttackActive} attackType={attackType} isMitigated={isMitigated} sensorOn={sensorOn} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { type: 'DEAUTH', icon: WifiOff, label: 'Kick User', desc: 'Deauthentication: Forges a fake "disconnect" command to force a target offline.', emoji: '💥', gradient: 'from-cyber-pink/20 to-red-900/20', border: 'border-cyber-pink', activeText: 'text-cyber-pink', activeBg: 'bg-cyber-pink/20' },
            { type: 'ROGUE_AP', icon: ShieldAlert, label: 'Fake Network', desc: 'Rogue AP / Evil Twin: Broadcasts a fake Wi-Fi name (SSID) to trick victims.', emoji: '🎭', gradient: 'from-cyber-purple/20 to-purple-900/20', border: 'border-cyber-purple', activeText: 'text-cyber-purple', activeBg: 'bg-cyber-purple/20' },
            { type: 'MAC_SPOOF', icon: Activity, label: 'Identity Theft', desc: 'MAC Spoofing: Copies a trusted MAC address to bypass security filters.', emoji: '👤', gradient: 'from-cyber-orange/20 to-orange-900/20', border: 'border-cyber-orange', activeText: 'text-cyber-orange', activeBg: 'bg-cyber-orange/20' },
          ].map(btn => {
            const Icon = btn.icon;
            const isActive = isAttackActive && attackType === btn.type;
            return (
              <button key={btn.type} onClick={() => triggerAttack(btn.type)} aria-label={`Trigger ${btn.label} attack`}
                className={`p-4 rounded-xl text-left transition-all flex flex-col justify-start h-full btn-press card-pop ${isActive ? `${btn.activeBg} ${btn.border} border-2 shadow-[0_0_20px_rgba(255,45,149,0.3)]` : 'bg-slate-900/50 border-2 border-slate-700/50 hover:border-slate-500'}`}
              >
                <div className="font-bold mb-2 flex items-center text-white text-base">
                  <span className="text-lg mr-2">{btn.emoji}</span>
                  <Icon className={`mr-2 h-5 w-5 ${isActive ? btn.activeText : 'text-slate-400'}`} /> {btn.label}
                  {isActive && <span className={`ml-2 w-2 h-2 rounded-full ${isActive ? btn.activeText.replace('text-', 'bg-') : ''} animate-pulse`} />}
                </div>
                <div className="text-xs text-slate-400 border-t border-slate-700/50 pt-2">{btn.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Stats Bar ─── */}
      {(sensorOn || isAttackActive) && (
        <div className="glass-card p-4 rounded-2xl shadow-xl card-pop">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Packet Statistics</h3>
            {packets.length > 0 && <span className="text-[10px] text-slate-600 font-mono">Click a packet for details</span>}
          </div>
          <StatsBar packets={packets} totalCaptured={totalCaptured} isAttackActive={isAttackActive} attackType={attackType} sensorOn={sensorOn} sensorChannel={sensorChannel} targetChannel={targetChannel} isMitigated={isMitigated} />
          <PacketDistribution packets={packets} />
        </div>
      )}

      {/* ─── 3. Live Terminal Log ─── */}
      <div className="bg-[#0D1117] rounded-2xl border border-slate-600/50 font-mono text-sm overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-slate-800/80 text-slate-300 border-b border-slate-600/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold flex items-center text-sm">
              <Terminal className="w-4 h-4 mr-2 text-cyber-cyan" /> 3. Live Sensor Output Console
            </span>
            <div className="flex items-center gap-2">
              {packets.length > 0 && (
                <>
                  <button onClick={exportLogs} aria-label="Copy session logs to clipboard" className="bg-slate-900 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1 transition-colors btn-press">
                    <Download className="w-3 h-3" /> Copy
                  </button>
                  <button onClick={clearConsole} aria-label="Clear console and stop attack" className="bg-slate-900 hover:bg-red-900/50 text-slate-400 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1 transition-colors btn-press">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </>
              )}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..." aria-label="Filter console packets" className="bg-slate-900 border border-slate-600 rounded-lg text-[11px] text-slate-300 pl-7 pr-2 py-1 w-24 focus:outline-none focus:border-cyber-cyan placeholder-slate-600 transition-colors" />
              </div>
              <span className="bg-slate-900 px-2 py-1 rounded-lg text-[10px] text-emerald-400 border border-emerald-900">Src</span>
              <span className="bg-slate-900 px-2 py-1 rounded-lg text-[10px] text-blue-400 border border-blue-900">Dst</span>
              <span className="bg-slate-900 px-2 py-1 rounded-lg text-[10px] text-slate-400 border border-slate-700">Ch:{sensorChannel}</span>
            </div>
          </div>
        </div>

        {isAttackActive && sensorOn && sensorChannel !== targetChannel && (
           <div className="bg-yellow-900/80 text-yellow-400 p-2 text-center text-sm font-bold border-b border-yellow-500/50 animate-pulse-fast flex items-center justify-center gap-2">
             <AlertTriangle className="w-4 h-4" /> SIGNAL INTERFERENCE: Traffic spike on Ch {targetChannel}! Tune to CH {targetChannel} to intercept!
           </div>
        )}

        <div ref={consoleRef} className="flex-1 overflow-y-auto p-4 space-y-1" style={{ maxHeight: '20rem' }}>
          {!sensorOn ? (
             <div className="text-red-900 font-bold flex flex-col items-center justify-center h-48">
               <span className="text-lg">[SENSOR OFFLINE]</span>
               <span className="text-sm font-normal mt-2 text-slate-500 text-center max-w-md">Power on the ESP32 in Step 1 to activate Promiscuous Mode.</span>
             </div>
          ) : filteredPackets.length === 0 ? (
            <div className="text-slate-500 italic flex items-center justify-center h-48">
              {filter ? <span>No packets match "<span className="text-slate-400">{filter}</span>"</span> : <span className="animate-pulse text-lg">Scanning radio waves on Channel {sensorChannel}...</span>}
            </div>
          ) : (
            filteredPackets.map((pkt) => (
              <button key={pkt.id} onClick={() => setDetailPkt(pkt)}
                className={`w-full text-left text-slate-300 border-b border-slate-800/50 pb-1.5 pt-1 text-sm hover:bg-slate-800/30 transition-colors cursor-pointer rounded px-1 ${pkt.isBlocked ? 'opacity-50' : ''}`}
              >
                <span className="text-slate-500 mr-2">[{pkt.timestamp}]</span>
                <span className="text-emerald-400 font-bold">{pkt.source}</span>
                <span className="text-slate-600 mx-2">→</span>
                <span className="text-blue-400 font-bold">{pkt.dest}</span>
                <span className={`mx-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${pkt.isBlocked ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-500' : pkt.isAttack ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink animate-pulse-fast' : 'bg-slate-800 text-slate-400 border border-slate-600'}`}>
                  [{pkt.subtype}]
                </span>
                <span className={pkt.isBlocked ? 'text-emerald-500 line-through' : 'text-slate-300'}>{pkt.info}</span>
                <span className="text-[9px] text-slate-700 ml-1">{pkt.rssi}dBm</span>
              </button>
            ))
          )}
          {filter && filteredPackets.length < packets.length && (
            <div className="text-[10px] text-slate-600 text-center py-1">Showing {filteredPackets.length} of {packets.length} packets</div>
          )}
        </div>
      </div>

      {detailPkt && <PacketDetail pkt={detailPkt} onClose={() => setDetailPkt(null)} />}
    </div>
  );
}