import React, { useState } from 'react';
import { ShieldAlert, BellRing, Lock, FileCode2 } from 'lucide-react';
import Accordion from './Accordion';

export default function PhysicalDeterrence() {
  const [openSection, setOpenSection] = useState(0);
  const toggleSection = (idx) => setOpenSection(openSection === idx ? -1 : idx);

  return (
    <div className="glass-card p-4 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-md relative overflow-hidden animate-fade-in-up">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
      
      <div className="mb-8">
        <h2 className="text-xl sm:text-3xl font-bold text-red-500 mb-2 flex items-center gap-2 sm:gap-3">
          <ShieldAlert className="w-6 sm:w-10 h-6 sm:h-10" /> Course 4: Physical Deterrence
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          Bridging the gap between digital attacks and physical reality. How the WIDS fights back in the physical world.
        </p>
      </div>

      <div className="space-y-2">
        <Accordion title="4.1 The Psychology of Local Deterrence" icon={Lock} isOpen={openSection === 0} onClick={() => toggleSection(0)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              In environments like internet cafes, the attacker is often physically present in the same room. A traditional firewall dropping packets does nothing to discourage the attacker from trying new methods.
            </p>
            <p>
              Our WIDS implements <strong>Active Physical Deterrence</strong>. When a high-severity attack (like a Deauth Flood) is detected, the system triggers a loud hardware buzzer and flashing LED lights.
            </p>
            <p>
              This instantly strips the attacker of their anonymity. The psychological pressure of knowing the shop owner has been alerted usually stops script-kiddies immediately, protecting the network proactively.
            </p>
          </div>
        </Accordion>

        <Accordion title="4.2 Python-to-Hardware Control" icon={FileCode2} isOpen={openSection === 1} onClick={() => toggleSection(1)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              To trigger the alarm, our Python backend must send a command back down the serial pipeline to the hardware sensor. We use a simple command syntax, like sending the string <code>"ALARM_ON"</code> over the `pyserial` connection.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-300 mt-2">
              <span className="text-cyber-purple">def</span> <span className="text-blue-400">trigger_physical_alarm</span>(severity_level):<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-cyber-purple">if</span> severity_level == <span className="text-emerald-400">'CRITICAL'</span>:<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-500"># Send serial command to activate the ESP32 buzzer GPIO</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sensor.write(<span className="text-emerald-400">b"ALARM_ON\n"</span>)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">print</span>(<span className="text-emerald-400">"[!] Critical Attack! Deterrence activated."</span>)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-cyber-purple">elif</span> severity_level == <span className="text-emerald-400">'WARNING'</span>:<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-500"># Flash warning LEDs only</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sensor.write(<span className="text-emerald-400">b"LED_WARN\n"</span>)
            </div>
            <p className="mt-4">
              Upon receiving this command, the C++ code running on the ESP32 immediately pulls the designated GPIO pin HIGH, providing 3.3V to the buzzer circuit.
            </p>
          </div>
        </Accordion>

        <Accordion title="4.3 Escalation Matrices" icon={BellRing} isOpen={openSection === 2} onClick={() => toggleSection(2)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Not all alerts require a loud siren. An effective WIDS must escalate gracefully to avoid annoying the cafe owner with false positives.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Low Severity (e.g. Occasional Deauth):</strong> Dashboard UI alert only.</li>
              <li><strong>Medium Severity (e.g. Port Scan detected):</strong> Dashboard alert + silent Telegram/Discord webhook notification to the admin.</li>
              <li><strong>Critical Severity (e.g. Rogue AP / Evil Twin / Mass Deauth):</strong> Full physical buzzer activation + flashing LEDs.</li>
            </ul>
          </div>
        </Accordion>
      </div>
    </div>
  );
}
