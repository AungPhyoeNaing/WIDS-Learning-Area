import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Activity, BookOpen, Flag, Github, Menu, X, Sparkles, MessageSquare, UserCircle, LogOut } from 'lucide-react';
import SimulationDashboard from './components/SimulationDashboard';
import CTFLabs from './components/CTFLabs';
import LearningHub from './components/LearningHub';
import KnowledgeOfTheDay from './components/KnowledgeOfTheDay';
import ChatAssistant from './components/ChatAssistant';
import TeamyFeed from './components/TeamyFeed';
import ProfileSelector from './components/ProfileSelector';
import { useProfile } from './contexts/ProfileContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 cyber-grid-bg flex items-center justify-center p-8">
          <div className="glass-card p-8 rounded-2xl border border-red-500/50 max-w-lg text-center shadow-2xl animate-bounce-in">
            <ShieldCheck className="w-12 h-12 text-cyber-pink mx-auto mb-4 animate-wiggle" />
            <h2 className="text-xl font-bold text-white mb-2">Oops! Something broke 🛠️</h2>
            <p className="text-slate-400 text-sm sm:text-base mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:opacity-90 text-white px-6 py-2 rounded-lg font-bold transition-all btn-press shadow-lg">
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const VIEW_TRANSITION = 'opacity-100 translate-y-0';
const VIEW_TRANSITION_ENTER = 'opacity-0 translate-y-4';

function ViewWrapper({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`transition-all duration-500 ease-out ${mounted ? VIEW_TRANSITION : VIEW_TRANSITION_ENTER}`}>
      {children}
    </div>
  );
}

