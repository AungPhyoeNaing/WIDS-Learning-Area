import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Shield, Target, BookOpen, Cpu, Zap, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const PROFILES = [
  { id: 'apn',     name: 'Aung Phyoe Naing', nickname: 'APN',          icon: Shield,        color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/30',   role: 'member' },
  { id: 'jia',     name: 'Jia',              nickname: 'Jia',          icon: Target,        color: 'text-pink-400',   bg: 'bg-pink-500/20',   border: 'border-pink-500/30',   role: 'member' },
  { id: 'ayechan', name: 'Aye Chan',         nickname: 'AyeChan',      icon: BookOpen,      color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', role: 'member' },
  { id: 'hlyan',   name: 'Hlyan',            nickname: 'Hlyan',        icon: Cpu,           color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/30',  role: 'member' },
  { id: 'tiki',    name: 'Tiki',             nickname: 'Tiki',         icon: Zap,           color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', role: 'member' },
  { id: 'eiei',    name: 'Daw Ei Ei Khaing', nickname: 'T-chel EiEi',  icon: GraduationCap, color: 'text-amber-400',  bg: 'bg-amber-500/20',  border: 'border-amber-500/30',  role: 'supervisor' },
];

const STORAGE_KEY = 'wids_active_profile';
const SCORES_KEY = 'wids_study_scores';

const DEFAULT_SCORES = {
  totalScore: 0,
  timeSpentMinutes: 0,
  ctfsSolved: 0,
  chatAsked: 0,
  postsUploaded: 0
};

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [activeProfileId, setActiveProfileId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null
  );

  const [userScores, setUserScores] = useState(() => {
    try {
      const stored = localStorage.getItem(SCORES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // 1. Fetch cloud scores on mount & subscribe to live updates
  useEffect(() => {
    const fetchCloudScores = async () => {
      const { data, error } = await supabase.from('profiles').select('id, total_score, time_spent_minutes, ctfs_solved, chat_asked, posts_uploaded');
      if (!error && data) {
        const cloudMap = {};
        data.forEach(p => {
          cloudMap[p.id] = {
            totalScore: p.total_score || 0,
            timeSpentMinutes: p.time_spent_minutes || 0,
            ctfsSolved: p.ctfs_solved || 0,
            chatAsked: p.chat_asked || 0,
            postsUploaded: p.posts_uploaded || 0
          };
        });
        setUserScores(prev => ({ ...prev, ...cloudMap }));
      }
    };
    
    fetchCloudScores();

    // Subscribe to any profile score changes across the network
    const channel = supabase.channel('public:profiles_scores')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const p = payload.new;
        setUserScores(prev => ({
          ...prev,
          [p.id]: {
            totalScore: p.total_score || 0,
            timeSpentMinutes: p.time_spent_minutes || 0,
            ctfsSolved: p.ctfs_solved || 0,
            chatAsked: p.chat_asked || 0,
            postsUploaded: p.posts_uploaded || 0
          }
        }));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    localStorage.setItem(SCORES_KEY, JSON.stringify(userScores));
  }, [userScores]);

  const activeProfile = PROFILES.find(p => p.id === activeProfileId) || null;
  const isProfileSelected = activeProfile !== null;

  const setActiveProfile = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveProfileId(id);
    setUserScores(prev => ({ ...prev, [id]: prev[id] || { ...DEFAULT_SCORES } }));
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveProfileId(null);
  }, []);

  // Time tracker
  useEffect(() => {
    if (!activeProfileId) return;
    const interval = setInterval(() => {
      addScore('time');
    }, 60000);
    return () => clearInterval(interval);
  }, [activeProfileId]);

  const addScore = useCallback((eventType) => {
    if (!activeProfileId) return;

    setUserScores(prev => {
      const profileScore = prev[activeProfileId] || { ...DEFAULT_SCORES };
      let newTotal = profileScore.totalScore;
      let newTime = profileScore.timeSpentMinutes;
      let newCtfs = profileScore.ctfsSolved;
      let newChats = profileScore.chatAsked;
      let newPosts = profileScore.postsUploaded;

      if (eventType === 'time') { newTotal += 1; newTime += 1; }
      else if (eventType === 'ctf') { newTotal += 50; newCtfs += 1; }
      else if (eventType === 'chat') { newTotal += 5; newChats += 1; }
      else if (eventType === 'post') { newTotal += 15; newPosts += 1; }

      const newState = {
        totalScore: newTotal,
        timeSpentMinutes: newTime,
        ctfsSolved: newCtfs,
        chatAsked: newChats,
        postsUploaded: newPosts
      };

      // 2. Push score to Supabase asynchronously
      supabase.from('profiles').update({
        total_score: newTotal,
        time_spent_minutes: newTime,
        ctfs_solved: newCtfs,
        chat_asked: newChats,
        posts_uploaded: newPosts
      }).eq('id', activeProfileId).then();

      return {
        ...prev,
        [activeProfileId]: newState
      };
    });
  }, [activeProfileId]);

  return (
    <ProfileContext.Provider value={{
      profiles: PROFILES,
      activeProfile,
      activeProfileId,
      isProfileSelected,
      setActiveProfile,
      clearProfile,
      userScores,
      addScore
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
