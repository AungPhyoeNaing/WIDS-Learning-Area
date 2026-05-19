import React from 'react';
import { Cpu, Wifi, Zap, TerminalSquare } from 'lucide-react';

export default function HardwareSpecs() {
  return (
    <div className="glass-card p-4 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-md">
      <h2 className="text-xl sm:text-3xl font-bold text-cyber-lime mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
        <Cpu className="w-6 sm:w-10 h-6 sm:h-10" /> Hardware: The ESP32 Sensor
      </h2>
      
      <div className="space-y-8 text-slate-300 leading-relaxed">
        <p className="text-lg">
          At the physical layer of our WIDS lies the <strong>ESP32</strong>. It is not just a microcontroller; it is a highly integrated Wi-Fi and Bluetooth SoC (System on a Chip). For this project, it acts as our dedicated radio frequency packet sniffer.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-emerald-900/50 hover:border-emerald-500 transition-colors">
            <Wifi className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="font-bold text-white mb-2">2.4 GHz Band</h3>
            <p className="text-xs text-slate-400">
              The ESP32 operates on the 2.4 GHz ISM band, supporting 802.11 b/g/n protocols. It can be tuned to scan specific channels (1 through 11) to intercept management frames.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-blue-900/50 hover:border-blue-500 transition-colors">
            <Zap className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="font-bold text-white mb-2">Low Cost & Low Power</h3>
            <p className="text-xs text-slate-400">
              Unlike enterprise routers, the ESP32 costs only a few dollars and consumes very little power. This makes it feasible to deploy multiple sensors across an office to monitor different overlapping channels simultaneously.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-purple-900/50 hover:border-purple-500 transition-colors">
            <TerminalSquare className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-bold text-white mb-2">Serial Output</h3>
            <p className="text-xs text-slate-400">
              The ESP32 does not process the attacks itself. It strips the 802.11 frames down to their raw hex values and streams them over a USB Serial connection to the host Python/Node.js engine for heavy analysis.
            </p>
          </div>
        </div>

        <section className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700 mt-8">
          <h3 className="text-xl font-bold text-white mb-4">Why not just use the laptop's Wi-Fi card?</h3>
          <p className="text-sm mb-4">
            You might wonder why we need an external ESP32 when the host computer already has Wi-Fi. 
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400">
            <li><strong>Driver Limitations:</strong> Most consumer laptop Wi-Fi drivers, especially on Windows, heavily restrict or completely block Promiscuous Mode/Monitor Mode.</li>
            <li><strong>Connection Dropping:</strong> If a Wi-Fi card is put into Monitor Mode, it usually cannot connect to the internet at the same time. The host would lose connectivity.</li>
            <li><strong>Hardware Offloading:</strong> Offloading the sniffing to the ESP32 frees up the host computer's resources and provides a dedicated, predictable data stream.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}