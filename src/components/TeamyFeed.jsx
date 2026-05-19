import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquarePlus, Clock, Send, Loader2, Sparkles } from 'lucide-react';

export default function TeamyFeed() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Optimization: Limit initial load to 50 posts
    
    if (!error && data) {
      setPosts(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    // Optimization: Real-time subscription to see new posts instantly
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('posts')
      .insert([{ title: title.trim(), body: body.trim() }]);

    // We no longer need to manually update state here because the real-time subscription will catch it
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Create Post Form */}
      <div className="glass-card p-6 rounded-2xl border border-cyber-cyan/30 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink"></div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <MessageSquarePlus className="text-cyber-cyan" />
          Share Knowledge
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Highlight Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Interesting fact about WPA3..."
              className="w-full bg-slate-900/50 border border-slate-700 focus:border-cyber-cyan text-white p-3 rounded-xl outline-none transition-all placeholder-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Main Text Body</label>
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you learn today?"
              rows={4}
              className="w-full bg-slate-900/50 border border-slate-700 focus:border-cyber-cyan text-white p-3 rounded-xl outline-none transition-all resize-none placeholder-slate-600"
              required
            />
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting || !title.trim() || !body.trim()}
              className="bg-gradient-to-r from-cyber-cyan to-blue-600 hover:opacity-90 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold transition-all btn-press flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isSubmitting ? 'Posting...' : 'Post Knowledge'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2">
          <Sparkles className="text-cyber-pink w-5 h-5" />
          Recent Highlights
        </h3>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-cyber-cyan animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl border border-slate-800 text-center text-slate-500 italic">
            No knowledge shared yet. Be the first!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all animate-slide-up">
              <h4 className="text-lg font-bold text-cyber-cyan mb-2">{post.title}</h4>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Clock size={12} />
                <span>{formatDate(post.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
