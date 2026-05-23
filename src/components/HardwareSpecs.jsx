import React, { useState } from 'react';
import { Cpu, Wifi, Zap, TerminalSquare, FileCode2 } from 'lucide-react';
import Accordion from './Accordion';

export default function HardwareSpecs() {
  const [openSection, setOpenSection] = useState(0);
  const toggleSection = (idx) => setOpenSection(openSection === idx ? -1 : idx);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" /> Course 3: Sensor Hardware
        </h2>
        <p className="text-slate-400 text-sm">
          Understanding the ESP32 RF capabilities and how to interface it with our Python backend using PySerial.
        </p>
      </div>

      <div className="space-y-2">
        <Accordion title="3.1 The ESP32 SoC Capabilities" icon={Wifi} isOpen={openSection === 0} onClick={() => toggleSection(0)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              The <strong>ESP32</strong> is a highly integrated Wi-Fi and Bluetooth System on a Chip (SoC). While normally used for IoT projects, we leverage its low-level radio access APIs.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>2.4 GHz Band:</strong> Supports 802.11 b/g/n. We program it to aggressively hop channels (1-11) or lock onto a specific channel to sniff management frames.</li>
              <li><strong>Antenna Specs (dBi):</strong> Standard ESP32 dev boards use a built-in PCB trace antenna (usually ~2 dBi gain). This gives an effective sniffing radius of about 15-20 meters indoors.</li>
              <li><strong>Offloading:</strong> By using the ESP32 strictly as an RF capture interface, the host computer does not need to drop its own Wi-Fi connection or fight with Windows driver limitations.</li>
            </ul>
          </div>
        </Accordion>

        <Accordion title="3.2 Python Host Integration (PySerial)" icon={FileCode2} isOpen={openSection === 1} onClick={() => toggleSection(1)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              The ESP32 transmits the captured packet metadata as JSON strings over a USB Serial connection at a high baud rate (115200). Our backend uses Python's <code>pyserial</code> library to ingest this data continuously.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-300 mt-2">
              <span className="text-indigo-400">import</span> serial<br/>
              <span className="text-indigo-400">import</span> json<br/>
              <span className="text-indigo-400">import</span> time<br/><br/>
              <span className="text-slate-500"># Open serial connection to the ESP32 sensor</span><br/>
              sensor = serial.Serial(<span className="text-emerald-400">'COM3'</span>, baudrate=<span className="text-blue-400">115200</span>, timeout=<span className="text-blue-400">1</span>)<br/><br/>
              <span className="text-indigo-400">def</span> <span className="text-blue-400">listen_to_sensor</span>():<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-400">while True</span>:<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-400">if</span> sensor.in_waiting &gt; <span className="text-blue-400">0</span>:<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;raw_line = sensor.readline().decode(<span className="text-emerald-400">'utf-8'</span>).strip()<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-400">try</span>:<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;packet = json.loads(raw_line)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;process_wids_packet(packet) <span className="text-slate-500"># Send to anomaly engine</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-400">except</span> json.JSONDecodeError:<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-400">pass</span>
            </div>
          </div>
        </Accordion>

        <Accordion title="3.3 Processing the Data Stream" icon={TerminalSquare} isOpen={openSection === 2} onClick={() => toggleSection(2)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Once the Python backend deserializes the JSON from the ESP32, it receives structured metadata containing the MAC addresses, RSSI (signal strength), and the exact packet subtype.
            </p>
            <p>
              By handling the heavy logic in Python rather than C++ on the ESP32, we can easily integrate advanced tracking algorithms, database storage (like Supabase or SQLite), and real-time dashboard updates via WebSockets.
            </p>
          </div>
        </Accordion>
      </div>
    </div>
  );
}