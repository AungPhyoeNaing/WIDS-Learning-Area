import React, { useState } from 'react';
import { Network, AlertTriangle, Shield, Search, FileCode2 } from 'lucide-react';
import Accordion from './Accordion';

export default function ProtocolSecurity() {
  const [openSection, setOpenSection] = useState(0);
  const toggleSection = (idx) => setOpenSection(openSection === idx ? -1 : idx);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-500" /> Course 2: Protocol Security
        </h2>
        <p className="text-slate-400 text-sm">
          A deep dive into the 802.11 MAC layer, frame structures, and how vulnerabilities in legacy protocols enable wireless attacks.
        </p>
      </div>

      <div className="space-y-2">
        <Accordion title="2.1 Anatomy of an 802.11 Frame" icon={FileCode2} isOpen={openSection === 0} onClick={() => toggleSection(0)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Wi-Fi packets (frames) are structurally different from standard Ethernet packets. A typical 802.11 Management Frame header consists of 24 bytes before the actual payload begins.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-400">
              <span className="text-blue-400">Frame Control (2B)</span> | 
              <span className="text-indigo-400"> Duration (2B)</span> | 
              <span className="text-emerald-400"> Addr1: Dest (6B)</span> | 
              <span className="text-slate-300"> Addr2: Source (6B)</span> | 
              <span className="text-slate-300"> Addr3: BSSID (6B)</span> | 
              <span className="text-amber-500"> Seq Ctrl (2B)</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-400 mt-2">
              # Example Hex of a Deauth Frame Header<br/>
              C0 00 3A 01 FF FF FF FF FF FF 11 22 33 44 55 66 11 22 33 44 55 66 00 00
            </div>
            <p className="mt-4">
              Our WIDS specifically targets the <strong>Frame Control</strong> byte. `C0` (Hex) in binary is `11000000`. The first two bits `00` mean it's a Management Frame, and the next four bits `1100` mean it is a Deauthentication subtype (Type 0, Subtype 12).
            </p>
          </div>
        </Accordion>

        <Accordion title="2.2 The Deauthentication Vulnerability" icon={Shield} isOpen={openSection === 1} onClick={() => toggleSection(1)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              In WPA2 networks, data frames are heavily encrypted using AES. However, to allow devices to connect and disconnect smoothly, <strong>Management Frames are sent entirely in plaintext</strong>. 
            </p>
            <p>
              An attacker uses tools like <code>aireplay-ng</code> or a custom ESP32 to forge the Source MAC address (Addr2) of the legitimate router, and sends a broadcast Deauth (Addr1 = <code>FF:FF:FF:FF:FF:FF</code>). The victim devices instantly obey the unencrypted command and disconnect from the network.
            </p>
            <p>
              <strong>WIDS Detection Strategy:</strong> Because Deauths are normal during roaming, our anomaly engine tracks the <em>frequency</em>. More than 10 Deauths per second triggers an immediate alert.
            </p>
          </div>
        </Accordion>

        <Accordion title="2.3 ARP Poisoning & MITM" icon={AlertTriangle} isOpen={openSection === 2} onClick={() => toggleSection(2)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              The Address Resolution Protocol (ARP) translates IP addresses to MAC addresses. It is inherently trust-based. If a device receives an ARP Reply, it caches the MAC address without verifying if the sender is actually authorized.
            </p>
            <ul className="list-decimal pl-5 space-y-2 mt-2">
              <li><strong>Step 1:</strong> Attacker broadcasts unsolicited ARP Replies.</li>
              <li><strong>Step 2:</strong> "I am 192.168.1.1 (Gateway), my MAC is Attack-MAC".</li>
              <li><strong>Step 3:</strong> "I am 192.168.1.100 (Victim), my MAC is Attack-MAC".</li>
              <li><strong>Result:</strong> Both the router and victim update their tables. All traffic flows through the attacker's machine.</li>
            </ul>
          </div>
        </Accordion>

        <Accordion title="2.4 Evil Twin & Rogue AP" icon={Search} isOpen={openSection === 3} onClick={() => toggleSection(3)}>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              An Evil Twin attack involves spinning up a malicious Access Point with the exact same SSID (name) as the legitimate network. Attackers often amplify their TX power to overpower the real router, forcing devices to auto-connect to the twin.
            </p>
            <p>
              <strong>WIDS Detection Strategy:</strong> The WIDS maintains a whitelist of known, authorized BSSIDs (hardware MAC addresses) paired with the cafe's SSID. If a Beacon frame is detected broadcasting the cafe's SSID but with an unknown BSSID, an alert is triggered.
            </p>
          </div>
        </Accordion>
      </div>
    </div>
  );
}
