import React, { useState } from 'react';
import { Layers, Target, Activity, ShieldCheck, Server, Cpu, Cable, MonitorPlay } from 'lucide-react';
import Accordion from './Accordion';

export default function ProjectArchitecture() {
  const [openSection, setOpenSection] = useState(0);

  const toggleSection = (idx) => {
    setOpenSection(openSection === idx ? -1 : idx);
  };

  return (
    <div className="glass-card p-4 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink" />
      
      <div className="mb-8">
        <h2 className="text-xl sm:text-3xl font-bold text-cyber-cyan mb-2 flex items-center gap-2 sm:gap-3">
          <Layers className="w-6 sm:w-10 h-6 sm:h-10" /> Course 1: WIDS Architecture
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          Understand the structural design, data pipelines, and core philosophies driving the Host-Based Wireless Intrusion Detection System.
        </p>
      </div>
      
      <div className="space-y-2">
        <Accordion title="1.1 The Host-Based Paradigm" icon={Target} isOpen={openSection === 0} onClick={() => toggleSection(0)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Traditional Network Intrusion Detection Systems (NIDS) like Cisco or Snort sit at the core of a network. They monitor traffic passing through central chokepoints (routers/switches). While powerful, this requires expensive hardware and deep, complex integration into the existing network infrastructure.
            </p>
            <p>
              Our WIDS project flips this model by adopting a <strong>Host-Based</strong> approach tailored for localized environments like internet cafes in Myanmar.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-400">
              <li><strong>Cost-Effective:</strong> Eliminates the need for enterprise-grade central networking gear.</li>
              <li><strong>Plug-and-Play:</strong> The detection engine runs locally on a standard PC. The sensor (ESP32) simply plugs into a USB port.</li>
              <li><strong>Physical Proximity:</strong> Because it is host-based, physical deterrence (like a buzzer on the host machine) directly affects the immediate physical area of the attack.</li>
            </ul>
          </div>
        </Accordion>

        <Accordion title="1.2 The End-to-End Data Pipeline" icon={Activity} isOpen={openSection === 1} onClick={() => toggleSection(1)}>
          <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              How does a malicious frame in the air turn into a dashboard alert? The architecture relies on a highly optimized, one-way pipeline.
            </p>
            
            {/* Visual Pipeline */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs sm:text-sm">
              <div className="flex flex-col items-center p-3 bg-slate-900 border border-slate-700 rounded-lg w-full sm:w-1/4">
                <MonitorPlay className="w-6 h-6 text-emerald-400 mb-2" />
                <span className="text-center">1. Airspace<br/><span className="text-slate-500 text-[10px]">802.11 RF</span></span>
              </div>
              <Cable className="w-5 h-5 text-slate-600 rotate-90 sm:rotate-0" />
              <div className="flex flex-col items-center p-3 bg-slate-900 border border-slate-700 rounded-lg w-full sm:w-1/4">
                <Cpu className="w-6 h-6 text-cyber-cyan mb-2" />
                <span className="text-center">2. ESP32<br/><span className="text-slate-500 text-[10px]">Promiscuous Rx</span></span>
              </div>
              <Cable className="w-5 h-5 text-slate-600 rotate-90 sm:rotate-0" />
              <div className="flex flex-col items-center p-3 bg-slate-900 border border-slate-700 rounded-lg w-full sm:w-1/4">
                <Server className="w-6 h-6 text-cyber-purple mb-2" />
                <span className="text-center">3. Python Host<br/><span className="text-slate-500 text-[10px]">Serial Parsing</span></span>
              </div>
              <Cable className="w-5 h-5 text-slate-600 rotate-90 sm:rotate-0" />
              <div className="flex flex-col items-center p-3 bg-slate-900 border border-slate-700 rounded-lg w-full sm:w-1/4">
                <ShieldCheck className="w-6 h-6 text-cyber-pink mb-2" />
                <span className="text-center">4. Dashboard<br/><span className="text-slate-500 text-[10px]">UI Alert</span></span>
              </div>
            </div>

            <p>
              The ESP32 is stripped of all high-level TCP/IP stack overhead. It is programmed in <strong>Promiscuous Mode</strong>, catching raw 802.11 management frames. It immediately converts these to a condensed hex string and pushes them over the USB Serial interface at a baud rate of 115200.
            </p>
          </div>
        </Accordion>

        <Accordion title="1.3 Dual-Engine Detection Logic" icon={ShieldCheck} isOpen={openSection === 2} onClick={() => toggleSection(2)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Once the Python backend receives the serial data, it runs the frames through a dual-engine analysis system.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 border-l-4 border-l-cyber-cyan">
                <h4 className="font-bold text-white mb-2">1. Signature-Based</h4>
                <p className="text-sm text-slate-400">
                  Compares incoming packets against known malicious static patterns. For example, if a packet's Frame Control byte is precisely <code>0xC0</code> (Deauth) and the reason code is <code>7</code>, it triggers an immediate signature match. Fast, but rigid.
                </p>
              </div>
              <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 border-l-4 border-l-cyber-purple">
                <h4 className="font-bold text-white mb-2">2. Anomaly-Based</h4>
                <p className="text-sm text-slate-400">
                  Maintains a rolling time-window of network events. If the frequency of certain frames exceeds a threshold (e.g., &gt;50 deauths per second, or multiple BSSIDs broadcasting the same SSID), the anomaly engine fires. Excellent for catching zero-day volumetric attacks.
                </p>
              </div>
            </div>
          </div>
        </Accordion>
      </div>
    </div>
  );
}