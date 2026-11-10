import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Loader2, Play, ShieldAlert, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface AdultPost {
  id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
  views_count: number;
  user_id: string;
  creator?: string | null;
}

const AdultTab = () => {
  const { user } = useAuth();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [dob, setDob] = useState({ d: "", m: "", y: "" });
  const [consent, setConsent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [posts, setPosts] = useState<AdultPost[]>([]);
  const [open, setOpen] = useState<AdultPost | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: ups }] = await Promise.all([
        supabase.from("profiles").select("adult_verified_at").eq("user_id", user.id).maybeSingle(),
        supabase.from("posts").select("*").eq("is_adult", true).order("created_at", { ascending: false }).limit(60),
      ]);
      setVerified(!!prof?.adult_verified_at);
      setPosts(ups ?? []);
    })();
  }, [user, verified]);

  const verify = async () => {
    const { d, m, y } = dob;
    if (!d || !m || !y || Number(y) < 1900) {
      toast.error("Enter your full date of birth");
      return;
    }
    if (!consent) {
      toast.error("Confirm you're 18+ to continue");
      return;
    }
    setChecking(true);
    const { data, error } = await supabase.rpc("verify_adult", {
      _dob: `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
    });
    setChecking(false);
    if (error) return toast.error(error.message);
    if (!data) return toast.error("That date of birth shows you're under 18");
    toast.success("Verified — welcome");
    setVerified(true);
  };

  if (verified === null) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking access…
      </div>
    );
  }

  if (!verified) {
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const years = Array.from({ length: 70 }, (_, i) => String(new Date().getFullYear() - 12 - i));
    const selectCls = "flex-1 rounded-xl bg-secondary/60 border border-input px-2 py-2.5 text-sm text-foreground";
    return (
      <div className="rounded-2xl border border-primary/30 bg-card/70 backdrop-blur-xl p-5 shadow-[0_0_30px_-12px_hsl(var(--primary)/0.6)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold">18+ Only · Age Verification</p>
            <p className="text-xs text-muted-foreground">Mature content. Verify your age to enter.</p>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <select className={selectCls} value={dob.d} onChange={(e) => setDob({ ...dob, d: e.target.value })} aria-label="Day">
            <option value="">Day</option>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className={selectCls} value={dob.m} onChange={(e) => setDob({ ...dob, m: e.target.value })} aria-label="Month">
            <option value="">Month</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className={selectCls} value={dob.y} onChange={(e) => setDob({ ...dob, y: e.target.value })} aria-label="Year">
            <option value="">Year</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <label className="flex items-start gap-2 text-xs text-muted-foreground mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-primary"
          />
          I confirm I am 18 years or older and I want to see mature content. My confirmation is stored securely on the server.
        </label>
        <Button className="w-full gap-2" onClick={verify} disabled={checking}>
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Verify & Enter
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <Check className="w-3.5 h-3.5 text-primary" /> Verified 18+ · access stays active on your account
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No 18+ posts yet. Creators can mark a post as 18+ from the post composer.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {posts.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              onClick={() => setOpen(p)}
              className="relative aspect-square rounded-2xl overflow-hidden bg-secondary liquid-glass"
            >
              {p.media_url ? (
                p.media_type === "video" ? (
                  <>
                    <video src={p.media_url} className="w-full h-full object-cover" muted preload="metadata" />
                    <Play className="absolute top-2 right-2 w-4 h-4 text-foreground" />
                  </>
                ) : (
                  <img src={p.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                )
              ) : (
                <span className="p-2 block text-xs text-foreground">{p.caption}</span>
              )}
              <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] text-foreground backdrop-blur-sm">
                <Eye className="w-2.5 h-2.5" /> {(p.views_count || 0).toLocaleString()}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-none w-screen h-dvh p-0 border-0 rounded-none bg-background flex flex-col [&>button]:hidden">
          <DialogTitle className="sr-only">18+ post</DialogTitle>
          <div className="flex items-center justify-between p-4">
            <span className="text-xs font-semibold text-muted-foreground">18+ · Mature content</span>
            <button
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="depth-press w-9 h-9 rounded-full liquid-glass flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center px-2">
            {open?.media_type === "video" ? (
              <video src={open?.media_url || ""} controls autoPlay playsInline className="max-w-full max-h-full object-contain" />
            ) : (
              <img src={open?.media_url || ""} alt="" className="max-w-full max-h-full object-contain" />
            )}
          </div>
          {open?.caption && (
            <p className="p-4 text-sm text-foreground/90 text-center">{open.caption}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdultTab;
