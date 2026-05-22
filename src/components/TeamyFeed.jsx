import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { MessageSquarePlus, Clock, Send, Loader2, Sparkles, Database, Network, X, Image as ImageIcon, Upload, Eye, Cpu, FileCode2, ShieldAlert } from 'lucide-react';
import { useProfile, PROFILES } from '../contexts/ProfileContext';

const FEED_CATEGORIES = [
  { id: '📡 RF & Hardware', label: 'RF & Hardware', colorClass: 'text-cyber-lime', borderClass: '!border-lime-400/60', glowClass: 'shadow-[0_0_15px_rgba(163,230,53,0.3)]', bgGradient: 'from-lime-400/10 to-transparent' },
  { id: '🔒 Protocol Security', label: 'Protocol Security', colorClass: 'text-cyber-purple', borderClass: '!border-purple-500/60', glowClass: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', bgGradient: 'from-purple-500/10 to-transparent' },
  { id: '💻 Code & Logic', label: 'Code & Logic', colorClass: 'text-cyber-cyan', borderClass: '!border-cyan-400/60', glowClass: 'shadow-[0_0_15px_rgba(0,240,255,0.3)]', bgGradient: 'from-cyan-400/10 to-transparent' },
  { id: '⚔️ Attack / Defense', label: 'Attack / Defense', colorClass: 'text-red-500', borderClass: '!border-red-500/60', glowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]', bgGradient: 'from-red-500/10 to-transparent' },
  { id: '💡 General Insight', label: 'General Insight', colorClass: 'text-amber-500', borderClass: '!border-amber-500/60', glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', bgGradient: 'from-amber-500/10 to-transparent' }
];

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All Knowledge', colorClass: 'text-white', borderClass: 'border-slate-500' },
  ...FEED_CATEGORIES
];

export default function TeamyFeed() {
  const { activeProfile, activeProfileId, addScore, userScores } = useProfile();
  const [posts, setPosts] = useState([]);
  const [readPosts, setReadPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`wids_read_posts_${activeProfileId}`)) || []; }
    catch { return []; }
  });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [postCategory, setPostCategory] = useState('💡 General Insight');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const POSTS_PER_PAGE = 6;
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const activeFilterRef = useRef(activeFilter);
  useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(POSTS_PER_PAGE);

    if (activeFilter !== 'all') {
      query = query.eq('category', activeFilter);
    }
    
    const { data, error } = await query;
    if (!error && data) {
      setPosts(data);
      setHasMore(data.length === POSTS_PER_PAGE);
    }
    setIsLoading(false);
  }, [activeFilter]);

  const loadMore = async () => {
    if (isFetchingMore || !hasMore || posts.length === 0) return;
    setIsFetchingMore(true);
    
    // Use the created_at of the last currently loaded post as the cursor
    const lastPostDate = posts[posts.length - 1].created_at;

    let query = supabase
      .from('posts')
      .select('*')
      .lt('created_at', lastPostDate)
      .order('created_at', { ascending: false })
      .limit(POSTS_PER_PAGE);

    if (activeFilter !== 'all') {
      query = query.eq('category', activeFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setPosts(prev => {
        const newPosts = data.filter(d => !prev.some(p => p.id === d.id));
        return [...prev, ...newPosts];
      });
      setHasMore(data.length === POSTS_PER_PAGE);
    }
    setIsFetchingMore(false);
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setPosts((currentPosts) => {
          if (activeFilterRef.current !== 'all' && payload.new.category !== activeFilterRef.current) {
            return currentPosts;
          }
          return [payload.new, ...currentPosts];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPost(null);
    };
    if (selectedPost) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || isSubmitting) return;

    setIsSubmitting(true);
    let imageUrl = null;

    if (image) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('feed-images')
        .upload(fileName, image);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Failed to upload image.");
        setIsSubmitting(false);
        return;
      }
      
      const { data: publicUrl } = supabase.storage.from('feed-images').getPublicUrl(fileName);
      imageUrl = publicUrl.publicUrl;
    }

    const { error } = await supabase
      .from('posts')
      .insert([{ title: title.trim(), body: body.trim(), image_url: imageUrl, author: activeProfile.nickname, category: postCategory }]);

    if (!error) {
      setTitle('');
      setBody('');
      setImage(null);
      setPostCategory('💡 General Insight');
      if (addScore) addScore('post');
    } else {
      console.error("Error submitting post:", error);
      alert("Failed to submit post.");
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const markAsRead = (postId) => {
    if (!readPosts.includes(postId)) {
      const updated = [...readPosts, postId];
      setReadPosts(updated);
      localStorage.setItem(`wids_read_posts_${activeProfileId}`, JSON.stringify(updated));
    }
  };

  const getBentoSpan = (index) => {
    const pattern = index % 4;
    if (pattern === 0) return 'col-span-1 md:col-span-2 lg:col-span-2';
    if (pattern === 1) return 'col-span-1';
    if (pattern === 2) return 'col-span-1';
    if (pattern === 3) return 'col-span-1 md:col-span-2 lg:col-span-2';
    return 'col-span-1';
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 relative w-full animate-fade-in-up">
      
      {/* Category Filter Bar */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 p-2 glass-card rounded-2xl border border-slate-800">
        {FILTER_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeFilter === cat.id 
                ? `bg-slate-800 ${cat.colorClass} ${cat.borderClass} border shadow-lg` 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-auto grid-flow-dense">

        <div className="glass-card p-3 sm:p-8 rounded-3xl col-span-1 md:col-span-2 lg:col-span-2 border border-slate-800 shadow-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink opacity-70 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquarePlus className="text-cyber-cyan shrink-0" />
              Share Knowledge
            </h2>
            <p className="text-slate-400 text-sm mt-1">Broadcast new findings to the team instantly.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-mono text-slate-400 mb-1.5 ml-1">Highlight Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Bypassing MAC filtering..."
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyber-cyan text-white p-3.5 rounded-2xl outline-none transition-all placeholder-slate-700 text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-mono text-slate-400 mb-1.5 ml-1">Knowledge Category</label>
                  <div className="relative" ref={dropdownRef}>
                    <div
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full bg-slate-950/50 border ${isDropdownOpen ? 'border-cyber-cyan shadow-[0_0_15px_rgba(0,240,255,0.15)]' : 'border-slate-800 hover:border-slate-700'} text-white p-3.5 rounded-2xl outline-none transition-all text-base cursor-pointer flex justify-between items-center group`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={FEED_CATEGORIES.find(c => c.id === postCategory)?.colorClass}>
                          {postCategory.split(' ')[0]}
                        </span>
                        <span>{FEED_CATEGORIES.find(c => c.id === postCategory)?.label}</span>
                      </span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden py-2 animate-fade-in-up origin-top">
                        {FEED_CATEGORIES.map(cat => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              setPostCategory(cat.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-4 py-3 cursor-pointer transition-all flex items-center gap-3 hover:bg-slate-800 group ${postCategory === cat.id ? 'bg-slate-800/80 border-l-2 ' + cat.borderClass.replace('!', '') : 'border-l-2 border-transparent'}`}
                          >
                            <span className={`text-xl ${cat.colorClass}`}>
                               {cat.id.split(' ')[0]} 
                            </span>
                            <span className={`text-sm font-bold transition-colors ${postCategory === cat.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                {cat.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-mono text-slate-400 mb-1.5 ml-1">Main Text Body</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What did you learn today?"
                  rows={3}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyber-purple text-white p-3.5 rounded-2xl outline-none transition-all resize-none placeholder-slate-700 text-base"
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950/50 border border-slate-800 hover:border-slate-600 px-4 py-2.5 rounded-2xl text-sm transition-all text-slate-400 hover:text-white">
                  <Upload size={18} />
                  {image ? image.name : "Attach Image"}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting || !title.trim() || !body.trim()}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white border border-slate-700 hover:border-cyber-cyan px-8 py-3.5 sm:py-3 rounded-2xl font-bold transition-all btn-press flex items-center justify-center gap-2 group/btn shadow-lg"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Send size={18} className="shrink-0 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform text-cyber-cyan" />}
                {isSubmitting ? 'Transmitting...' : 'Broadcast'}
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card p-4 sm:p-6 rounded-3xl col-span-1 md:col-span-2 lg:col-span-1 border border-slate-800 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800/50 flex flex-col relative overflow-hidden group min-h-[160px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
              🏆 Top Researchers
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {Object.entries(userScores || {})
              .map(([id, data]) => ({ id, profile: PROFILES.find(p => p.id === id), score: data.totalScore }))
              .filter(entry => entry.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((entry, idx) => (
                <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-4 text-center ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-600'}`}>
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-bold ${entry.profile?.color || 'text-white'}`}>{entry.profile?.nickname || entry.id}</span>
                  </div>
                  <span className="text-xs font-mono text-cyber-lime font-bold">{entry.score} XP</span>
                </div>
            ))}
            {Object.keys(userScores || {}).filter(k => userScores[k].totalScore > 0).length === 0 && (
              <p className="text-xs text-slate-500 italic text-center mt-4">No scores recorded yet. Earn XP to rank up!</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center p-12 sm:p-16 glass-card rounded-3xl border border-slate-800">
            <Loader2 className="w-10 h-10 text-cyber-cyan animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 glass-card p-12 sm:p-16 rounded-3xl border border-slate-800 text-center text-slate-500 italic">
            No knowledge shared yet. Be the first to add a node to the network!
          </div>
        ) : (
          posts.map((post, index) => {
            const catConfig = FEED_CATEGORIES.find(c => c.id === post.category) || FEED_CATEGORIES[4];
            return (
              <div 
                key={post.id} 
                onClick={() => { setSelectedPost(post); markAsRead(post.id); }}
                className={`glass-card p-3 sm:p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1 flex flex-col group/card cursor-pointer ${getBentoSpan(index)} animate-slide-up overflow-hidden relative border-2 ${catConfig.borderClass} hover:${catConfig.glowClass} bg-slate-900/90 bg-gradient-to-br ${catConfig.bgGradient}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {post.image_url && <img src={post.image_url} className="w-full h-40 object-cover mb-4 rounded-xl border border-slate-800/50" alt={`Image for: ${post.title}`} />}
                {!readPosts.includes(post.id) && (
                  <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider ${catConfig.colorClass} bg-slate-900/80 px-2 py-0.5 rounded-full border ${catConfig.borderClass} animate-pulse shadow-lg`}>New</span>
                )}
                <div className="mb-2">
                  <span className={`text-[10px] sm:text-xs font-mono uppercase tracking-widest ${catConfig.colorClass} opacity-80`}>{post.category || '💡 General Insight'}</span>
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-3 group-hover/card:text-white transition-colors flex items-start gap-2 break-words">
                    <span className="line-clamp-2">{post.title}</span>
                  </h4>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed whitespace-pre-wrap line-clamp-4 break-words">{post.body}</p>
                </div>
                <div className="mt-6 sm:mt-8 flex items-center justify-between gap-2 text-xs sm:text-sm text-slate-500 font-mono border-t border-slate-800/60 pt-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {post.author && (
                      <span className="text-xs font-bold text-cyber-purple">{post.author}</span>
                    )}
                    <Clock size={14} className="text-cyber-pink/70 shrink-0" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <span className={`${catConfig.colorClass} opacity-0 group-hover/card:opacity-100 transition-opacity font-sans font-bold whitespace-nowrap`}>Read full &rarr;</span>
                </div>
              </div>
            );
          })
        )}

      </div>

      {/* Load More Button */}
      {hasMore && posts.length > 0 && !isLoading && (
        <div className="flex justify-center mt-8 sm:mt-12 animate-fade-in-up">
          <button
            onClick={loadMore}
            disabled={isFetchingMore}
            className="group relative px-8 py-3.5 bg-slate-900 border border-slate-700 hover:border-cyber-cyan text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none overflow-hidden flex items-center justify-center min-w-[220px] btn-press"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyber-cyan/10 via-cyber-purple/10 to-cyber-pink/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {isFetchingMore ? (
              <span className="flex items-center gap-2 text-slate-300">
                <Loader2 className="w-5 h-5 animate-spin text-cyber-cyan" />
                Accessing archives...
              </span>
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                Load More Nodes <Sparkles size={16} className="text-cyber-cyan" />
              </span>
            )}
          </button>
        </div>
      )}

      {selectedPost && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/90 backdrop-blur-md transition-all animate-in fade-in duration-300"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="glass-card w-full max-w-3xl h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-3xl border-t sm:border border-cyber-cyan/30 shadow-2xl flex flex-col relative overflow-hidden animate-slide-up sm:animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink"></div>
            
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 sm:p-8 border-b border-slate-800/60 shrink-0 bg-slate-900/80 backdrop-blur-md z-10">
              <div className="pr-12">
                <div className="mb-2">
                  <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-slate-400 border border-slate-700 px-2 py-1 rounded-md bg-slate-950/50">{selectedPost.category || '💡 General Insight'}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight break-words mt-1">
                  {selectedPost.title}
                </h3>
                <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-slate-500 font-mono">
                  <Clock size={12} className="text-cyber-pink/70 shrink-0" />
                  <span>{formatDate(selectedPost.created_at)}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-full p-2.5 transition-all btn-press shadow-lg border border-slate-700/50"
              >
                <X size={20} className="shrink-0" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {selectedPost.image_url && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 rounded-2xl blur opacity-75"></div>
                  <img 
                    src={selectedPost.image_url} 
                    className="relative w-full max-h-96 object-contain rounded-xl border border-slate-700/50 shadow-2xl bg-slate-950" 
                    alt="Knowledge node visual" 
                  />
                </div>
              )}
              <div className="text-slate-200 text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words font-light tracking-wide">
                {selectedPost.body}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-800/60 shrink-0 bg-slate-900/80 backdrop-blur-md flex justify-center sm:justify-end">
              <button 
                onClick={() => setSelectedPost(null)}
                className="w-full sm:w-auto px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 hover:border-cyber-cyan/50 shadow-lg btn-press"
              >
                Close Node
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
