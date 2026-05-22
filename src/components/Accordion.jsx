import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function Accordion({ title, icon: Icon, children, isOpen, onClick }) {
  return (
    <div className="border border-slate-800 rounded-2xl bg-slate-900/40 overflow-hidden mb-4 transition-all">
      <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 sm:p-6 bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20">
            <Icon className="w-5 h-5 text-cyber-cyan" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white text-left">{title}</h3>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-slate-800 animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
}
