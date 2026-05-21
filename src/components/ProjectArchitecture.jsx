import React from 'react';
import { Layers, ShieldCheck, Activity, Target } from 'lucide-react';

export default function ProjectArchitecture() {
  return (
    <div className="glass-card p-4 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink" />
      <h2 className="text-xl sm:text-3xl font-bold text-cyber-cyan mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
        <Layers className="w-6 sm:w-10 h-6 sm:h-10" /> WIDS Architecture
      </h2>
      
      <div className="space-y-8 text-slate-300 leading-relaxed">
        <section>
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Target className="w-6 h-6 text-cyber-purple" /> The Host-Based Paradigm
          </h3>
          <p className="mb-4">
            Traditional Intrusion Detection Systems (IDS) often sit at the core of a network, like a router or a switch, monitoring all passing traffic. While powerful, this requires expensive hardware and deep integration into the network infrastructure.
          </p>
          <p>
            Our WIDS project flips this model by adopting a <strong>Host-Based</strong> approach. Instead of monitoring the entire network from the center, the detection engine runs locally on a specific host (like a computer in a shared office or internet cafe). An external ESP32 sensor acts as the "eyes," feeding raw data directly to this local host.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
          <div className="bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300 hover:-translate-y-0.5">
            <h4 className="font-bold text-cyber-cyan mb-2 flex items-center gap-1.5 sm:gap-2">
              <span className="w-6 h-6 rounded-full bg-cyber-cyan/20 text-cyber-cyan text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <Activity className="w-4 sm:w-5 h-4 sm:h-5" /> Promiscuous Mode
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              Normally, a Wi-Fi card only processes packets addressed specifically to it. We reprogram the ESP32 to enter "Promiscuous Mode." In this state, it intercepts <em>every</em> radio wave passing through the air on its current channel, regardless of the intended destination.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-lg hover:shadow-[0_0_20px_rgba(255,45,149,0.1)] transition-all duration-300 hover:-translate-y-0.5">
            <h4 className="font-bold text-cyber-pink mb-2 flex items-center gap-1.5 sm:gap-2">
              <span className="w-6 h-6 rounded-full bg-cyber-pink/20 text-cyber-pink text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5" /> Dual-Engine Detection
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              Once packets are captured, they are sent to the Host via Serial connection. The host analyzes the packets using two methods:
              <br/><br/>
              <strong>Signature-Based:</strong> Looking for known malicious hex bytes (e.g., 0xC0 for Deauth or ARP opcode field).<br/>
              <strong>Anomaly-Based:</strong> Detecting abnormal behavior (e.g., 3000 deauth frames in 5 seconds or rapid ARP poisoning attempts).
            </p>
          </div>
        </div>

        <section className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-2xl border border-blue-500/30">
          <h3 className="text-lg font-bold text-white mb-2">The "Deterrence" Factor</h3>
          <p className="text-sm">
            What makes this project unique is its focus on physical environments like Myanmar internet cafes. When an attack is detected, the system doesn't just block it digitally; it can trigger an external hardware buzzer. This creates a physical, audible deterrence, alerting the shop owner and intimidating the attacker in the physical space.
          </p>
        </section>
      </div>
    </div>
  );
}