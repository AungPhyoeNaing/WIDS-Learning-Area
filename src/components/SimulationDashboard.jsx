import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Activity, WifiOff, ShieldAlert, MonitorPlay, Power, Sliders, ShieldCheck, Lightbulb, Search, Settings, Terminal, Trash2, Download, X, AlertTriangle, Radio, Router, Laptop, RefreshCw } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';

// ─── Signal Meter ──────────────────────────────────────────────
function SignalMeter({ rssi }) {
  const bars = 5;
  const filled = Math.max(1, Math.min(bars, Math.ceil((rssi + 80) / 10)));
  const colors = ['bg-rose-500/70', 'bg-orange-500/70', 'bg-amber-500/70', 'bg-blue-500/70', 'bg-emerald-500/70'];
  return (
    <div className="flex items-center gap-1.5" aria-label={`Signal strength: ${rssi} dBm`}>
      {Array.from({ length: bars }, (_, i) => (
        <div key={i} className={`w-1.5 rounded-full transition-all duration-700 ${i < filled ? colors[i] : 'bg-slate-200 dark:bg-slate-700'}`} style={{ height: `${6 + i * 3}px` }} />
      ))}
      <span className="text-[10px] text-slate-600 dark:text-slate-500 ml-1 font-mono">{rssi} dBm</span>
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
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="url(#rssiGrad)" strokeWidth="1.5" points={points} />
        {values.length > 0 && (
          <circle cx={w} cy={h - ((values[values.length - 1] - min) / range) * h} r="2" fill="#3b82f6" />
        )}
      </svg>
      <span className="text-[9px] text-slate-500 dark:text-slate-600 font-mono">RSSI</span>
    </div>
  );
}

