import React from 'react';
import { ShieldCheck, Star } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';

export default function ProfileSelector() {
  const { profiles, setActiveProfile } = useProfile();

  return (
    <div className="min-h-screen bg-slate-950 cyber-grid-bg noise-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyber-purple/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyber-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-br from-cyber-cyan/15 to-cyber-purple/15 border border-cyber-cyan/20 mb-6 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
            <ShieldCheck className="w-12 h-12 text-cyber-cyan" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 tracking-tight">
            <span className="text-white">WIDS </span>
            <span className="bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink bg-clip-text text-transparent animate-gradient">
              Simulator
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg font-medium">Who are you?</p>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 font-mono">Select your identity to continue</p>
        </div>

        {/* Profile Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {profiles.map((profile, index) => {
            const Icon = profile.icon;
            const isSupervisor = profile.role === 'supervisor';
            return (
              <button
                key={profile.id}
                onClick={() => setActiveProfile(profile.id)}
                className={`group relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 active:shadow-lg ${
                  isSupervisor
                    ? 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-500/30 hover:border-amber-400/60 hover:shadow-amber-500/10 col-span-2 sm:col-span-1'
                    : 'bg-slate-900/60 border-slate-700/50 hover:border-slate-500/80 hover:shadow-cyber-cyan/5'
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Supervisor badge */}
                {isSupervisor && (
                  <div className="absolute -top-2 -right-2 p-1 rounded-full bg-amber-500/20 border border-amber-500/40">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                )}

                {/* Icon */}
                <div className={`p-3 rounded-xl ${profile.bg} border ${profile.border} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                  <Icon className={`w-6 h-6 ${profile.color}`} />
                </div>

                {/* Name */}
                <div className="text-center">
                  <p className="text-white font-bold text-sm sm:text-base group-hover:text-cyber-cyan transition-colors">{profile.nickname}</p>
                  {profile.nickname !== profile.name && (
                    <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5 truncate max-w-[120px]">{profile.name}</p>
                  )}
                  {isSupervisor && (
                    <span className="inline-block mt-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Supervisor
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-700 text-[10px] sm:text-xs font-mono mt-8">
          WIDS Project • Wireless Intrusion Detection System • Team Identity Portal
        </p>
      </div>
    </div>
  );
}
