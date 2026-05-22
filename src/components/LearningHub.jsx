import React, { useState } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { BookOpen, Layers, Cpu, Database } from 'lucide-react';
import ProjectArchitecture from './ProjectArchitecture';
import HardwareSpecs from './HardwareSpecs';
import SystemLogs from './SystemLogs';
import ProtocolSecurity from './ProtocolSecurity';
import PhysicalDeterrence from './PhysicalDeterrence';
import { BellRing, Network } from 'lucide-react';

export default function LearningHub() {
  const { activeProfileId } = useProfile();
  const [activeTab, setActiveTab] = useState('architecture');
  const [readSections, setReadSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`wids_read_sections_${activeProfileId}`)) || []; }
    catch { return []; }
  });

  const tabs = [
    { id: 'architecture', label: 'Architecture', icon: Layers, color: 'cyber-cyan' },
    { id: 'protocol', label: 'Protocol Security', icon: Network, color: 'purple-500' },
    { id: 'hardware', label: 'Hardware', icon: Cpu, color: 'cyber-lime' },
    { id: 'deterrence', label: 'Physical Deterrence', icon: BellRing, color: 'cyber-orange' },
    { id: 'logs', label: 'System Logs', icon: Database, color: 'cyber-pink' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-2 sm:p-2.5 rounded-2xl flex overflow-x-auto snap-x scroll-p-2 items-center gap-2 border border-slate-800 bg-slate-900/50 relative hide-scrollbar">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-purple/30 to-transparent pointer-events-none" />
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (!readSections.includes(tab.id)) {
                  const updated = [...readSections, tab.id];
                  setReadSections(updated);
                  localStorage.setItem(`wids_read_sections_${activeProfileId}`, JSON.stringify(updated));
                }
              }}
              className={`flex-none sm:flex-1 relative flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 snap-start ${
                isActive
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${
                isActive ? `text-${tab.color}` : ''
              }`} />
              <span className="whitespace-nowrap">{tab.label}</span>
              {!readSections.includes(tab.id) && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-pink animate-pulse flex-shrink-0" />
              )}
              {isActive && (
                <span className={`absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-${tab.color}`} />
              )}
            </button>
          );
        })}
      </div>

      <div key={activeTab} className="mt-6 animate-fade-in-up">
        {activeTab === 'architecture' && <ProjectArchitecture />}
        {activeTab === 'protocol' && <ProtocolSecurity />}
        {activeTab === 'hardware' && <HardwareSpecs />}
        {activeTab === 'deterrence' && <PhysicalDeterrence />}
        {activeTab === 'logs' && <SystemLogs />}
      </div>
    </div>
  );
}