// ─── Channel Spectrum Visualizer ───────────────────────────────
function ChannelSpectrum({ sensorChannel, targetChannel, isAttackActive, sensorOn }) {
  const canSee = isAttackActive && sensorOn && sensorChannel === targetChannel;
  const wrongCh = isAttackActive && sensorOn && sensorChannel !== targetChannel;
  return (
    <div className="mt-3 sm:mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[8px] sm:text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-wider">2.4 GHz Spectrum</span>
        <div className="flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[9px] font-mono">
          {sensorOn && <span className="text-blue-600 dark:text-blue-400">Sensor: CH {sensorChannel}</span>}
          {isAttackActive && <span className="text-rose-600 dark:text-rose-400">Attack: CH {targetChannel}</span>}
        </div>
      </div>
      <div className="flex gap-px sm:gap-0.5 rounded-lg overflow-hidden h-6 sm:h-8">
        {[1,2,3,4,5,6,7,8,9,10,11].map(ch => {
          const isSensor = ch === sensorChannel && sensorOn;
          const isTarget = ch === targetChannel;
          const isActive = isTarget && canSee;
          const hasInterference = isTarget && wrongCh;
          return (
            <div key={ch} className="flex-1 relative group">
              <div className={`h-full w-full rounded-sm transition-all duration-300 flex items-center justify-center text-[7px] sm:text-[9px] font-semibold font-mono ${
                isActive ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 animate-pulse' :
                isSensor ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30' :
                hasInterference ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' :
                isTarget ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700' :
                'bg-slate-100/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-600 border border-slate-200/40 dark:border-slate-800/40'
              }`}>
                {ch}
              </div>
              {isTarget && (
                <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-rose-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      {sensorOn && <div className="mt-1 flex justify-between text-[8px] text-slate-500 dark:text-slate-600 font-mono">
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
  const normal = total - attack;
  const aPct = (attack / total) * 100;
  const nPct = (normal / total) * 100;
  if (nPct === 0 && aPct === 0) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-wider">Traffic Distribution</span>
        <div className="flex items-center gap-3 text-[9px] font-semibold text-slate-700 dark:text-slate-400">
          {normal > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> {normal}</span>}
          {attack > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-500" /> {attack}</span>}
        </div>
      </div>
      <div className="h-3 bg-slate-200/80 dark:bg-slate-950 rounded-full overflow-hidden flex shadow-inner">
        {nPct > 0 && <div className="h-full bg-blue-500 dark:bg-blue-600/60 transition-all duration-500" style={{ width: `${nPct}%` }} />}
        {attack > 0 && <div className="h-full bg-rose-500 dark:bg-rose-600/60 transition-all duration-500" style={{ width: `${aPct}%` }} />}
      </div>
    </div>
  );
}

// ─── Network Topology Diagram ──────────────────────────────────
function NetworkTopology({ isAttackActive, attackType, sensorOn }) {
  const Node = ({ icon: Icon, label, subtext, type }) => {
    let bg = 'bg-slate-100 dark:bg-slate-900/50';
    let border = 'border-slate-200 dark:border-slate-800';
    let text = 'text-slate-600 dark:text-slate-400';
    let sub = 'text-slate-500 dark:text-slate-500';
    let iconCol = 'text-slate-500 dark:text-slate-500';

    if (type === 'attacker') {
      bg = 'bg-rose-50 dark:bg-rose-950/20'; border = 'border-rose-400 dark:border-rose-500/40'; text = 'text-rose-700 dark:text-rose-400'; sub = 'text-rose-600 dark:text-rose-400'; iconCol = 'text-rose-600 dark:text-rose-400';
    } else if (type === 'victim') {
      bg = 'bg-amber-50 dark:bg-amber-950/30'; border = 'border-amber-400 dark:border-amber-500/30'; text = 'text-amber-700 dark:text-amber-400'; sub = 'text-amber-600 dark:text-amber-400'; iconCol = 'text-amber-600 dark:text-amber-400';
    } else if (type === 'normal') {
      bg = 'bg-blue-50 dark:bg-blue-950/20'; border = 'border-blue-400 dark:border-blue-500/30'; text = 'text-blue-700 dark:text-blue-400'; sub = 'text-blue-600 dark:text-blue-400'; iconCol = 'text-blue-600 dark:text-blue-400';
    } else if (type === 'mitigated') {
      bg = 'bg-emerald-50 dark:bg-emerald-950/20'; border = 'border-emerald-400 dark:border-emerald-500/30'; text = 'text-emerald-700 dark:text-emerald-400'; sub = 'text-emerald-600 dark:text-emerald-400'; iconCol = 'text-emerald-600 dark:text-emerald-400';
    }

    return (
      <div className="flex flex-col items-center gap-1.5 w-16 sm:w-24">
        <div className={`w-10 sm:w-14 h-10 sm:h-14 rounded-xl flex items-center justify-center border shadow-sm transition-all duration-300 ${bg} ${border}`}>
          <Icon className={`w-5 sm:w-6 h-5 sm:h-6 ${iconCol}`} />
        </div>
        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-center leading-tight ${text}`}>{label}</span>
        {subtext && <span className={`text-[8px] sm:text-[9px] font-mono font-semibold ${sub} text-center leading-tight`}>{subtext}</span>}
      </div>
    );
  };

  const Arrow = ({ label, type, dir = 'right' }) => {
    let line = 'bg-slate-300 dark:bg-slate-700';
    let text = 'text-slate-500 dark:text-slate-400';
    let head = 'text-slate-300 dark:text-slate-700';
    let animate = false;

    if (type === 'attack') {
      line = 'bg-rose-400 dark:bg-rose-500'; text = 'text-rose-600 dark:text-rose-400'; head = 'text-rose-400 dark:text-rose-500'; animate = true;
    } else if (type === 'mitigated') {
      line = 'bg-emerald-400 dark:bg-emerald-500'; text = 'text-emerald-600 dark:text-emerald-400'; head = 'text-emerald-400 dark:text-emerald-500';
    } else if (type === 'normal') {
      line = 'bg-blue-300 dark:bg-blue-700'; text = 'text-blue-600 dark:text-blue-400'; head = 'text-blue-300 dark:text-blue-700';
    }

    return (
      <div className="flex flex-col items-center relative mx-1 sm:mx-4">
        <div className="relative flex items-center">
          {dir === 'left' && <div className={`w-0 h-0 border-t-[4px] sm:border-t-[5px] border-b-[4px] sm:border-b-[5px] border-r-[5px] sm:border-r-[6px] border-transparent border-r-current ${head} mr-[-1px]`} />}
          <div className={`w-8 sm:w-16 h-[2px] sm:h-[3px] rounded-full ${line}`} />
          {dir === 'right' && <div className={`w-0 h-0 border-t-[4px] sm:border-t-[5px] border-b-[4px] sm:border-b-[5px] border-l-[5px] sm:border-l-[6px] border-transparent border-l-current ${head} ml-[-1px]`} />}
          {dir === 'both' && (
            <>
              <div className={`absolute left-0 w-0 h-0 border-t-[4px] sm:border-t-[5px] border-b-[4px] sm:border-b-[5px] border-r-[5px] sm:border-r-[6px] border-transparent border-r-current ${head}`} />
              <div className={`absolute right-0 w-0 h-0 border-t-[4px] sm:border-t-[5px] border-b-[4px] sm:border-b-[5px] border-l-[5px] sm:border-l-[6px] border-transparent border-l-current ${head}`} />
            </>
          )}
        </div>
        
        {label && (
          <span className={`absolute -top-4 sm:-top-5 text-[7px] sm:text-[9px] font-mono font-semibold whitespace-nowrap ${text} ${animate ? 'animate-pulse' : ''}`}>
            {label}
          </span>
        )}
        {type === 'mitigated' && (
          <div className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2">
            <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 dark:text-emerald-400 animate-bounce" />
          </div>
        )}
      </div>
    );
  };

  if (!isAttackActive) {
    return (
      <div className="flex items-start sm:items-center justify-center py-4 sm:py-2 overflow-x-auto">
        <Node icon={Laptop} label="Client" subtext="Connected" type="normal" />
        <div className="mt-3 sm:mt-0"><Arrow label="Legitimate Traffic" type="normal" dir="both" /></div>
        <Node icon={Router} label="Access Point" subtext="Gateway" type="neutral" />
      </div>
    );
  }

  if (attackType === 'DEAUTH') {
    return (
      <div className="flex items-start sm:items-center justify-center py-4 sm:py-2 overflow-x-auto">
        <Node icon={WifiOff} label="Attacker" subtext="Deauth Flood" type="attacker" />
        <div className="mt-3 sm:mt-0"><Arrow label="Spoofed Deauths" type="attack" dir="right" /></div>
        <Node icon={Laptop} label="Client" subtext="Disconnecting" type="victim" />
      </div>
    );
  }

  if (attackType === 'ROGUE_AP') {
    return (
      <div className="flex items-start sm:items-center justify-center py-4 sm:py-2 overflow-x-auto">
        <Node icon={Router} label="Rogue AP" subtext="Evil Twin" type="attacker" />
        <div className="mt-3 sm:mt-0"><Arrow label="Fake Beacons" type="attack" dir="left" /></div>
        <Node icon={Laptop} label="Client" subtext="Tricked" type="victim" />
      </div>
    );
  }

  if (attackType === 'MAC_SPOOF') {
    return (
      <div className="flex items-start sm:items-center justify-center py-4 sm:py-2 overflow-x-auto">
        <Node icon={Laptop} label="Attacker" subtext="Spoofed MAC" type="attacker" />
        <div className="mt-3 sm:mt-0"><Arrow label="Bypassing ACL" type="attack" dir="right" /></div>
        <Node icon={Router} label="Access Point" subtext="Fooled" type="victim" />
      </div>
    );
  }

  if (attackType === 'ARP_SPOOF') {
    return (
      <div className="flex items-start sm:items-center justify-center py-4 sm:py-2 overflow-x-auto">
        <Node icon={Laptop} label="Client" subtext="Poisoned ARP" type="victim" />
        <div className="mt-3 sm:mt-0"><Arrow label="Intercepted" type="attack" dir="right" /></div>
        <Node icon={AlertTriangle} label="Attacker" subtext="MITM" type="attacker" />
        <div className="mt-3 sm:mt-0"><Arrow label="Forwarded" type="attack" dir="right" /></div>
        <Node icon={Router} label="Gateway" subtext="Unaware" type="neutral" />
      </div>
    );
  }

  return null;
}

// ─── Stats Bar ─────────────────────────────────────────────────
function StatsBar({ packets, totalCaptured, isAttackActive, attackType, sensorOn, sensorChannel, targetChannel }) {
  const total = packets.length;
  const attackPkts = packets.filter(p => p.isAttack).length;
  const normalPkts = total - attackPkts;
  const detected = isAttackActive && sensorOn && sensorChannel === targetChannel;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900 shadow-sm text-center card-pop">
        <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{totalCaptured}</p>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider mt-1 font-semibold">Total seen</p>
      </div>
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900 shadow-sm text-center card-pop">
        <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-300 font-mono">{total}</p>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider mt-1 font-semibold">In buffer</p>
      </div>
      <div className="p-5 rounded-xl border border-blue-200 dark:border-slate-800 bg-gradient-to-b from-blue-50/60 to-white dark:from-slate-900 dark:to-slate-900 shadow-sm text-center card-pop">
        <p className={`text-xl sm:text-2xl font-extrabold font-mono ${normalPkts > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>{normalPkts}</p>
        <p className="text-[10px] sm:text-xs text-blue-600/70 dark:text-slate-500 uppercase tracking-wider mt-1 font-semibold">Normal</p>
      </div>
      <div className="p-5 rounded-xl border border-rose-200 dark:border-slate-800 bg-gradient-to-b from-rose-50/60 to-white dark:from-slate-900 dark:to-slate-900 shadow-sm text-center card-pop">
        <p className={`text-xl sm:text-2xl font-extrabold font-mono ${attackPkts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-300 dark:text-slate-600'}`}>{attackPkts}</p>
        <p className="text-[10px] sm:text-xs text-rose-600/70 dark:text-slate-500 uppercase tracking-wider mt-1 font-semibold">{detected ? 'Attacks' : 'Anomalies'}</p>
      </div>
    </div>
  );
}

// ─── Detection Badge ────────────────────────────────────────────
function DetectionBadge({ isAttackActive, attackType, sensorOn, sensorChannel, targetChannel }) {
  const canSee = isAttackActive && sensorOn && sensorChannel === targetChannel;
  if (!canSee && !isAttackActive) return null;
  if (!sensorOn) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" /> Sensor offline
    </div>
  );
  if (isAttackActive && sensorOn && sensorChannel !== targetChannel) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-400 dark:border-amber-500/20 text-xs font-medium text-amber-800 dark:text-amber-400 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Wrong channel — tune to Ch {targetChannel}
    </div>
  );
  if (canSee) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-400 dark:border-rose-500/20 text-xs font-medium text-rose-700 dark:text-rose-400 shadow-sm animate-pulse">
      <div className="w-2 h-2 rounded-full bg-rose-500" />
      {
        attackType === 'DEAUTH' ? 'Deauth flood detected' : 
        attackType === 'ROGUE_AP' ? 'Rogue AP detected' : 
        attackType === 'MAC_SPOOF' ? 'MAC spoofing detected' : 
        'ARP spoofing detected'
      }
    </div>
  );
  return null;
}

// ─── Packet Detail Modal ───────────────────────────────────────
function PacketDetail({ pkt, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-bounce-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Terminal className="w-4 h-4 text-blue-500" /> Packet Details</h3>
          <button onClick={onClose} aria-label="Close packet details"><X className="w-4 h-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" /></button>
        </div>
        <div className="p-4 font-mono text-xs sm:text-sm space-y-3">
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
              <span className="text-slate-500 dark:text-slate-500 w-32 flex-shrink-0 text-xs uppercase tracking-wider font-semibold">{label}</span>
              <span className={`${label === 'Frame Subtype' && pkt.isAttack ? 'text-rose-600 dark:text-rose-400 font-bold' : label === 'Status' && pkt.isBlocked ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>{value}</span>
            </div>
          ))}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Raw format</p>
            <div className="bg-slate-100 dark:bg-slate-950 rounded-lg p-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-200 dark:border-slate-900 font-mono">
              [{pkt.timestamp}] {pkt.source} → {pkt.dest} [{pkt.subtype}] {pkt.info}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function SimulationDashboard({ isAttackActive, attackType, setAttackState }) {
  const [sensorOn, setSensorOn] = useState(false);
  const [sensorChannel, setSensorChannel] = useState(1);
  const [filter, setFilter] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [detailPkt, setDetailPkt] = useState(null);
  const consoleRef = useRef(null);

  const { packets, totalCaptured } = useSimulation(isAttackActive, attackType, sensorOn, sensorChannel, intensity);
  const targetChannel = 6;
  const latestRssi = packets.length > 0 ? packets[0].rssi : -60;

  useEffect(() => {
    if (consoleRef.current && packets.length > 0) consoleRef.current.scrollTop = 0;
  }, [packets]);

  const triggerAttack = useCallback((type) => {
    if (isAttackActive && attackType === type) setAttackState(false, null);
    else setAttackState(true, type);
  }, [isAttackActive, attackType, setAttackState]);

  const handleReset = () => {
    setSensorOn(false);
    setSensorChannel(1);
    setAttackState(false, null);
    setIntensity('medium');
    setFilter('');
  };

  const clearConsole = () => { setAttackState(false, null); };

  const exportLogs = () => {
    const lines = packets.map(p => `[${p.timestamp}] ${p.source} → ${p.dest} [${p.subtype}] ${p.info} (${p.rssi}dBm)${p.isBlocked ? ' [BLOCKED]' : ''}`);
    const text = `WIDS Session Log\n${'='.repeat(60)}\nSensor: ${sensorOn ? 'ONLINE' : 'OFFLINE'} | Channel: ${sensorChannel} | Intensity: ${intensity}\n${'='.repeat(60)}\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const filteredPackets = filter.trim()
    ? packets.filter(p => p.source.toLowerCase().includes(filter.toLowerCase()) || p.dest.toLowerCase().includes(filter.toLowerCase()) || p.subtype.toLowerCase().includes(filter.toLowerCase()) || p.info.toLowerCase().includes(filter.toLowerCase()))
    : packets;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ─── 1. Hardware Control Panel ─── */}
      <div className="p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow card-pop relative overflow-hidden">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-200 mb-4 flex items-center">
          <Settings className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-blue-600 dark:text-blue-500" /> 1. Configure Hardware
        </h2>
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="flex-1 sm:bg-slate-50/80 dark:sm:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <button
                onClick={() => setSensorOn(!sensorOn)}
                aria-label={sensorOn ? 'Power off ESP32 sensor' : 'Power on ESP32 sensor'}
                className={`w-14 sm:w-16 h-14 sm:h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 flex-shrink-0 btn-press ${
                  sensorOn ? 'bg-blue-600 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 shadow-inner'
                }`}
              >
                <Power className={`w-6 sm:w-8 h-6 sm:h-8 transition-colors ${sensorOn ? 'text-white dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
              </button>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-2">ESP32 Power</h3>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5 sm:mt-1">
                  Status: {sensorOn ? <span className="text-blue-600 dark:text-blue-400">ONLINE</span> : <span className="text-slate-500">OFFLINE</span>}
                </p>
              </div>
            </div>
            <div className="bg-blue-50/80 dark:bg-blue-950/30 border-l-3 border-blue-500 p-3 text-xs text-slate-700 dark:text-slate-300 rounded-r">
              <strong className="flex items-center text-blue-700 dark:text-blue-400 mb-1">
                <Lightbulb className="w-3 h-3 mr-1" /> Knowledge: Promiscuous Mode
              </strong>
              Normally, Wi-Fi chips ignore traffic not meant for them. Powering this sensor activates <strong className="text-slate-900 dark:text-white">"Promiscuous Mode"</strong>, forcing it to eavesdrop on <em>every</em> invisible frame flying through the air.
            </div>
          </div>

          <div className="flex-1 sm:bg-slate-50/80 dark:sm:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-300 flex items-center">
                <Sliders className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-500" /> Radio Frequency Tuning
              </label>
              {sensorOn && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:block"><RssiHistory packets={packets} /></div>
                  <SignalMeter rssi={latestRssi} />
                </div>
              )}
            </div>
            <div className="flex gap-4 items-center mb-4">
              <input type="range" min="1" max="11" value={sensorChannel} onChange={(e) => setSensorChannel(Number(e.target.value))} disabled={!sensorOn} aria-label="Sensor channel selector" className="flex-1 accent-blue-600 dark:accent-blue-500 disabled:opacity-50" />
              <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-mono px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-500/20 text-sm font-semibold min-w-[80px] text-center">
                CH {sensorChannel}
              </span>
            </div>

            {/* Channel Spectrum Visualizer */}
            <ChannelSpectrum sensorChannel={sensorChannel} targetChannel={targetChannel} isAttackActive={isAttackActive} sensorOn={sensorOn} />

            <div className="bg-blue-50/80 dark:bg-blue-950/30 border-l-3 border-blue-500 p-3 text-xs text-slate-700 dark:text-slate-300 rounded-r mt-4">
               <strong className="flex items-center text-blue-700 dark:text-blue-400 mb-1">
                 <Lightbulb className="w-3 h-3 mr-1" /> Knowledge: Wi-Fi Channels
               </strong>
               Wi-Fi transmits over radio frequencies divided into "Channels" (1 through 11 in the 2.4GHz band). If the attacker is striking Channel 6, but your sensor is tuned to Channel 1, you won't detect the attack! <strong className="text-slate-900 dark:text-white">Hint: Tune to Channel 6.</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Attack Control Panel ─── */}
      <div className="p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-200 flex items-center">
            <MonitorPlay className="mr-2 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-500" /> <span>2. Threat Generator</span>
          </h2>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <DetectionBadge isAttackActive={isAttackActive} attackType={attackType} sensorOn={sensorOn} sensorChannel={sensorChannel} targetChannel={targetChannel} />
            <button onClick={handleReset} aria-label="Reset the simulation to default state" className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-colors focus:ring-2 focus:ring-slate-500/50 flex items-center shadow-sm btn-press text-xs sm:text-sm">
              <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Reset Simulation</span><span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>

        {/* Attack Intensity */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 text-sm flex-wrap">
          <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-500 font-bold uppercase tracking-wider">Intensity:</span>
          {['low', 'medium', 'high'].map(level => (
            <button key={level} onClick={() => setIntensity(level)} className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-all btn-press ${intensity === level ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-400 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300'}`}>
              {level === 'low' ? '🐌 Low' : level === 'medium' ? '⚡ Medium' : '🔥 High'}
            </button>
          ))}
          <span className="text-xs text-slate-500 dark:text-slate-500 font-mono ml-2">Attack rate: <span className="text-slate-700 dark:text-slate-300 font-semibold">{intensity === 'low' ? '0.8/s' : intensity === 'medium' ? '1.6/s' : '5/s'}</span></span>
        </div>

        {/* Network Topology Visual */}
        {(sensorOn || isAttackActive) && (
          <div className="mb-5 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-wider">Network Topology</span>
              {!sensorOn && <span className="text-[9px] text-slate-500 font-medium">(sensor offline)</span>}
              {sensorOn && !isAttackActive && <span className="text-[9px] text-emerald-600 animate-pulse">monitoring...</span>}
            </div>
            <NetworkTopology isAttackActive={isAttackActive} attackType={attackType} sensorOn={sensorOn} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: 'DEAUTH', icon: WifiOff, label: 'Kick User', desc: 'Deauthentication: Forges a fake "disconnect" command to force a target offline.', emoji: '💥', border: 'border-rose-400 dark:border-rose-500/30', activeText: 'text-rose-600 dark:text-rose-400', activeBg: 'bg-rose-50 dark:bg-rose-950/20' },
            { type: 'ROGUE_AP', icon: ShieldAlert, label: 'Fake Network', desc: 'Rogue AP / Evil Twin: Broadcasts a fake Wi-Fi name (SSID) to trick victims.', emoji: '🎭', border: 'border-amber-400 dark:border-amber-500/30', activeText: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-50 dark:bg-amber-950/20' },
            { type: 'MAC_SPOOF', icon: Activity, label: 'Identity Theft', desc: 'MAC Spoofing: Copies a trusted MAC address to bypass security filters.', emoji: '👤', border: 'border-blue-400 dark:border-blue-500/30', activeText: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-50 dark:bg-blue-950/20' },
            { type: 'ARP_SPOOF', icon: AlertTriangle, label: 'Man-in-the-Middle', desc: 'ARP Spoofing: Links the attacker\'s MAC to the gateway\'s IP to intercept traffic.', emoji: '🕷️', border: 'border-emerald-400 dark:border-emerald-500/30', activeText: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-50 dark:bg-emerald-950/20' },
          ].map(btn => {
            const Icon = btn.icon;
            const isActive = isAttackActive && attackType === btn.type;
            return (
              <button key={btn.type} onClick={() => triggerAttack(btn.type)} aria-label={`Trigger ${btn.label} attack`}
                className={`p-4 rounded-xl text-left transition-all duration-300 flex flex-col justify-start h-full btn-press ${isActive ? `${btn.activeBg} ${btn.border} border-2 shadow-md` : 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-sm'}`}
              >
                <div className="font-bold mb-2 flex items-center text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  <span className="text-base sm:text-lg mr-1.5 sm:mr-2">{btn.emoji}</span>
                  <Icon className={`mr-1.5 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5 ${isActive ? btn.activeText : 'text-slate-500'}`} /> {btn.label}
                  {isActive && <span className={`ml-2 w-2 h-2 rounded-full ${isActive ? btn.activeText.replace('text-', 'bg-') : ''} animate-pulse`} />}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 mt-auto leading-relaxed">{btn.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Stats Bar ─── */}
      {(sensorOn || isAttackActive) && (
        <div className="p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow card-pop relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200 mb-2">Live Packet Statistics</h3>
            {packets.length > 0 && <span className="text-[10px] text-slate-500 dark:text-slate-600 font-mono">Click a packet for details</span>}
          </div>
          <StatsBar packets={packets} totalCaptured={totalCaptured} isAttackActive={isAttackActive} attackType={attackType} sensorOn={sensorOn} sensorChannel={sensorChannel} targetChannel={targetChannel} />
          <PacketDistribution packets={packets} />
        </div>
      )}

      {/* ─── 3. Live Terminal Log ─── */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 font-mono text-sm overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 p-2 sm:p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-200 flex items-center">
              <Terminal className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-500 flex-shrink-0" /> <span className="hidden sm:inline">3. Live Sensor Output Console</span><span className="sm:hidden">Console</span>
            </span>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {packets.length > 0 && (
                <>
                  <button onClick={exportLogs} aria-label="Copy session logs to clipboard" className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 sm:px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-800 flex items-center gap-1 transition-colors btn-press hover:shadow-sm">
                    <Download className="w-3 h-3" /> <span className="hidden sm:inline">Copy</span>
                  </button>
                  <button onClick={clearConsole} aria-label="Clear console and stop attack" className="bg-white dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-400 px-1.5 sm:px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-800 flex items-center gap-1 transition-colors btn-press hover:text-rose-600 hover:shadow-sm">
                    <Trash2 className="w-3 h-3" /> <span className="hidden sm:inline">Clear</span>
                  </button>
                </>
              )}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-650" />
                <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..." aria-label="Filter console packets" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-300 pl-8 pr-3 py-1.5 w-24 sm:w-32 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-400 dark:placeholder-slate-600 transition-colors shadow-sm" />
              </div>
              <span className="bg-blue-50 dark:bg-slate-950 px-2 py-1 rounded-lg text-[10px] sm:text-xs text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-950/55 hidden sm:inline">Src</span>
              <span className="bg-indigo-50 dark:bg-slate-950 px-2 py-1 rounded-lg text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-950/55 hidden sm:inline">Dst</span>
              <span className="bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-lg text-[10px] sm:text-xs text-slate-700 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-800">Ch:{sensorChannel}</span>
            </div>
          </div>
        </div>

        {isAttackActive && sensorOn && sensorChannel !== targetChannel && (
           <div className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 p-2 text-center text-xs sm:text-sm font-semibold border-b border-amber-300 dark:border-amber-500/20 animate-pulse flex items-center justify-center gap-2">
             <AlertTriangle className="w-4 h-4 flex-shrink-0" /> <span>SIGNAL: Traffic spike on Ch {targetChannel}! Tune to CH {targetChannel}!</span>
           </div>
        )}

        <div ref={consoleRef} className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1 max-h-48 min-h-[12rem]">
          {!sensorOn ? (
             <div className="text-rose-600 dark:text-rose-500 font-semibold flex flex-col items-center justify-center h-48">
               <span className="text-base">[SENSOR OFFLINE]</span>
               <span className="text-xs font-normal mt-2 text-slate-500 text-center max-w-sm">
                 Power on the ESP32 in Step 1 to activate Promiscuous Mode.
               </span>
             </div>
          ) : filteredPackets.length === 0 ? (
            <div className="text-slate-500 italic flex items-center justify-center h-48">
              {filter ? <span>No packets match "<span className="text-slate-600 dark:text-slate-400">{filter}</span>"</span> : <span className="animate-pulse text-sm">Scanning radio waves on Channel {sensorChannel}...</span>}
            </div>
          ) : (
            filteredPackets.map((pkt) => (
              <button key={pkt.id} onClick={() => setDetailPkt(pkt)}
                className={`w-full text-left text-slate-800 dark:text-slate-300 border-b border-slate-200/70 dark:border-slate-900 py-1.5 sm:py-2 hover:bg-white dark:hover:bg-slate-900/50 transition-colors cursor-pointer rounded px-2 text-xs sm:text-sm ${pkt.isBlocked ? 'opacity-50' : ''}`}
              >
                <span className="text-slate-500 dark:text-slate-500 mr-2">[{pkt.timestamp}]</span>
                <span className="text-blue-700 dark:text-blue-400 font-semibold break-all">{pkt.source}</span>
                <span className="text-slate-400 dark:text-slate-650 mx-1.5 sm:mx-2">→</span>
                <span className="text-indigo-700 dark:text-indigo-400 font-semibold break-all">{pkt.dest}</span>
                <span className={`mx-2 sm:mx-3 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${pkt.isBlocked ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' : pkt.isAttack ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-850'}`}>
                  [{pkt.subtype}]
                </span>
                <span className={`${pkt.isBlocked ? 'text-emerald-600 dark:text-emerald-550 line-through' : 'text-slate-700 dark:text-slate-300'} break-all`}>{pkt.info}</span>
                <span className="text-xs text-slate-500 dark:text-slate-600 ml-2">{pkt.rssi}dBm</span>
              </button>
            ))
          )}
          {filter && filteredPackets.length < packets.length && (
            <div className="text-[10px] text-slate-500 dark:text-slate-600 text-center py-1 font-medium">Showing {filteredPackets.length} of {packets.length} packets</div>
          )}
        </div>
      </div>

      {detailPkt && <PacketDetail pkt={detailPkt} onClose={() => setDetailPkt(null)} />}
    </div>
  );
}