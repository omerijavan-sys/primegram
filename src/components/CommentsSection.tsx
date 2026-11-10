import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string | null;
}

const CommentsSection = ({ postId, onCountChange }: { postId: string; onCountChange?: (n: number) => void }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("post_comments")
      .select("id, user_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) { setLoading(false); return; }
    const ids = [...new Set((data ?? []).map((c) => c.user_id))];
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("user_id, username, display_name").in("user_id", ids)
      : { data: [] as any[] };
    const map = new Map((profs ?? []).map((p: any) => [p.user_id, p.username || p.display_name]));
    const list = (data ?? []).map((c) => ({ ...c, username: map.get(c.user_id) }));
    setComments(list);
    onCountChange?.(list.length);
    setLoading(false);
  };

  useEffect(() => { load(); }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!user) return toast.error("Sign in to comment");
    if (!content) return;
    if (content.length > 1000) return toast.error("Comment is too long");
    setSending(true);
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, content });
    setSending(false);
    if (error) return toast.error("Couldn't post comment");
    setText("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("post_comments").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete comment");
    load();
  };

  return (
    <div className="mt-3 space-y-3">
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet. Be the first.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <p className="flex-1 text-foreground/90">
                <span className="font-semibold">{c.username || "user"}</span> {c.content}
                <span className="block text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </p>
              {user?.id === c.user_id && (
                <button onClick={() => remove(c.id)} aria-label="Delete comment" className="depth-press">
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-full bg-muted px-4 py-2 text-sm text-foreground outline-none"
        />
        <button disabled={sending} aria-label="Post comment" className="depth-press text-primary">
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default CommentsSection;
