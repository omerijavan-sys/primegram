import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import GlassTabBar from "@/components/GlassTabBar";
import TopNavBar from "@/components/TopNavBar";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase.from("follows").select("following_id").eq("follower_id", user.id).then(({ data }) => {
      if (data) setFollowing(new Set(data.map(f => f.following_id)));
    });
    // Show suggested people right away, before any search.
    supabase.from("profiles").select("*").neq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setResults(data || []));
  }, [user]);

  const [mode, setMode] = useState<"people" | "posts">("people");
  const [postResults, setPostResults] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("posts").select("*").neq("media_type", "story").order("created_at", { ascending: false }).limit(60)
      .then(({ data }) => setPostResults(data || []));
  }, []);

  const search = async () => {
    const q = query.trim().replace(/[%,()]/g, "");
    if (!q) return;
    const [{ data }, { data: posts }] = await Promise.all([
      supabase.from("profiles").select("*").or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(20),
      supabase.from("posts").select("*").neq("media_type", "story").ilike("caption", `%${q}%`).order("created_at", { ascending: false }).limit(60),
    ]);
    setResults(data || []);
    setPostResults(posts || []);
  };

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    if (following.has(targetId)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setFollowing(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      setFollowing(prev => new Set(prev).add(targetId));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />
      <main className="pt-16 pb-24 px-4">
        <div className="liquid-glass rounded-2xl flex items-center gap-3 px-4 py-3 mb-4 relative z-10">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search users..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex gap-2 mb-4">
          {(["people", "posts"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize ${mode === m ? "bg-primary text-primary-foreground" : "liquid-glass-subtle text-foreground"}`}>{m}</button>
          ))}
        </div>

        {mode === "posts" && (
          postResults.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">No posts found</p>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {postResults.map(p => (
                <div key={p.id} className="aspect-square relative bg-muted overflow-hidden" title={p.caption || ""}>
                  {p.media_url ? (p.media_type === "video" ? <video src={p.media_url} className="w-full h-full object-cover" muted preload="metadata" /> : <img src={p.media_url} alt={p.caption || ""} className="w-full h-full object-cover" loading="lazy" />)
                    : <div className="w-full h-full p-2 text-xs text-foreground flex items-center">{p.caption}</div>}
                </div>
              ))}
            </div>
          )
        )}

        {mode === "people" && results.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Search for people to follow</p>
          </div>
        )}

        <div className="space-y-2">
          {mode === "people" && results.filter(r => r.user_id !== user?.id).map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="liquid-glass rounded-2xl p-4 flex items-center gap-3 relative z-10"
            >
              <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                {(profile.display_name || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{profile.display_name || "User"}</p>
                <p className="text-caption text-muted-foreground">@{profile.username || "user"}</p>
              </div>
              <button
                onClick={() => toggleFollow(profile.user_id)}
                className={`depth-press px-4 py-2 rounded-xl text-xs font-semibold ${following.has(profile.user_id) ? "liquid-glass-subtle text-foreground" : "bg-primary text-primary-foreground"}`}
              >
                {following.has(profile.user_id) ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </button>
            </motion.div>
          ))}
        </div>
      </main>
      <GlassTabBar />
    </div>
  );
};

export default SearchPage;
