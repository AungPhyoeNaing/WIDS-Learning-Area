import React, { useState } from 'react';
import { Database, Search, ShieldAlert, FileCode2, Sliders } from 'lucide-react';
import Accordion from './Accordion';

export default function SystemLogs() {
  const [openSection, setOpenSection] = useState(0);
  const toggleSection = (idx) => setOpenSection(openSection === idx ? -1 : idx);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" /> Course 5: System Logs & Forensics
        </h2>
        <p className="text-slate-400 text-sm">
          Learn how to read raw WIDS logs, perform Python-based forensics, and tune the anomaly engine to reduce false positives.
        </p>
      </div>

      <div className="space-y-2">
        <Accordion title="5.1 Parsing the Raw Log" icon={Search} isOpen={openSection === 0} onClick={() => toggleSection(0)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              When an attack is detected, the Python engine generates a structured forensic log. Understanding this log is critical for threat hunting.
            </p>
            <div className="bg-slate-950 border-l-4 border-l-red-500 border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-300">
              [2024-10-27 14:32:01] [CRITICAL] [DEAUTH_FLOOD]<br/>
              Target: 1C:53:F9:AA:BB:CC (Victim Laptop)<br/>
              Source: 00:11:22:33:44:55 (Spoofed Router)<br/>
              RSSI: -45 dBm | Channel: 6 | Count: 152 frames/sec
            </div>
            <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-400 text-sm sm:text-base">
              <li><strong>RSSI (-45 dBm):</strong> Received Signal Strength Indicator. -45 is a very strong signal. This tells the admin the attacker is physically very close to the sensor.</li>
              <li><strong>MAC Spoofing:</strong> The Source MAC usually matches the legitimate router. You cannot ban this MAC, or you ban the router itself!</li>
            </ul>
          </div>
        </Accordion>

        <Accordion title="5.2 Forensic Automation in Python" icon={FileCode2} isOpen={openSection === 1} onClick={() => toggleSection(1)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              While the WIDS dashboard provides real-time alerts, we can use Python and pandas for retroactive threat hunting. We can write scripts to aggregate log files and spot long-term attacker patterns.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-300 mt-2">
              <span className="text-indigo-400">import</span> pandas <span className="text-indigo-400">as</span> pd<br/><br/>
              <span className="text-slate-500"># Load historic logs</span><br/>
              df = pd.read_csv(<span className="text-emerald-400">'wids_logs.csv'</span>)<br/><br/>
              <span className="text-slate-500"># Find the most targeted devices (top victims)</span><br/>
              top_targets = df[df[<span className="text-emerald-400">'attack_type'</span>] == <span className="text-emerald-400">'DEAUTH'</span>][<span className="text-emerald-400">'target_mac'</span>].value_counts()<br/>
              <span className="text-blue-400">print</span>(top_targets.head(<span className="text-blue-400">5</span>))<br/><br/>
              <span className="text-slate-500"># Calculate average signal strength of attacker</span><br/>
              avg_rssi = df[df[<span className="text-emerald-400">'attack_type'</span>] == <span className="text-emerald-400">'ROGUE_AP'</span>][<span className="text-emerald-400">'rssi'</span>].mean()<br/>
              <span className="text-blue-400">print</span>(<span className="text-emerald-400">{`f"Average Rogue AP RSSI: {avg_rssi} dBm"`}</span>)
            </div>
          </div>
        </Accordion>

        <Accordion title="5.3 False Positive Tuning" icon={Sliders} isOpen={openSection === 2} onClick={() => toggleSection(2)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              The hardest part of a WIDS is eliminating false positives. If the buzzer rings every time someone turns off their phone's Wi-Fi, the shop owner will just unplug the system.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 border-l-4 border-l-emerald-500">
                <h4 className="font-semibold text-slate-200 mb-2 text-sm sm:text-base">Normal Behavior</h4>
                <p className="text-xs sm:text-sm text-slate-400">
                  A device sending 1 or 2 Deauth frames when walking out of range or shutting down is completely normal. 
                </p>
              </div>
              <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 border-l-4 border-l-red-500">
                <h4 className="font-semibold text-slate-200 mb-2 text-sm sm:text-base">Malicious Behavior</h4>
                <p className="text-xs sm:text-sm text-slate-400">
                  An attacker running <code>aireplay-ng</code> will pump out dozens or hundreds of frames per second to ensure the victim drops the connection.
                </p>
              </div>
            </div>
            <p className="mt-4">
              <strong>The Python Threshold:</strong> The logic tracks a rolling buffer. <code>if frame_count &gt; 15 and time_elapsed &lt; 1.0</code>, then fire the alarm. Tuning these variables for the specific size of the cafe is crucial.
            </p>
          </div>
        </Accordion>
      </div>
    </div>
  );
}