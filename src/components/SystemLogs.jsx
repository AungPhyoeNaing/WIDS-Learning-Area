import React from 'react';
import { Database, Terminal, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function SystemLogs() {
  return (
    <div className="glass-card p-4 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-md">
      <h2 className="text-xl sm:text-3xl font-bold text-cyber-pink mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
        <Database className="w-6 sm:w-10 h-6 sm:h-10" /> Understanding System Logs
      </h2>
      
      <div className="space-y-8 text-slate-300 leading-relaxed">
        <p className="text-lg">
          The console logs in the <strong>Live Simulation</strong> tab are the direct output of our detection engine. Learning to read these logs is the core skill of a WIDS operator. Here is a breakdown of what the system outputs and why.
        </p>

        <section className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyber-cyan" />
            <h3 className="font-bold text-white">Log Entry Anatomy</h3>
          </div>
          <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm">
            <div className="flex flex-wrap gap-2 items-center bg-black/50 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-500">[14:05:22]</span>
              <span className="text-emerald-400">AA:BB:CC:DD:EE:FF</span>
              <span className="text-slate-600">→</span>
              <span className="text-blue-400">FF:FF:FF:FF:FF:FF</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-600">[Dot11Deauth]</span>
              <span className="text-slate-300">Reason Code 7</span>
              <span className="text-slate-500 text-xs">-45dBm</span>
            </div>

            <div className="flex flex-wrap gap-2 items-center bg-black/50 p-3 rounded-lg border border-slate-700 mt-2">
              <span className="text-slate-500">[14:08:45]</span>
              <span className="text-emerald-400">CC:CC:CC:CC:CC:CC</span>
              <span className="text-slate-600">→</span>
              <span className="text-blue-400">11:22:33:44:55:66</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-600">[ARP Reply]</span>
              <span className="text-slate-300">Gateway 192.168.1.1 is at CC:CC:CC:CC:CC:CC</span>
              <span className="text-slate-500 text-xs">-32dBm</span>
            </div>
            
            <div className="mt-6 grid gap-3 text-xs">
              <div className="flex items-start gap-4">
                <strong className="text-slate-500 w-24">Timestamp:</strong>
                <span className="text-slate-400">When the packet was captured by the ESP32.</span>
              </div>
              <div className="flex items-start gap-4">
                <strong className="text-emerald-400 w-24">Source MAC:</strong>
                <span className="text-slate-400">The hardware address of the sender (often spoofed by attackers).</span>
              </div>
              <div className="flex items-start gap-4">
                <strong className="text-blue-400 w-24">Dest MAC:</strong>
                <span className="text-slate-400">The target. FF:FF:FF:FF:FF:FF is a broadcast address (everyone).</span>
              </div>
              <div className="flex items-start gap-4">
                <strong className="text-slate-300 w-24">Subtype:</strong>
                <span className="text-slate-400">The 802.11 frame type. E.g., Beacon, Probe Req, Dot11Deauth.</span>
              </div>
              <div className="flex items-start gap-4">
                <strong className="text-slate-500 w-24">RSSI:</strong>
                <span className="text-slate-400">Signal strength. Higher negative numbers (e.g., -30) mean the sender is physically closer to the sensor.</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-white mb-4">Event Severity Levels</h3>
          <div className="grid gap-3 sm:gap-4">
            <div className="flex gap-3 sm:gap-4 items-start bg-slate-900/40 p-3 sm:p-4 rounded-xl border-l-4 border-slate-500">
              <Info className="w-5 sm:w-6 h-5 sm:h-6 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300 block mb-1 text-sm sm:text-base">INFO (Normal Traffic)</strong>
                <p className="text-xs sm:text-sm text-slate-400">Standard beacons from routers or probe requests from phones. The system ignores these unless they form an anomaly pattern.</p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 items-start bg-red-900/20 p-3 sm:p-4 rounded-xl border-l-4 border-red-500">
              <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-400 block mb-1 text-sm sm:text-base">WARN (Malicious Activity)</strong>
                <p className="text-xs sm:text-sm text-slate-400">A signature match. For example, detecting a Deauth frame (which should rarely happen in high volumes). This triggers UI alerts and the physical buzzer.</p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 items-start bg-emerald-900/20 p-3 sm:p-4 rounded-xl border-l-4 border-emerald-500">
              <CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-400 block mb-1 text-sm sm:text-base">SECURE (Mitigation Active)</strong>
                <p className="text-xs sm:text-sm text-slate-400">When mitigation is deployed, the engine creates a dynamic firewall rule. Packets matching the attacker's source MAC are dropped and logged with a strike-through.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}