import React from 'react';
import { Network, AlertTriangle, Shield, Search } from 'lucide-react';

export default function ProtocolSecurity() {
  return (
    <div className="glass-card p-4 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-md relative overflow-hidden animate-fade-in-up">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyber-purple to-blue-500" />
      <h2 className="text-xl sm:text-3xl font-bold text-purple-400 mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
        <Network className="w-6 sm:w-10 h-6 sm:h-10" /> Protocol Vulnerabilities
      </h2>
      
      <div className="space-y-8 text-slate-300 leading-relaxed">
        <p className="text-base sm:text-lg">
          To detect an intrusion, the WIDS must understand the underlying weaknesses of the 802.11 (Wi-Fi) and ARP protocols. Here is a breakdown of the specific threats our system monitors.
        </p>

        <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
          <div className="bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all duration-300 hover:-translate-y-0.5">
            <h4 className="font-bold text-cyber-purple mb-2 flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
              <Shield className="w-5 h-5" /> 802.11 Management Frames
            </h4>
            <p className="text-sm sm:text-base text-slate-400">
              Unlike data frames, Wi-Fi <em>management frames</em> (like Deauthentication and Beacons) are traditionally unencrypted and unauthenticated. An attacker can easily spoof a router's MAC address and broadcast forged Deauth packets, kicking legitimate users offline. Our WIDS looks for anomalous spikes in these frames.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300 hover:-translate-y-0.5">
            <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5" /> ARP Spoofing (MITM)
            </h4>
            <p className="text-sm sm:text-base text-slate-400">
              The Address Resolution Protocol (ARP) lacks authentication. Attackers send fake ARP Replies claiming their MAC address belongs to the network's Gateway IP. This redirects all victim traffic through the attacker (Man-in-the-Middle). The WIDS analyzes ARP traffic patterns to detect this poisoning.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-lg hover:shadow-[0_0_20px_rgba(255,45,149,0.1)] transition-all duration-300 hover:-translate-y-0.5">
            <h4 className="font-bold text-cyber-pink mb-2 flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
              <Search className="w-5 h-5" /> Evil Twin / Rogue AP
            </h4>
            <p className="text-sm sm:text-base text-slate-400">
              Attackers can set up a malicious hotspot with the exact same SSID (name) as the legitimate cafe or library network, often boosting their signal to trick devices into auto-connecting. The WIDS detects this by monitoring unexpected BSSID (MAC) broadcasts for known SSIDs.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-lg hover:shadow-[0_0_20px_rgba(163,230,53,0.1)] transition-all duration-300 hover:-translate-y-0.5">
            <h4 className="font-bold text-cyber-lime mb-2 flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
              <Network className="w-5 h-5" /> Port Scanning Detection
            </h4>
            <p className="text-sm sm:text-base text-slate-400">
              Before attacking, hackers often run recon scans (like Nmap) to find open ports and vulnerable services on connected devices. Our WIDS monitors for the rapid, sequential connection attempts indicative of active port scanning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
