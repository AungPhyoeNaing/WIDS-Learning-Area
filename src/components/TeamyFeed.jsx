import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { MessageSquarePlus, Clock, Send, Loader2, Sparkles, Database, Network, X, Image as ImageIcon, Upload } from 'lucide-react';

export default function TeamyFeed() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
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
      .insert([{ title: title.trim(), body: body.trim(), image_url: imageUrl }]);

    if (!error) {
      setTitle('');
      setBody('');
      setImage(null);
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

  const getBentoSpan = (index) => {
    const pattern = index % 4;
    if (pattern === 0) return 'col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800/80 border-cyber-cyan/20 hover:border-cyber-cyan/50';
    if (pattern === 1) return 'col-span-1 bg-slate-900 border-slate-800/80 hover:border-slate-700';
    if (pattern === 2) return 'col-span-1 bg-slate-900 border-slate-800/80 hover:border-slate-700';
    if (pattern === 3) return 'col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-900 border-cyber-pink/20 hover:border-cyber-pink/50';
    return 'col-span-1';
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 relative w-full animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-auto grid-flow-dense">

        <div className="glass-card p-5 sm:p-8 rounded-3xl col-span-1 md:col-span-2 lg:col-span-2 border border-slate-800 shadow-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink opacity-70 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquarePlus className="text-cyber-cyan shrink-0" />
              Share Knowledge
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Broadcast new findings to the team instantly.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-mono text-slate-400 mb-1.5 ml-1">Highlight Title</label>
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
                <label className="block text-[10px] sm:text-xs font-mono text-slate-400 mb-1.5 ml-1">Main Text Body</label>
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

        <div className="glass-card p-5 sm:p-8 rounded-3xl col-span-1 md:col-span-2 lg:col-span-1 border border-slate-800 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800/50 flex flex-col justify-center items-center text-center relative overflow-hidden group min-h-[160px]">
          <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 text-cyber-purple">
            <Network size={160} />
          </div>
          <div className="p-3 sm:p-4 rounded-full bg-slate-950/50 border border-slate-800 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <Database className="text-cyber-cyan w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
          </div>
          <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-2">{posts.length}</h3>
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
            <Sparkles size={12} className="text-cyber-pink shrink-0" />
            Knowledge Nodes
          </p>
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
          posts.map((post, index) => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)}
              className={`glass-card p-5 sm:p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl flex flex-col group/card cursor-pointer ${getBentoSpan(index)} animate-slide-up overflow-hidden`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {post.image_url && <img src={post.image_url} className="w-full h-40 object-cover mb-4 rounded-xl" alt={`Image for: ${post.title}`} />}
              <div>
                <h4 className="text-base sm:text-xl font-bold text-white mb-3 group-hover/card:text-white transition-colors flex items-start gap-2 break-words">
                  <span className="text-cyber-cyan mt-1 shrink-0">•</span>
                  <span className="line-clamp-2">{post.title}</span>
                </h4>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 break-words">{post.body}</p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center justify-between gap-2 text-[10px] sm:text-xs text-slate-500 font-mono border-t border-slate-800/60 pt-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock size={14} className="text-cyber-pink/70 shrink-0" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
                <span className="text-cyber-cyan/0 group-hover/card:text-cyber-cyan/100 transition-colors font-sans font-bold whitespace-nowrap">Read full &rarr;</span>
              </div>
            </div>
          ))
        )}

      </div>

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
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight flex items-start gap-2 break-words">
                  <span className="text-cyber-cyan mt-1.5 shrink-0 block w-2 h-2 rounded-full bg-cyber-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span>
                  {selectedPost.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-[10px] sm:text-xs text-slate-500 font-mono">
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
              <div className="text-slate-200 text-sm sm:text-lg leading-relaxed whitespace-pre-wrap break-words font-light tracking-wide">
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
