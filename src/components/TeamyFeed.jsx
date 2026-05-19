import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquarePlus, Clock, Send, Loader2, Sparkles, Database, Network, X } from 'lucide-react';

export default function TeamyFeed() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setPosts(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setPosts((currentPosts) => [payload.new, ...currentPosts]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  // Handle escape key for closing modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPost(null);
    };
    if (selectedPost) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('posts')
      .insert([{ title: title.trim(), body: body.trim() }]);

    if (!error) {
      setTitle('');
      setBody('');
    } else {
      console.error("Error submitting post:", error);
      alert("Failed to submit post. Please make sure the Supabase table exists.");
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getBentoSpan = (index) => {
    const pattern = index % 4;
    if (pattern === 0) return 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800/80 border-cyber-cyan/20 hover:border-cyber-cyan/50';
    if (pattern === 1) return 'md:col-span-1 lg:col-span-1 bg-slate-900 border-slate-800/80 hover:border-slate-700';
    if (pattern === 2) return 'md:col-span-1 lg:col-span-1 bg-slate-900 border-slate-800/80 hover:border-slate-700';
    if (pattern === 3) return 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-900 border-cyber-pink/20 hover:border-cyber-pink/50';
    return 'col-span-1';
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 relative">
      
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-auto grid-flow-dense">

        {/* --- BENTO BOX 1: Create Post Form --- */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl md:col-span-2 lg:col-span-2 border border-slate-800 shadow-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink opacity-70 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquarePlus className="text-cyber-cyan" />
              Share Knowledge
            </h2>
            <p className="text-slate-400 text-sm mt-1">Broadcast new findings to the team instantly.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 ml-1">Highlight Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Bypassing MAC filtering..."
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyber-cyan text-white p-3.5 rounded-2xl outline-none transition-all placeholder-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 ml-1">Main Text Body</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What did you learn today?"
                  rows={3}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyber-purple text-white p-3.5 rounded-2xl outline-none transition-all resize-none placeholder-slate-700"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting || !title.trim() || !body.trim()}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white border border-slate-700 hover:border-cyber-cyan px-8 py-3 rounded-2xl font-bold transition-all btn-press flex items-center gap-2 group/btn shadow-lg"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform text-cyber-cyan" />}
                {isSubmitting ? 'Transmitting...' : 'Broadcast'}
              </button>
            </div>
          </form>
        </div>

        {/* --- BENTO BOX 2: Stats & Atmosphere --- */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl md:col-span-2 lg:col-span-1 border border-slate-800 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800/50 flex flex-col justify-center items-center text-center relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 text-cyber-purple">
            <Network size={160} />
          </div>
          <div className="p-4 rounded-full bg-slate-950/50 border border-slate-800 mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <Database className="text-cyber-cyan w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-2">{posts.length}</h3>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Sparkles size={12} className="text-cyber-pink" />
            Knowledge Nodes
          </p>
        </div>

        {/* --- BENTO BOXES 3+: Feed Items --- */}
        {isLoading ? (
          <div className="md:col-span-2 lg:col-span-3 flex justify-center p-16 glass-card rounded-3xl border border-slate-800">
            <Loader2 className="w-10 h-10 text-cyber-cyan animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 glass-card p-16 rounded-3xl border border-slate-800 text-center text-slate-500 italic">
            No knowledge shared yet. Be the first to add a node to the network!
          </div>
        ) : (
          posts.map((post, index) => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)}
              className={`glass-card p-6 sm:p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between group/card cursor-pointer ${getBentoSpan(index)} animate-slide-up`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-white mb-4 group-hover/card:text-white transition-colors flex items-start gap-2">
                  <span className="text-cyber-cyan mt-1">•</span>
                  {post.title}
                </h4>
                {/* line-clamp-4 restricts the text to 4 lines with an ellipsis (...) */}
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">{post.body}</p>
              </div>
              <div className="mt-8 flex items-center justify-between gap-2 text-xs text-slate-500 font-mono border-t border-slate-800/60 pt-4">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-cyber-pink/70" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
                <span className="text-cyber-cyan/0 group-hover/card:text-cyber-cyan/100 transition-colors font-sans font-bold">Read full &rarr;</span>
              </div>
            </div>
          ))
        )}

      </div>

      {/* --- MODAL FOR FULL POST --- */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm transition-all"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="glass-card w-full max-w-3xl max-h-[85vh] rounded-3xl border border-cyber-cyan/30 shadow-2xl flex flex-col relative overflow-hidden animate-bounce-in"
            onClick={e => e.stopPropagation()} // Prevent clicks inside the modal from closing it
          >
            {/* Modal Top Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink"></div>
            
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 sm:p-8 border-b border-slate-800/60 shrink-0 bg-slate-900/50">
              <h3 className="text-xl sm:text-2xl font-bold text-white pr-8 leading-tight flex items-start gap-2">
                <span className="text-cyber-cyan mt-1">•</span>
                {selectedPost.title}
              </h3>
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-6 right-6 sm:top-8 sm:right-8 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-full p-2 transition-all btn-press"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="p-6 sm:p-8 overflow-y-auto scrollbar-thin text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap bg-slate-900/20">
              {selectedPost.body}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 sm:p-8 border-t border-slate-800/60 shrink-0 bg-slate-900/50 flex items-center gap-2 text-xs text-slate-500 font-mono">
              <Clock size={14} className="text-cyber-pink/70" />
              <span>Posted on {formatDate(selectedPost.created_at)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
