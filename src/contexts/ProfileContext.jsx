import React, { createContext, useContext, useState, useCallback } from 'react';
import { Shield, Target, BookOpen, Cpu, Zap, GraduationCap } from 'lucide-react';

// ─── All team members ──────────────────────────────────────────
export const PROFILES = [
  { id: 'apn',     name: 'Aung Phyoe Naing', nickname: 'APN',          icon: Shield,        color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/30',   role: 'member' },
  { id: 'jia',     name: 'Jia',              nickname: 'Jia',          icon: Target,        color: 'text-pink-400',   bg: 'bg-pink-500/20',   border: 'border-pink-500/30',   role: 'member' },
  { id: 'ayechan', name: 'Aye Chan',         nickname: 'AyeChan',      icon: BookOpen,      color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', role: 'member' },
  { id: 'hlyan',   name: 'Hlyan',            nickname: 'Hlyan',        icon: Cpu,           color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/30',  role: 'member' },
  { id: 'tiki',    name: 'Tiki',             nickname: 'Tiki',         icon: Zap,           color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', role: 'member' },
  { id: 'eiei',    name: 'Daw Ei Ei Khaing', nickname: 'T-chel EiEi',  icon: GraduationCap, color: 'text-amber-400',  bg: 'bg-amber-500/20',  border: 'border-amber-500/30',  role: 'supervisor' },
];

const STORAGE_KEY = 'wids_active_profile';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [activeProfileId, setActiveProfileId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null
  );

  const activeProfile = PROFILES.find(p => p.id === activeProfileId) || null;
  const isProfileSelected = activeProfile !== null;

  const setActiveProfile = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveProfileId(id);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveProfileId(null);
  }, []);

  return (
    <ProfileContext.Provider value={{
      profiles: PROFILES,
      activeProfile,
      activeProfileId,
      isProfileSelected,
      setActiveProfile,
      clearProfile,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
