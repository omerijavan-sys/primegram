import { useEffect, useState } from "react";
import { Phone, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useOnline } from "@/contexts/OnlineContext";
import { supabase } from "@/integrations/supabase/client";
import { beginCall } from "@/utils/calls";

type Member = { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null };

export default function OnlineCalls({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { ids, connected } = useOnline();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [calling, setCalling] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    const others = ids.filter(id => id !== user?.id);
    if (!open || !others.length) { setMembers([]); setLoading(false); return; }
    setLoading(true);
    supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", others)
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) toast.error("Could not load online members.");
        setMembers(data || []);
      });
    return () => { cancelled = true; };
  }, [ids, open, user?.id]);
  const call = async (id: string, audio = false) => {
    if (!user) { toast.error("Sign in to call a member."); return; }
    setCalling(id);
    try { navigate(await beginCall(user.id, id, audio)); onClose(); }
    catch { toast.error("Could not start the call. Please try again."); }
    finally { setCalling(null); }
  };
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogContent className="max-w-md max-h-[80dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>1-on-1 calls</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">{connected ? `${members.length} online now` : "Connecting…"}</p>
      {loading ? <p className="text-muted-foreground py-8 text-center">Loading…</p> : members.length === 0 ?
        <p className="text-muted-foreground py-8 text-center">{user ? "No other members online right now." : "Sign in to see online members."}</p> :
        members.map(member => <div key={member.user_id} className="flex items-center gap-3 py-3 border-b border-border">
          <div className="relative w-10 h-10 shrink-0 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" /> : (member.display_name || member.username || "U")[0]}
          </div>
          <div className="flex-1 min-w-0"><p className="font-medium truncate">{member.display_name || member.username}</p><p className="text-xs text-muted-foreground">Online</p></div>
          <Button variant="ghost" size="icon" aria-label={`Audio call ${member.username}`} title="Audio call" disabled={!!calling} onClick={() => call(member.user_id, true)}><Phone /></Button>
          <Button size="icon" aria-label={`Video call ${member.username}`} title="Video call" disabled={!!calling} onClick={() => call(member.user_id)}><Video /></Button>
        </div>)}
    </DialogContent>
  </Dialog>;
}