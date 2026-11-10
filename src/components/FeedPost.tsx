import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, Play, Pause, Loader2, Volume2, VolumeX, MoreHorizontal, Link2, Flag, EyeOff, UserMinus, User, X, Maximize2 } from "lucide-react";
import { useMute } from "@/contexts/MuteContext";
import VerifiedBadge from "@/components/VerifiedBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CommentsSection from "@/components/CommentsSection";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FollowButton } from "@/components/FollowListDialog";

interface FeedPostProps {
  image: string;
  mediaType?: string;
  username: string;
  avatar: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  index: number;
  autoPlay?: boolean;
  postId?: string;
  isVerified?: boolean | null;
  isOfficial?: boolean | null;
  authorId?: string;
  handle?: string | null;
  bio?: string | null;
}

const SAVED_KEY = "primegram:savedPosts";
const HIDDEN_KEY = "primegram:hiddenPosts";
const readSet = (k: string) => { try { return new Set<string>(JSON.parse(localStorage.getItem(k) || "[]")); } catch { return new Set<string>(); } };
const writeSet = (k: string, s: Set<string>) => localStorage.setItem(k, JSON.stringify([...s]));

const Avatar = ({ avatar, username, size = "w-9 h-9 text-sm" }: { avatar: string; username: string; size?: string }) =>
  avatar.startsWith("http") ? (
    <img src={avatar} alt={username} className={`${size} rounded-full object-cover`} />
  ) : (
    <div className={`${size} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold`}>{avatar}</div>
  );

