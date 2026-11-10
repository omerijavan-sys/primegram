import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Grid3X3, Bookmark, Heart, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GlassTabBar from "@/components/GlassTabBar";
import VerifiedBadge from "@/components/VerifiedBadge";
import FollowListDialog, { FollowButton } from "@/components/FollowListDialog";

interface Profile {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified?: boolean | null;
  is_official?: boolean | null;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<"posts" | "saved" | "liked">("posts");
  const avatarRef = useRef<HTMLInputElement>(null);
  const [myFollowing, setMyFollowing] = useState<Set<string>>(new Set());
  const [suggested, setSuggested] = useState<any[]>([]);
  const [listMode, setListMode] = useState<"followers" | "following" | null>(null);
  const [tabPosts, setTabPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!user || tab === "posts") return;
    const load = async () => {
      let ids: string[] = [];
      if (tab === "saved") {
        try { ids = JSON.parse(localStorage.getItem("primegram:savedPosts") || "[]"); } catch { ids = []; }
      } else {
        const { data } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id).order("created_at", { ascending: false });
        ids = (data || []).map(d => d.post_id);
      }
      if (ids.length === 0) { setTabPosts([]); return; }
      const { data: p } = await supabase.from("posts").select("*").in("id", ids.slice(0, 200));
      setTabPosts(p || []);
    };
    load();
  }, [user, tab]);
  const shown = tab === "posts" ? posts : tabPosts;

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, bio, avatar_url, is_verified, is_official")
        .eq("user_id", user.id)
        .single();
      if (data) setProfile(data);

      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);
      setFollowersCount(followers || 0);

      const { data: fl } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const set = new Set((fl || []).map(r => r.following_id));
      setMyFollowing(set);
      setFollowingCount(set.size);
      const { data: sug } = await supabase.from("profiles").select("user_id, username, display_name, avatar_url").neq("user_id", user.id).limit(20);
      setSuggested((sug || []).filter(s => !set.has(s.user_id)));

      // Fetch user's actual posts
      const { data: userPosts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .neq("media_type", "story")
        .order("created_at", { ascending: false });
      setPosts(userPosts || []);
    };
    fetchData();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("media").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Sign in to view your profile</p>
          <button onClick={() => navigate("/auth")} className="depth-press px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="liquid-glass-elevated safe-area-top">
        <div className="flex items-center gap-3 px-5 py-4 relative z-10">
          <button onClick={() => navigate(-1)} className="depth-press"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <span className="text-headline text-foreground text-base flex-1 flex items-center gap-1">{profile?.username || "Profile"}<VerifiedBadge isVerified={profile?.is_verified} isOfficial={profile?.is_official} /></span>
          <button onClick={() => navigate("/settings")} className="depth-press"><Settings className="w-5 h-5 text-foreground" /></button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-5 mb-4">
          <div className="relative">
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <button onClick={() => avatarRef.current?.click()} className="depth-press relative">
              <div className="w-20 h-20 rounded-full liquid-glass flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary relative z-10">
                    {(profile?.display_name || "U")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Camera className="w-3 h-3 text-primary-foreground" />
              </div>
            </button>
          </div>
          <div className="flex-1 flex justify-around text-center">
            <div><p className="text-lg font-bold text-foreground">{posts.length}</p><p className="text-caption text-muted-foreground">Posts</p></div>
            <button onClick={() => setListMode("followers")} className="depth-press"><p className="text-lg font-bold text-foreground">{followersCount}</p><p className="text-caption text-muted-foreground">Followers</p></button>
            <button onClick={() => setListMode("following")} className="depth-press"><p className="text-lg font-bold text-foreground">{myFollowing.size}</p><p className="text-caption text-muted-foreground">Following</p></button>
          </div>
        </div>
        <p className="text-sm font-semibold text-foreground">{profile?.display_name || "User"}</p>
        <p className="text-sm text-muted-foreground mt-1">{profile?.bio || "No bio yet"}</p>

        <div className="flex gap-2 mt-4">
          <button onClick={() => navigate("/settings")} className="depth-press flex-1 py-2.5 rounded-2xl liquid-glass text-sm font-semibold text-foreground relative z-10">
            Edit Profile
          </button>
          <button onClick={() => { const url = window.location.origin + "/profile"; navigator.share ? navigator.share({ url }).catch(() => {}) : (navigator.clipboard.writeText(url), toast.success("Link copied")); }} className="depth-press flex-1 py-2.5 rounded-2xl liquid-glass text-sm font-semibold text-foreground relative z-10">
            Share Profile
          </button>
        </div>

        {suggested.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-muted-foreground mb-3">Suggested for you</p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {suggested.map(s => (
                <div key={s.user_id} className="flex flex-col items-center gap-1 w-20 shrink-0">
                  <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden flex items-center justify-center font-bold">
                    {s.avatar_url ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" /> : (s.username || "U")[0].toUpperCase()}
                  </div>
                  <p className="text-xs text-foreground truncate w-full text-center">{s.username || s.display_name}</p>
                  <FollowButton targetId={s.user_id} following={myFollowing.has(s.user_id)} onChange={v => {
                    const n = new Set(myFollowing); v ? n.add(s.user_id) : n.delete(s.user_id); setMyFollowing(n);
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {listMode && <FollowListDialog open onOpenChange={o => !o && setListMode(null)} mode={listMode} userId={user.id} myFollowing={myFollowing} setMyFollowing={setMyFollowing} />}

      <div className="flex border-b border-border">
        {[
          { id: "posts" as const, icon: Grid3X3 },
          { id: "saved" as const, icon: Bookmark },
          { id: "liked" as const, icon: Heart },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 flex justify-center relative ${tab === t.id ? "text-foreground" : "text-muted-foreground"}`}
          >
            <t.icon className="w-5 h-5" />
            {tab === t.id && (
              <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-16 h-16 rounded-3xl liquid-glass flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-muted-foreground relative z-10" />
          </div>
          <p className="text-foreground font-semibold mb-1">{tab === "posts" ? "No posts yet" : tab === "saved" ? "No saved posts" : "No liked posts"}</p>
          <p className="text-sm text-muted-foreground mb-4">{tab === "posts" ? "Share your first photo or video" : tab === "saved" ? "Tap the bookmark on any post to save it" : "Posts you like will show here"}</p>
          {tab === "posts" && (
          <button onClick={() => navigate("/create")} className="depth-press px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
            Create Post
          </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {shown.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="aspect-square relative">
              {post.media_type === "video" ? (
                <video src={post.media_url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              )}
            </motion.div>
          ))}
        </div>
      )}
      <GlassTabBar />
    </div>
  );
};

export default ProfilePage;
