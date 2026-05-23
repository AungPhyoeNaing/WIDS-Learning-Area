import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { MessageSquarePlus, Clock, Send, Loader2, Sparkles, Database, Network, X, Image as ImageIcon, Upload, Eye, Cpu, FileCode2, ShieldAlert } from 'lucide-react';
import { useProfile, PROFILES } from '../contexts/ProfileContext';

const FEED_CATEGORIES = [
  { id: '📡 RF & Hardware', label: 'RF & Hardware', colorClass: 'text-emerald-400', borderClass: 'border-slate-800' },
  { id: '🔒 Protocol Security', label: 'Protocol Security', colorClass: 'text-indigo-400', borderClass: 'border-slate-800' },
  { id: '💻 Code & Logic', label: 'Code & Logic', colorClass: 'text-blue-400', borderClass: 'border-slate-800' },
  { id: '⚔️ Attack / Defense', label: 'Attack / Defense', colorClass: 'text-red-400', borderClass: 'border-slate-800' },
  { id: '💡 General Insight', label: 'General Insight', colorClass: 'text-amber-500', borderClass: 'border-slate-800' }
];

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All Knowledge', colorClass: 'text-slate-100', borderClass: 'border-slate-800' },
  ...FEED_CATEGORIES
];

export default function KnowItAll() {
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
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 p-1.5 bg-slate-900 rounded-xl border border-slate-800">
        {FILTER_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.id)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
              activeFilter === cat.id 
                ? `bg-slate-800 text-slate-100 border border-slate-700` 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-auto grid-flow-dense">

        <div className="bg-slate-900 p-6 rounded-xl col-span-1 md:col-span-2 lg:col-span-2 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-slate-200 mb-4 flex items-center gap-2">
              <MessageSquarePlus className="text-blue-500 shrink-0 w-5 h-5" />
              Share Knowledge
            </h2>
            <p className="text-slate-400 text-sm mt-1">Broadcast new findings to the team instantly.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 ml-0.5">Highlight Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Bypassing MAC filtering..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-100 p-2.5 rounded-lg outline-none transition-all placeholder-slate-600 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 ml-0.5">Knowledge Category</label>
                  <div className="relative" ref={dropdownRef}>
                    <div
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full bg-slate-950 border ${isDropdownOpen ? 'border-blue-500' : 'border-slate-800 hover:border-slate-700'} text-slate-100 p-2.5 rounded-lg outline-none transition-all text-sm cursor-pointer flex justify-between items-center group`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={FEED_CATEGORIES.find(c => c.id === postCategory)?.colorClass}>
                          {postCategory.split(' ')[0]}
                        </span>
                        <span>{FEED_CATEGORIES.find(c => c.id === postCategory)?.label}</span>
                      </span>
                      <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden py-1 animate-fade-in-up origin-top">
                        {FEED_CATEGORIES.map(cat => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              setPostCategory(cat.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-3.5 py-2.5 cursor-pointer transition-all flex items-center gap-2 hover:bg-slate-800 group ${postCategory === cat.id ? 'bg-slate-800/80 border-l-2 ' + cat.borderClass.replace('!', '') : 'border-l-2 border-transparent'}`}
                          >
                            <span className={`text-base ${cat.colorClass}`}>
                               {cat.id.split(' ')[0]} 
                            </span>
                            <span className={`text-xs sm:text-sm font-medium transition-colors ${postCategory === cat.id ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-200'}`}>
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
                <label className="block text-xs font-mono text-slate-400 mb-1 ml-0.5">Main Text Body</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What did you learn today?"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-100 p-2.5 rounded-lg outline-none transition-all resize-none placeholder-slate-600 text-sm"
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-lg text-xs transition-all text-slate-400 hover:text-slate-200">
                  <Upload size={14} />
                  {image ? image.name : "Attach Image"}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button 
                type="submit" 
                disabled={isSubmitting || !title.trim() || !body.trim()}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Send size={16} className="shrink-0" />}
                {isSubmitting ? 'Transmitting...' : 'Broadcast'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl col-span-1 md:col-span-2 lg:col-span-1 border border-slate-800 shadow-sm flex flex-col min-h-[160px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
              🏆 Top Researchers
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
            {Object.entries(userScores || {})
              .map(([id, data]) => ({ id, profile: PROFILES.find(p => p.id === id), score: data.totalScore }))
              .filter(entry => entry.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((entry, idx) => (
                <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-4 text-center ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-600'}`}>
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-medium ${entry.profile?.color || 'text-white'}`}>{entry.profile?.nickname || entry.id}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{entry.score} XP</span>
                </div>
            ))}
            {Object.keys(userScores || {}).filter(k => userScores[k].totalScore > 0).length === 0 && (
              <p className="text-xs text-slate-500 italic text-center mt-4">No scores recorded yet. Earn XP to rank up!</p>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 shadow-sm col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center min-h-[200px]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 shadow-sm col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center min-h-[200px] text-center text-slate-500 italic">
            No knowledge shared yet. Be the first to add a node to the network!
          </div>
        ) : (
          posts.map((post, index) => {
            const catConfig = FEED_CATEGORIES.find(c => c.id === post.category) || FEED_CATEGORIES[4];
            return (
              <div 
                key={post.id} 
                onClick={() => { setSelectedPost(post); markAsRead(post.id); }}
                className={`bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 flex flex-col group/card cursor-pointer ${getBentoSpan(index)} animate-slide-up overflow-hidden relative`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {post.image_url && <img src={post.image_url} className="w-full h-40 object-cover mb-4 rounded-lg border border-slate-800/50" alt={`Image for: ${post.title}`} />}
                {!readPosts.includes(post.id) && (
                  <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider ${catConfig.colorClass} bg-slate-950 px-2 py-0.5 rounded-full border border-slate-850 shadow-sm`}>New</span>
                )}
                <div className="mb-2">
                  <span className={`text-[10px] sm:text-xs font-mono uppercase tracking-widest ${catConfig.colorClass} opacity-80`}>{post.category || '💡 General Insight'}</span>
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-slate-100 mb-2 group-hover/card:text-blue-400 transition-colors flex items-start gap-2 break-words">
                    <span className="line-clamp-2">{post.title}</span>
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 break-words">{post.body}</p>
                </div>
                <div className="mt-6 flex items-center justify-between gap-2 text-xs text-slate-500 font-mono border-t border-slate-800/60 pt-4">
                  <div className="flex items-center gap-2">
                    {post.author && (
                      <span className="text-xs font-bold text-slate-400">{post.author}</span>
                    )}
                    <Clock size={12} className="text-slate-600 shrink-0" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <span className="text-blue-500 opacity-0 group-hover/card:opacity-100 transition-opacity font-sans font-medium whitespace-nowrap">Read full &rarr;</span>
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
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[200px]"
          >
            {isFetchingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Accessing archives...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Load More Nodes
              </span>
            )}
          </button>
        </div>
      )}

      {selectedPost && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 transition-all duration-205 animate-in fade-in"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-slate-900 w-full max-w-3xl h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-xl border border-slate-800 shadow-xl flex flex-col relative overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-800 shrink-0 bg-slate-900 z-10">
              <div className="pr-12">
                <div className="mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border border-slate-800 px-2 py-1 rounded bg-slate-950">{selectedPost.category || '💡 General Insight'}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-100 leading-tight break-words mt-1">
                  {selectedPost.title}
                </h3>
                <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500 font-mono">
                  <Clock size={12} className="text-slate-600 shrink-0" />
                  <span>{formatDate(selectedPost.created_at)}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-full p-2 transition-all border border-slate-700"
              >
                <X size={16} className="shrink-0" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {selectedPost.image_url && (
                <div className="relative">
                  <img 
                    src={selectedPost.image_url} 
                    className="w-full max-h-80 object-contain rounded-lg border border-slate-800 bg-slate-950" 
                    alt="Knowledge node visual" 
                  />
                </div>
              )}
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {selectedPost.body}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-800 shrink-0 bg-slate-900 flex justify-center sm:justify-end">
              <button 
                onClick={() => setSelectedPost(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
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