export default function App() {
  const { isProfileSelected, activeProfile, activeProfileId, clearProfile, userScores } = useProfile();
  const [activeView, setActiveView] = useState(() => localStorage.getItem('wids_view') || 'simulation');
  const [isAttackActive, setIsAttackActive] = useState(false);
  const [attackType, setAttackType] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('wids_view', activeView);
  }, [activeView]);

  const setAttackState = useCallback((active, type) => {
    setIsAttackActive(active);
    setAttackType(type);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '1') { setActiveView('simulation'); setMobileMenuOpen(false); }
      if (e.key === '2') { setActiveView('ctf'); setMobileMenuOpen(false); }
      if (e.key === '3') { setActiveView('learning'); setMobileMenuOpen(false); }
      if (e.key === '4') { setActiveView('knowledge'); setMobileMenuOpen(false); }
      if (e.key === '5') { setActiveView('teamyfeed'); setMobileMenuOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navItems = [
    { id: 'simulation', label: 'Live Simulation', icon: Activity, shortcut: '1' },
    { id: 'ctf', label: 'CTF Labs', icon: Flag, shortcut: '2' },
    { id: 'learning', label: 'Learning Hub', icon: BookOpen, shortcut: '3' },
    { id: 'knowledge', label: 'Daily Insight', icon: Sparkles, shortcut: '4' },
    { id: 'teamyfeed', label: 'Teamyfeed', icon: MessageSquare, shortcut: '5' },
  ];

  const navigate = (id) => {
    setActiveView(id);
    setMobileMenuOpen(false);
  };

  // ── Gate: show profile selector if no identity selected ──
  if (!isProfileSelected) {
    return <ProfileSelector />;
  }

  const ProfileIcon = activeProfile.icon;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 cyber-grid-bg noise-bg text-slate-300 font-sans">
        <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 animate-border-glow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="relative">
                  <ShieldCheck className="h-8 w-8 text-cyber-cyan animate-svg-glow" />
                  <div className="absolute inset-0 h-8 w-8 text-cyber-cyan blur-sm opacity-50">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                </div>
                <span className="ml-2 sm:ml-3 font-extrabold text-base sm:text-xl tracking-tight">
                  <span className="text-white">WIDS</span>{' '}
                  <span className="bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink bg-clip-text text-transparent animate-gradient">
                    Simulator
                  </span>
                </span>
              </div>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-4 overflow-x-auto">
                <div className="flex items-baseline space-x-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={`flex items-center px-3 lg:px-4 py-2.5 rounded-lg text-sm lg:text-base font-semibold transition-all btn-press whitespace-nowrap ${
                          activeView === item.id
                            ? 'bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                      >
                        <Icon className="mr-1 lg:mr-2 h-4 w-4" />
                        {item.label}
                        <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded border hidden lg:inline ${
                          activeView === item.id ? 'border-cyber-cyan/40 text-cyber-cyan/70' : 'border-slate-700 text-slate-600'
                        }`}>{item.shortcut}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Profile indicator + switch */}
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-800">
                  {/* XP Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400" title="Study Score XP">
                    <span className="text-sm">🏆</span>
                    <span className="text-xs font-bold font-mono">{userScores[activeProfileId]?.totalScore || 0}</span>
                  </div>

                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${activeProfile.bg} border ${activeProfile.border}`}>
                    <ProfileIcon className={`w-3.5 h-3.5 ${activeProfile.color}`} />
                    <span className={`text-xs font-bold ${activeProfile.color}`}>{activeProfile.nickname}</span>
                  </div>
                  <button onClick={clearProfile} title="Switch Profile" className="p-1.5 rounded-lg text-slate-500 hover:text-cyber-pink hover:bg-slate-800/50 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="md:hidden text-slate-400 hover:text-cyber-cyan p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-800/50 bg-slate-950/90 backdrop-blur-xl">
              <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-1">
                {/* Mobile profile indicator */}
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Study Score</span>
                    <span className="text-sm font-bold font-mono flex items-center gap-1.5"><span className="text-base">🏆</span> {userScores[activeProfileId]?.totalScore || 0} XP</span>
                  </div>
                  <div className={`flex items-center justify-between px-3 sm:px-4 py-3 rounded-lg ${activeProfile.bg} border ${activeProfile.border}`}>
                    <div className="flex items-center gap-2">
                      <ProfileIcon className={`w-4 h-4 ${activeProfile.color}`} />
                      <span className={`text-sm font-bold ${activeProfile.color}`}>{activeProfile.nickname}</span>
                      {activeProfile.role === 'supervisor' && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">SUP</span>}
                    </div>
                    <button onClick={clearProfile} className="text-xs text-slate-400 hover:text-cyber-pink font-medium">Switch</button>
                  </div>
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                        activeView === item.id
                          ? 'bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 text-cyber-cyan border border-cyber-cyan/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <Icon className="mr-2.5 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5" />
                      {item.label}
                      <span className="ml-auto text-xs text-slate-500 font-mono">[{item.shortcut}]</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8 animate-fade-in-up">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4">
              {activeView === 'simulation' && (
                <span className="bg-gradient-to-r from-cyber-cyan to-emerald-400 bg-clip-text text-transparent">
                  Wireless Intrusion Detection Sandbox
                </span>
              )}
              {activeView === 'ctf' && (
                <span className="bg-gradient-to-r from-cyber-pink to-cyber-orange bg-clip-text text-transparent">
                  Interactive Security Challenges
                </span>
              )}
              {activeView === 'learning' && (
                <span className="bg-gradient-to-r from-cyber-purple to-cyber-cyan bg-clip-text text-transparent">
                  Learning Hub
                </span>
              )}
              {activeView === 'knowledge' && (
                <span className="bg-gradient-to-r from-cyber-purple to-cyber-pink bg-clip-text text-transparent">
                  Daily Insight
                </span>
              )}
              {activeView === 'teamyfeed' && (
                <span className="bg-gradient-to-r from-blue-400 to-cyber-cyan bg-clip-text text-transparent">
                  Teamyfeed Knowledge Share
                </span>
              )}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
              {activeView === 'simulation' && 'Deploy virtual ESP32 sniffers to detect common 802.11 attacks in real-time. Understand how raw management frames are manipulated by adversaries.'}
              {activeView === 'ctf' && 'Test your understanding of Wi-Fi protocol vulnerabilities through hands-on gamified tasks.'}
              {activeView === 'learning' && 'A deep dive into the project architecture, hardware specs, and system diagnostics.'}
              {activeView === 'knowledge' && 'A daily dose of WIDS wisdom — random educational facts powered by Groq AI.'}
              {activeView === 'teamyfeed' && 'Post your latest findings, research notes, and cybersecurity highlights for the team.'}
            </p>
          </div>

          <div key={activeView}>
            <ViewWrapper>
              {activeView === 'simulation' && (
                <ErrorBoundary>
                  <SimulationDashboard
                    isAttackActive={isAttackActive}
                    attackType={attackType}
                    setAttackState={setAttackState}
                  />
                </ErrorBoundary>
              )}
              {activeView === 'ctf' && <ErrorBoundary><CTFLabs /></ErrorBoundary>}
              {activeView === 'learning' && <ErrorBoundary><LearningHub /></ErrorBoundary>}
              {activeView === 'knowledge' && <ErrorBoundary><KnowledgeOfTheDay /></ErrorBoundary>}
              {activeView === 'teamyfeed' && <ErrorBoundary><TeamyFeed /></ErrorBoundary>}
            </ViewWrapper>
          </div>
        </main>

        <ChatAssistant />
        <footer className="border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-xl mt-8 sm:mt-12 py-6 sm:py-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-cyan/30 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyber-cyan/40" />
              <span className="text-xs sm:text-sm text-slate-500 font-mono">WIDS Simulator v1.0</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
              Local Client-Side • React + Tailwind CSS • Built with ⚡ for curious minds
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}