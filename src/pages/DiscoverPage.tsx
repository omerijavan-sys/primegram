import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, UserPlus, UserCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import LiquidBackground from "@/components/LiquidBackground";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
    loadFollowing();
  }, [user]);

  const loadProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("user_id", user?.id || "")
      .limit(50);
    setProfiles(data || []);
    setLoading(false);
  };

  const loadFollowing = async () => {
    if (!user) return;
    const { data } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
    setFollowing(new Set((data || []).map((f) => f.following_id)));
  };

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    const isFollowing = following.has(targetId);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setFollowing((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      toast.success("Unfollowed");
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      if (error) {
        toast.error(error.message);
        return;
      }
      setFollowing((prev) => new Set(prev).add(targetId));
      toast.success("Following");
    }
  };

  const filtered = profiles.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (p.display_name || "").toLowerCase().includes(q) ||
      (p.username || "").toLowerCase().includes(q) ||
      (p.bio || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background relative">
      <LiquidBackground />

      <div className="liquid-glass-elevated safe-area-top relative z-10">
        <div className="flex items-center gap-3 px-5 py-4 relative z-10">
          <button onClick={() => navigate(-1)} className="depth-press">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Users className="w-5 h-5 text-primary" />
          <span className="text-headline text-foreground text-base">Discover People</span>
        </div>

        <div className="px-5 pb-4 relative z-10">
          <div className="liquid-glass rounded-2xl flex items-center gap-2 px-4 py-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends, family, anyone..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2 relative z-10">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="liquid-glass rounded-2xl p-4 flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-muted rounded" />
                <div className="h-2 w-20 bg-muted rounded" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No one matches "{query}"</div>
        ) : (
          filtered.map((p, i) => {
            const isFollowing = following.has(p.user_id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="liquid-glass rounded-2xl p-4 flex items-center gap-3 relative z-10"
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.username || ""} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                    {(p.display_name || p.username || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {p.display_name || p.username || "User"}
                  </p>
                  {p.username && <p className="text-caption text-muted-foreground truncate">@{p.username}</p>}
                  {p.bio && <p className="text-caption text-muted-foreground truncate mt-0.5">{p.bio}</p>}
                </div>
                <button
                  onClick={() => toggleFollow(p.user_id)}
                  className={`depth-press px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    isFollowing
                      ? "liquid-glass-subtle text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Follow
                    </>
                  )}
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
