import React from 'react';
import { BellRing, Store, Volume2, ShieldAlert } from 'lucide-react';

export default function PhysicalDeterrence() {
  return (
    <div className="glass-card p-4 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-md relative overflow-hidden animate-fade-in-up">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-orange via-red-500 to-cyber-pink" />
      <h2 className="text-xl sm:text-3xl font-bold text-cyber-orange mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
        <BellRing className="w-6 sm:w-10 h-6 sm:h-10" /> Physical Deterrence
      </h2>
      
      <div className="space-y-8 text-slate-300 leading-relaxed">
        <p className="text-lg">
          The most unique aspect of this WIDS project is its <strong>Dual-Mode Alert System</strong>. While enterprise systems rely on silent dashboards and email alerts, our system is designed for shared public spaces (like internet cafes and libraries in Myanmar) where immediate physical intervention is required.
        </p>

        <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
          <div className="bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-orange-900/50 hover:border-orange-500 transition-colors hover:-translate-y-1 duration-300 shadow-lg">
            <Volume2 className="w-6 sm:w-8 h-6 sm:h-8 text-orange-400 mb-2 sm:mb-3" />
            <h3 className="font-bold text-white mb-1 sm:mb-2 text-sm sm:text-base">Hardware Alarm Module</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              When a severe threat (like an Evil Twin or ARP Spoofing) is confirmed, the host software sends a signal to an external hardware buzzer. This physical alarm immediately alerts the shop owner or administrator, even if they aren't looking at the screen.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-red-900/50 hover:border-red-500 transition-colors hover:-translate-y-1 duration-300 shadow-lg">
            <ShieldAlert className="w-6 sm:w-8 h-6 sm:h-8 text-red-400 mb-2 sm:mb-3" />
            <h3 className="font-bold text-white mb-1 sm:mb-2 text-sm sm:text-base">Psychological Deterrence</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              A physical alarm doesn't just alert the owner—it exposes the attacker. In a shared space, a sudden alarm indicates that network monitoring is active. This serves as a powerful psychological deterrent against cyber-criminal activities.
            </p>
          </div>
        </div>

        <section className="bg-slate-900/80 p-4 sm:p-6 rounded-2xl border border-slate-700 mt-6 sm:mt-8">
          <h3 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-cyber-cyan" /> The Small Business Context
          </h3>
          <p className="text-xs sm:text-sm mb-3 sm:mb-4">
            In Myanmar, many small business owners are unaware of network security complexities or find enterprise solutions too difficult to set up. Our system solves this by:
          </p>
          <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
            <li>Operating <strong>Host-Based</strong> directly on the main admin computer.</li>
            <li>Requiring <strong>no router access</strong> or advanced networking knowledge.</li>
            <li>Translating complex packet data into simple, actionable on-screen alerts and physical sounds.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