const FeedPost = ({ image, mediaType = "image", username, avatar, caption, likes, comments, timeAgo, index, autoPlay = true, postId, isVerified, isOfficial, authorId, handle, bio }: FeedPostProps) => {
  const navigate = useNavigate();
  const { muted, toggleMuted } = useMute();
  const [me, setMe] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(() => !!postId && readSet(SAVED_KEY).has(postId));
  const [hidden, setHidden] = useState(() => !!postId && readSet(HIDDEN_KEY).has(postId));
  const [likeCount, setLikeCount] = useState(likes);
  const [showHeart, setShowHeart] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const lastTap = useRef(0);
  const tapTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(comments);
  const [fullPost, setFullPost] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });

  const isVideo = mediaType === "video";
  const postLink = postId ? `${window.location.origin}/?post=${postId}` : window.location.origin;

  // Load my like + follow state and the real comment count.
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setMe(user?.id ?? null);
      const [likeRes, countRes, followRes] = await Promise.all([
        user ? supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("post_id", postId),
        user && authorId ? supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", authorId).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setLiked(!!likeRes.data);
      if (typeof (countRes as any).count === "number") setCommentCount((countRes as any).count);
      setFollowing(!!followRes.data);
    })();
    return () => { cancelled = true; };
  }, [postId, authorId]);

  useEffect(() => {
    if (!profileOpen || !authorId) return;
    (async () => {
      const [a, b, c] = await Promise.all([
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", authorId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", authorId),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", authorId),
      ]);
      setStats({ followers: a.count ?? 0, following: b.count ?? 0, posts: c.count ?? 0 });
    })();
  }, [profileOpen, authorId, following]);

  const setLike = async (next: boolean) => {
    if (!postId) return;
    if (!me) return toast.error("Sign in to like posts");
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    const { error } = next
      ? await supabase.from("post_likes").insert({ post_id: postId, user_id: me })
      : await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", me);
    if (error && !error.message.includes("duplicate")) {
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toast.error("Couldn't update like");
    }
  };

  const toggleSave = () => {
    if (!postId) return;
    const s = readSet(SAVED_KEY);
    if (saved) s.delete(postId); else s.add(postId);
    writeSet(SAVED_KEY, s);
    setSaved(!saved);
    toast.success(saved ? "Removed from saved" : "Saved");
  };

  const sharePost = async () => {
    const text = `${username} on Primegram: ${caption}`;
    try {
      if (navigator.share) await navigator.share({ title: "Primegram", text, url: postLink });
      else { await navigator.clipboard.writeText(postLink); toast.success("Link copied"); }
    } catch { /* cancelled */ }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(postLink); toast.success("Link copied"); } catch { toast.error("Couldn't copy link"); }
  };

  const hidePost = () => {
    if (!postId) return;
    const s = readSet(HIDDEN_KEY); s.add(postId); writeSet(HIDDEN_KEY, s);
    setHidden(true);
    toast.success("Post hidden");
  };

  const unfollow = async () => {
    if (!me || !authorId) return;
    await supabase.from("follows").delete().eq("follower_id", me).eq("following_id", authorId);
    setFollowing(false);
    toast.success(`Unfollowed ${username}`);
  };

  const report = async () => {
    const reason = window.prompt("Report this post — what's wrong with it?");
    if (!reason?.trim()) return;
    if (!postId) return toast.error("This post can't be reported");
    const { error } = await supabase.from("reports").insert({ target_type: "post", target_id: postId, reason: reason.trim() });
    if (error) toast.error(error.message); else toast.success("Report sent to the Primegram team");
  };

  // Autoplay when visible.
  useEffect(() => {
    if (!isVideo || !autoPlay || !videoRef.current) return;
    const el = videoRef.current;
    const obs = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
      if (entry.isIntersecting) { el.play().then(() => setIsPlaying(true)).catch(() => {}); }
      else { el.pause(); setIsPlaying(false); }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isVideo, autoPlay]);

  const togglePlayPause = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) v.play().then(() => setIsPlaying(true)).catch(() => {});
    else { v.pause(); setIsPlaying(false); }
  };

  // Double tap = like; single tap = open full screen (images) / play-pause (videos).
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (tapTimer.current) { clearTimeout(tapTimer.current); tapTimer.current = null; }
      if (!liked) void setLike(true);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      tapTimer.current = window.setTimeout(() => {
        tapTimer.current = null;
        if (isVideo) togglePlayPause(); else setFullPost(true);
      }, 300);
    }
    lastTap.current = now;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liked, isVideo, me]);

  if (hidden) return null;

  const openProfile = () => authorId && setProfileOpen(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 5) * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6"
    >
      <div className="liquid-glass rounded-[1.5rem] overflow-hidden">
        <div className="flex items-center gap-3 p-4 relative z-10">
          <button onClick={openProfile} aria-label={`Open ${username}'s profile`} className="depth-press">
            <Avatar avatar={avatar} username={username} />
          </button>
          <button onClick={openProfile} className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
              {username}
              <VerifiedBadge isVerified={isVerified} isOfficial={isOfficial} />
            </p>
            <p className="text-caption text-muted-foreground">{timeAgo}</p>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Post options" className="depth-press w-8 h-8 flex items-center justify-center rounded-full liquid-glass-subtle">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={toggleSave}><Bookmark className="w-4 h-4 mr-2" />{saved ? "Unsave post" : "Save post"}</DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}><Link2 className="w-4 h-4 mr-2" />Copy link</DropdownMenuItem>
              <DropdownMenuItem onClick={sharePost}><Send className="w-4 h-4 mr-2" />Share to…</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFullPost(true)}><Maximize2 className="w-4 h-4 mr-2" />View full screen</DropdownMenuItem>
              {authorId && <DropdownMenuItem onClick={openProfile}><User className="w-4 h-4 mr-2" />About this account</DropdownMenuItem>}
              {following && authorId !== me && <DropdownMenuItem onClick={unfollow}><UserMinus className="w-4 h-4 mr-2" />Unfollow</DropdownMenuItem>}
              <DropdownMenuItem onClick={hidePost}><EyeOff className="w-4 h-4 mr-2" />Not interested</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={report} className="text-destructive focus:text-destructive"><Flag className="w-4 h-4 mr-2" />Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative bg-background/40 flex items-center justify-center" onClick={handleTap}>
          {isVideo ? (
            <div className="relative w-full">
              <video
                ref={videoRef}
                src={image}
                className="w-full h-auto max-h-[75vh] object-contain bg-background"
                playsInline
                muted={muted}
                loop
                preload="metadata"
                onLoadStart={() => setVideoLoading(true)}
                onCanPlay={() => setVideoLoading(false)}
                onWaiting={() => setVideoLoading(true)}
                onPlaying={() => setVideoLoading(false)}
              />
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 pointer-events-none">
                  <Loader2 className="w-10 h-10 text-foreground animate-spin" />
                </div>
              )}
              {!isVisible && !videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full liquid-glass flex items-center justify-center"><Play className="w-8 h-8 text-foreground" /></div>
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); toggleMuted(); }}
                className="absolute top-2 right-2 w-9 h-9 rounded-full liquid-glass flex items-center justify-center depth-press"
                aria-label={muted ? "Unmute videos" : "Mute videos"}
              >
                {muted ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setFullPost(true); }}
                className="absolute bottom-2 left-2 w-8 h-8 rounded-full liquid-glass flex items-center justify-center depth-press"
                aria-label="Full screen"
              >
                <Maximize2 className="w-4 h-4 text-foreground" />
              </button>
              <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full liquid-glass flex items-center justify-center pointer-events-none">
                {isPlaying ? <Pause className="w-4 h-4 text-foreground" /> : <Play className="w-4 h-4 text-foreground" />}
              </div>
            </div>
          ) : (
            // Natural aspect ratio: square, portrait, landscape and panoramas all show whole.
            <img src={image} alt={`Post by ${username}`} className="w-full h-auto max-h-[75vh] object-contain" loading="lazy" decoding="async" />
          )}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-20 h-20 fill-like text-like drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <button onClick={() => setLike(!liked)} className="depth-press" aria-label={liked ? "Unlike" : "Like"}>
              <motion.div animate={liked ? { scale: [1, 1.3, 0.9, 1] } : {}} transition={{ duration: 0.4 }}>
                <Heart className={`w-6 h-6 transition-colors ${liked ? "fill-like text-like" : "text-foreground"}`} />
              </motion.div>
            </button>
            <button onClick={() => setShowComments((s) => !s)} className="depth-press" aria-label="Comments"><MessageCircle className="w-6 h-6 text-foreground" /></button>
            <button onClick={sharePost} className="depth-press" aria-label="Share"><Send className="w-6 h-6 text-foreground" /></button>
            <div className="flex-1" />
            <button onClick={toggleSave} className="depth-press" aria-label={saved ? "Unsave" : "Save"}>
              <Bookmark className={`w-6 h-6 transition-colors ${saved ? "fill-foreground text-foreground" : "text-foreground"}`} />
            </button>
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">{likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}</p>
          {caption && (
            <p className="text-sm text-foreground/90">
              <span className="font-semibold">{username}</span>{" "}
              <span className="text-foreground/70">{caption}</span>
            </p>
          )}
          {!showComments && commentCount > 0 && (
            <button onClick={() => setShowComments(true)} className="text-sm text-muted-foreground mt-1">View all {commentCount} comments</button>
          )}
          {showComments && postId && <CommentsSection postId={postId} onCountChange={setCommentCount} />}
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-2">{timeAgo}</p>
        </div>
      </div>

      {/* Full-screen post */}
      <Dialog open={fullPost} onOpenChange={setFullPost}>
        <DialogContent className="max-w-none w-screen h-dvh p-0 border-0 rounded-none bg-background/95 flex flex-col [&>button]:hidden">
          <DialogTitle className="sr-only">Post by {username}</DialogTitle>
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => { setFullPost(false); openProfile(); }}><Avatar avatar={avatar} username={username} /></button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1">{username}<VerifiedBadge isVerified={isVerified} isOfficial={isOfficial} /></p>
              <p className="text-caption text-muted-foreground">{timeAgo}</p>
            </div>
            <button onClick={() => setFullPost(false)} aria-label="Close" className="depth-press w-9 h-9 rounded-full liquid-glass flex items-center justify-center"><X className="w-5 h-5 text-foreground" /></button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {isVideo
              ? <video src={image} controls autoPlay playsInline muted={muted} className="max-w-full max-h-full object-contain" />
              : <img src={image} alt={`Post by ${username}`} className="max-w-full max-h-full object-contain" />}
          </div>
          <div className="p-4 space-y-2 max-h-[40vh] overflow-y-auto">
            <div className="flex items-center gap-4">
              <button onClick={() => setLike(!liked)} aria-label="Like"><Heart className={`w-6 h-6 ${liked ? "fill-like text-like" : "text-foreground"}`} /></button>
              <button onClick={sharePost} aria-label="Share"><Send className="w-6 h-6 text-foreground" /></button>
              <div className="flex-1" />
              <button onClick={toggleSave} aria-label="Save"><Bookmark className={`w-6 h-6 ${saved ? "fill-foreground" : ""} text-foreground`} /></button>
            </div>
            <p className="text-sm font-semibold text-foreground">{likeCount.toLocaleString()} likes</p>
            {caption && <p className="text-sm text-foreground/80"><span className="font-semibold">{username}</span> {caption}</p>}
            {postId && <CommentsSection postId={postId} onCountChange={setCommentCount} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen profile card */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-none w-screen h-dvh p-0 border-0 rounded-none bg-background flex flex-col items-center justify-center [&>button]:hidden">
          <DialogTitle className="sr-only">{username}'s profile</DialogTitle>
          <button onClick={() => setProfileOpen(false)} aria-label="Close" className="absolute top-4 right-4 depth-press w-9 h-9 rounded-full liquid-glass flex items-center justify-center"><X className="w-5 h-5 text-foreground" /></button>
          <div className="w-full max-w-sm px-6 text-center space-y-5">
            <div className="mx-auto w-28 h-28 rounded-full p-1 bg-gradient-to-br from-primary to-accent">
              <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center">
                <Avatar avatar={avatar} username={username} size="w-full h-full text-4xl" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">{username}<VerifiedBadge isVerified={isVerified} isOfficial={isOfficial} /></h2>
              {handle && <p className="text-sm text-muted-foreground">@{handle}</p>}
            </div>
            {bio && <p className="text-sm text-foreground/80">{bio}</p>}
            <div className="grid grid-cols-3 liquid-glass rounded-2xl py-4">
              {[["Posts", stats.posts], ["Followers", stats.followers], ["Following", stats.following]].map(([l, v]) => (
                <div key={l as string} className="relative z-10"><p className="text-lg font-bold text-foreground">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>
              ))}
            </div>
            {authorId && authorId !== me && (
              <div className="flex gap-3">
                <div className="flex-1 [&>button]:w-full"><FollowButton targetId={authorId} following={following} onChange={setFollowing} /></div>
                <button onClick={() => { setProfileOpen(false); navigate("/messages"); }} className="flex-1 depth-press rounded-xl liquid-glass text-sm font-semibold text-foreground py-2">Message</button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default FeedPost;
