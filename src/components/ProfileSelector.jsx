import React from 'react';
import { ShieldCheck, Star } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';

export default function ProfileSelector() {
  const { profiles, setActiveProfile } = useProfile();

  return (
    <div className="min-h-screen bg-slate-950 cyber-grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-slate-900/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-950/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 mb-6">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-100 mb-3">
            WIDS <span className="text-slate-400 font-medium">Simulator</span>
          </h1>
          <p className="text-slate-400 text-base font-medium">Who are you?</p>
          <p className="text-slate-500 text-xs mt-1 font-mono">Select your identity to continue</p>
        </div>

        {/* Profile Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {profiles.map((profile, index) => {
            const Icon = profile.icon;
            const isSupervisor = profile.role === 'supervisor';
            return (
              <button
                key={profile.id}
                onClick={() => setActiveProfile(profile.id)}
                className={`group relative flex flex-col items-center gap-4 p-6 rounded-xl border bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
                  isSupervisor
                    ? 'border-amber-500/20 hover:border-amber-500/40 col-span-2 sm:col-span-1'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Supervisor badge */}
                {isSupervisor && (
                  <div className="absolute top-3 right-3 p-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  </div>
                )}

                {/* Icon */}
                <div className={`p-3 rounded-lg ${profile.bg} border ${profile.border} transition-all duration-200 group-hover:scale-105`}>
                  <Icon className={`w-5 h-5 ${profile.color}`} />
                </div>

                {/* Name */}
                <div className="text-center">
                  <p className="text-slate-200 font-medium text-sm sm:text-base group-hover:text-blue-400 transition-colors">{profile.nickname}</p>
                  {profile.nickname !== profile.name && (
                    <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5 truncate max-w-[120px]">{profile.name}</p>
                  )}
                  {isSupervisor && (
                    <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
                      Supervisor
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-[10px] font-mono mt-12">
          WIDS Project • Wireless Intrusion Detection System • Team Identity Portal
        </p>
      </div>
    </div>
  );
}
