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
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'protocol', label: 'Protocol Security', icon: Network },
    { id: 'hardware', label: 'Hardware', icon: Cpu },
    { id: 'deterrence', label: 'Physical Deterrence', icon: BellRing },
    { id: 'logs', label: 'System Logs', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex overflow-x-auto snap-x scroll-p-2 items-center gap-1.5 relative hide-scrollbar">
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
              className={`flex-none sm:flex-1 relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 snap-start border ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-400' : ''}`} />
              <span className="whitespace-nowrap">{tab.label}</span>
              {!readSections.includes(tab.id) && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
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