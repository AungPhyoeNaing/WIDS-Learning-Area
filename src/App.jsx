import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Activity, BookOpen, Flag, Github, Menu, X, Sparkles, MessageSquare, UserCircle, LogOut } from 'lucide-react';
import SimulationDashboard from './components/SimulationDashboard';
import CTFLabs from './components/CTFLabs';
import LearningHub from './components/LearningHub';
import KnowledgeOfTheDay from './components/KnowledgeOfTheDay';
import ChatAssistant from './components/ChatAssistant';
import KnowItAll from './components/KnowItAll';
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 shadow-sm max-w-lg text-center animate-bounce-in">
            <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold tracking-tight text-slate-200 mb-4">Oops! Something broke</h2>
            <p className="text-slate-400 text-sm sm:text-base mb-6">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:ring-2 focus:ring-blue-500/50">
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
      if (e.key === '5') { setActiveView('knowitall'); setMobileMenuOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navItems = [
    { id: 'simulation', label: 'Simulate', icon: Activity, shortcut: '1' },
    { id: 'ctf', label: 'CTF Labs', icon: Flag, shortcut: '2' },
    { id: 'learning', label: 'Learn', icon: BookOpen, shortcut: '3' },
    { id: 'knowledge', label: 'AI Tips', icon: Sparkles, shortcut: '4' },
    { id: 'knowitall', label: 'Know-It-ALL', icon: MessageSquare, shortcut: '5' },
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
      <div className="min-h-screen bg-slate-950 text-slate-300 font-sans">
        <nav className="bg-slate-950/85 backdrop-blur-md border-b border-slate-900 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <ShieldCheck className="h-7 w-7 text-blue-500" />
                <span className="ml-2.5 font-semibold text-base sm:text-lg tracking-tight">
                  <span className="text-slate-100 font-bold">WIDS</span>{' '}
                  <span className="text-slate-400">Simulator</span>
                </span>
              </div>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-2 lg:gap-4">
                <div className="flex items-baseline space-x-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={`flex items-center px-3 lg:px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                          activeView === item.id
                            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                            : 'text-slate-400 border border-transparent hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="mr-1 lg:mr-2 h-4 w-4" />
                        {item.label}
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

                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${activeProfile.bg} border ${activeProfile.border}`}>
                    <ProfileIcon className={`w-3.5 h-3.5 ${activeProfile.color}`} />
                    <span className={`text-xs font-bold ${activeProfile.color}`}>{activeProfile.nickname}</span>
                  </div>
                  <button onClick={clearProfile} title="Switch Profile" className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="md:hidden text-slate-500 hover:text-slate-900 p-2"
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
                    <button onClick={clearProfile} className="text-xs text-slate-400 hover:text-red-400 font-medium">Switch</button>
                  </div>
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeView === item.id
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                          : 'text-slate-400 border border-transparent hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="mr-2.5 h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-100 mb-6">
              {activeView === 'simulation' && 'Wireless Intrusion Detection Sandbox'}
              {activeView === 'ctf' && 'Interactive Security Challenges'}
              {activeView === 'learning' && 'Learning Hub'}
              {activeView === 'knowledge' && 'Daily Insight'}
              {activeView === 'knowitall' && 'Know-It-ALL Knowledge Share'}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
              {activeView === 'simulation' && 'Deploy virtual ESP32 sniffers to detect common 802.11 attacks in real-time. Understand how raw management frames are manipulated by adversaries.'}
              {activeView === 'ctf' && 'Test your understanding of Wi-Fi protocol vulnerabilities through hands-on gamified tasks.'}
              {activeView === 'learning' && 'A deep dive into the project architecture, hardware specs, and system diagnostics.'}
              {activeView === 'knowledge' && 'A daily dose of WIDS wisdom — random educational facts powered by Groq AI.'}
              {activeView === 'knowitall' && 'Post your latest findings, research notes, and cybersecurity highlights for the team.'}
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
              {activeView === 'knowitall' && <ErrorBoundary><KnowItAll /></ErrorBoundary>}
            </ViewWrapper>
          </div>
        </main>

        <ChatAssistant />
        <footer className="border-t border-slate-900 bg-slate-950 mt-8 sm:mt-12 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span className="text-xs sm:text-sm text-slate-500 font-mono">WIDS Simulator v1.0</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              Local Client-Side • React + Tailwind CSS • Built for curious minds
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}