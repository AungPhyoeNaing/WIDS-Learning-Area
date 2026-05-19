import React, { useState } from 'react';
import { BookOpen, Layers, Cpu, Database } from 'lucide-react';
import ProjectArchitecture from './ProjectArchitecture';
import HardwareSpecs from './HardwareSpecs';
import SystemLogs from './SystemLogs';

export default function LearningHub() {
  const [activeTab, setActiveTab] = useState('architecture');

  const tabs = [
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'hardware', label: 'Hardware Specs', icon: Cpu },
    { id: 'logs', label: 'System Logs', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 border border-slate-800 bg-slate-900/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === 'architecture' && <ProjectArchitecture />}
        {activeTab === 'hardware' && <HardwareSpecs />}
        {activeTab === 'logs' && <SystemLogs />}
      </div>
    </div>
  );
}