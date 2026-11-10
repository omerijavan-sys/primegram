import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Film, Upload, Heart, MessageCircle, Share2, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import GlassTabBar from "@/components/GlassTabBar";

const ReelsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [caption, setCaption] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reels, setReels] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const fetchReels = async () => {
      const { data } = await supabase.from("reels").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        setReels(data.map(r => ({ ...r, profile: profileMap.get(r.user_id) })));
      }
    };
    fetchReels();
  }, []);

  // Snap scroll observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container || reels.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const idx = Number(entry.target.getAttribute("data-index"));
        const video = videoRefs.current.get(idx);
        if (entry.isIntersecting) {
          setCurrentIndex(idx);
          video?.play().catch(() => {});
        } else {
          video?.pause();
        }
      });
    }, { root: container, threshold: 0.7 });

    container.querySelectorAll("[data-index]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    } else {
      toast.error("Please select a video file");
    }
  };

  const handleCreateReel = async () => {
    if (!user || !videoFile) { toast.error("Select a video"); return; }
    setUploading(true);
    try {
      const ext = videoFile.name.split(".").pop();
      const path = `${user.id}/reel_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("media").upload(path, videoFile);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      const { error } = await supabase.from("reels").insert({ user_id: user.id, caption: caption || null, music_title: musicTitle || null, video_url: publicUrl });
      if (error) throw error;
      toast.success("Reel posted!");
      setCreating(false); setCaption(""); setMusicTitle(""); setVideoFile(null); setVideoPreview(null);
      const { data } = await supabase.from("reels").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setReels(data);
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally { setUploading(false); }
  };

  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!user || reels.length === 0) return;
    const ids = reels.map(r => r.id);
    supabase.from("reel_likes").select("reel_id").eq("user_id", user.id).in("reel_id", ids)
      .then(({ data }) => setLiked(new Set((data || []).map(d => d.reel_id))));
    supabase.from("reel_comments").select("reel_id").in("reel_id", ids).then(({ data }) => {
      const c: Record<string, number> = {};
      (data || []).forEach(d => { c[d.reel_id] = (c[d.reel_id] || 0) + 1; });
      setCommentCounts(c);
    });
  }, [user, reels.length]);

  const toggleLike = async (id: string) => {
    if (!user) { toast.error("Sign in to like"); return; }
    const isLiked = liked.has(id);
    setLiked(prev => { const n = new Set(prev); isLiked ? n.delete(id) : n.add(id); return n; });
    setReels(prev => prev.map(r => r.id === id ? { ...r, likes_count: Math.max(0, r.likes_count + (isLiked ? -1 : 1)) } : r));
    const { error } = isLiked
      ? await supabase.from("reel_likes").delete().eq("reel_id", id).eq("user_id", user.id)
      : await supabase.from("reel_likes").insert({ reel_id: id, user_id: user.id });
    if (error) toast.error("Couldn't update like");
  };

  const loadComments = async (id: string) => {
    setOpenComments(id);
    const { data } = await supabase.from("reel_comments").select("*").eq("reel_id", id).order("created_at", { ascending: true });
    const uids = [...new Set((data || []).map(c => c.user_id))];
    const { data: profs } = uids.length ? await supabase.from("profiles").select("user_id, username, display_name").in("user_id", uids) : { data: [] as any[] };
    const pm = new Map((profs || []).map(p => [p.user_id, p]));
    setComments((data || []).map(c => ({ ...c, profile: pm.get(c.user_id) })));
  };

  const postComment = async () => {
    if (!user || !openComments || !newComment.trim()) return;
    const { error } = await supabase.from("reel_comments").insert({ reel_id: openComments, user_id: user.id, content: newComment.trim() });
    if (error) { toast.error("Couldn't post comment"); return; }
    setNewComment("");
    setCommentCounts(c => ({ ...c, [openComments]: (c[openComments] || 0) + 1 }));
    loadComments(openComments);
  };

  const shareReel = async (reel: any) => {
    const url = `${window.location.origin}/reels?r=${reel.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "Primegram Reel", text: reel.caption || "Watch this reel", url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="flex items-center justify-between px-5 py-4">
          <button onClick={() => navigate("/")} className="depth-press w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white font-semibold text-base">Reels</span>
          <button onClick={() => setCreating(true)} className="depth-press w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      {reels.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mb-4">
            <Film className="w-10 h-10 text-white/50" />
          </div>
          <p className="text-white font-semibold mb-1">No reels yet</p>
          <p className="text-sm text-white/50 mb-6">Create the first reel!</p>
          <button onClick={() => setCreating(true)} className="depth-press px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm">Create Reel</button>
        </div>
      ) : (
        <div ref={containerRef} className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-none">
          {reels.map((reel, i) => (
            <div
              key={reel.id}
              data-index={i}
              className="h-screen w-full snap-start snap-always relative flex items-center justify-center bg-black"
              onClick={() => {
                const v = videoRefs.current.get(i);
                if (!v) return;
                if (v.paused) v.play().catch(() => {}); else v.pause();
              }}
            >
              {reel.video_url && (
                <video
                  ref={el => { if (el) videoRefs.current.set(i, el); }}
                  src={reel.video_url}
                  className="h-full w-full object-cover"
                  loop
                  playsInline
                  muted={muted}
                  preload={i < 3 ? "auto" : "none"}
                />
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              {/* Side actions */}
              <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
                <button onClick={(e) => { e.stopPropagation(); toggleLike(reel.id); }} className="depth-press flex flex-col items-center gap-1" aria-label="Like">
                  <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                    <Heart className={`w-6 h-6 ${liked.has(reel.id) ? "text-red-500 fill-red-500" : "text-white"}`} />
                  </div>
                  <span className="text-white text-xs">{reel.likes_count}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); loadComments(reel.id); }} className="depth-press flex flex-col items-center gap-1" aria-label="Comments">
                  <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs">{commentCounts[reel.id] || 0}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); shareReel(reel); }} className="depth-press flex flex-col items-center gap-1" aria-label="Share">
                  <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="depth-press">
                  <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                    {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </div>
                </button>
              </div>

              {/* Bottom info */}
              <div className="absolute left-4 right-16 bottom-16 z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center text-white text-sm font-bold">
                    {(reel.profile?.display_name || "U")[0]}
                  </div>
                  <span className="text-white font-semibold text-sm">{reel.profile?.display_name || "User"}</span>
                </div>
                {reel.caption && <p className="text-white/90 text-sm mb-1">{reel.caption}</p>}
                {reel.music_title && <p className="text-white/60 text-xs">🎵 {reel.music_title}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-background flex flex-col">
            <div className="liquid-glass-elevated safe-area-top">
              <div className="flex items-center gap-3 px-5 py-4 relative z-10">
                <button onClick={() => { setCreating(false); setVideoFile(null); setVideoPreview(null); }} className="depth-press"><X className="w-5 h-5 text-foreground" /></button>
                <span className="text-headline text-foreground text-base flex-1">New Reel</span>
                <button onClick={handleCreateReel} disabled={uploading || !videoFile} className="depth-press px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                </button>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-4 overflow-y-auto">
              <div className="liquid-glass rounded-2xl p-6 relative z-10">
                <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                {videoPreview ? (
                  <div className="relative">
                    <video src={videoPreview} className="w-full rounded-xl aspect-[9/16] object-cover" controls />
                    <button onClick={() => { setVideoFile(null); setVideoPreview(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"><X className="w-4 h-4 text-foreground" /></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} className="depth-press w-full py-16 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-3">
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tap to upload video</span>
                  </button>
                )}
              </div>
              <div className="liquid-glass rounded-2xl p-4 relative z-10">
                <label className="text-caption text-muted-foreground block mb-2">Caption</label>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write a caption..." className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none h-20" />
              </div>
              <div className="liquid-glass rounded-2xl p-4 relative z-10">
                <label className="text-caption text-muted-foreground block mb-2">Music (optional)</label>
                <input value={musicTitle} onChange={e => setMusicTitle(e.target.value)} placeholder="Add music title..." className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openComments && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-x-0 bottom-0 z-[60] max-h-[70vh] rounded-t-3xl liquid-glass bg-background/95 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border relative z-10">
              <span className="font-semibold text-foreground">Comments</span>
              <button onClick={() => setOpenComments(null)} aria-label="Close comments"><X className="w-5 h-5 text-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 relative z-10">
              {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first!</p>}
              {comments.map(c => (
                <div key={c.id} className="text-sm">
                  <span className="font-semibold text-foreground mr-2">{c.profile?.username || c.profile?.display_name || "user"}</span>
                  <span className="text-foreground/90">{c.content}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-4 border-t border-border relative z-10">
              <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && postComment()} placeholder="Add a comment..." className="flex-1 bg-muted rounded-full px-4 py-2 text-sm text-foreground outline-none" />
              <button onClick={postComment} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">Post</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <GlassTabBar />
    </div>
  );
};

export default ReelsPage;
