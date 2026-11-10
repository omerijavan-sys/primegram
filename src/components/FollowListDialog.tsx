import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import VerifiedBadge from "@/components/VerifiedBadge";

type Person = { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null; is_verified: boolean; is_official: boolean };

export const FollowButton = ({ targetId, following, onChange }: { targetId: string; following: boolean; onChange: (v: boolean) => void }) => {
  const { user } = useAuth();
  const toggle = async () => {
    if (!user) return;
    if (following) await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
    else await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
    onChange(!following);
  };
  return (
    <Button size="sm" variant={following ? "secondary" : "default"} onClick={toggle} className="h-7 px-3 text-xs">
      {following ? "Following" : "Follow"}
    </Button>
  );
};

export const PersonRow = ({ p, following, onToggle }: { p: Person; following: boolean; onToggle: (v: boolean) => void }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-sm font-bold">
      {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.username || "U")[0].toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">{p.username || "user"}<VerifiedBadge isVerified={p.is_verified} isOfficial={p.is_official} /></p>
      <p className="text-xs text-muted-foreground truncate">{p.display_name}</p>
    </div>
    <FollowButton targetId={p.user_id} following={following} onChange={onToggle} />
  </div>
);

const FollowListDialog = ({ open, onOpenChange, mode, userId, myFollowing, setMyFollowing }: {
  open: boolean; onOpenChange: (v: boolean) => void; mode: "followers" | "following"; userId: string;
  myFollowing: Set<string>; setMyFollowing: (s: Set<string>) => void;
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  useEffect(() => {
    if (!open) return;
    (async () => {
      const col = mode === "followers" ? "following_id" : "follower_id";
      const other = mode === "followers" ? "follower_id" : "following_id";
      const { data } = await supabase.from("follows").select(other).eq(col, userId);
      const ids = (data || []).map((r: any) => r[other]);
      if (!ids.length) return setPeople([]);
      const { data: ps } = await supabase.from("profiles").select("user_id, username, display_name, avatar_url, is_verified, is_official").in("user_id", ids);
      setPeople((ps as Person[]) || []);
    })();
  }, [open, mode, userId]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="capitalize">{mode}</DialogTitle></DialogHeader>
        {people.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No one here yet</p> :
          people.map(p => (
            <PersonRow key={p.user_id} p={p} following={myFollowing.has(p.user_id)} onToggle={v => {
              const n = new Set(myFollowing); v ? n.add(p.user_id) : n.delete(p.user_id); setMyFollowing(n);
            }} />
          ))}
      </DialogContent>
    </Dialog>
  );
};

export default FollowListDialog;
