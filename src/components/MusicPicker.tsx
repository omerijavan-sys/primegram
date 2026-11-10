import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Disc3, Globe, Loader2, Music, Search, TrendingUp, X } from "lucide-react";
import { tracks } from "./PrimeMusicHub";
import { Input } from "@/components/ui/input";

export interface PickedTrack {
  title: string;
  artist: string;
  artUrl?: string | null;
  streamUrl?: string | null;
  youtubeId?: string | null;
}

let audiusHost: string | null = null;
async function getAudiusHost(): Promise<string | null> {
  if (audiusHost) return audiusHost;
  try {
    const res = await fetch("https://api.audius.co");
    const j = await res.json();
    const hosts: string[] = j?.data ?? [];
    if (!hosts.length) return null;
    audiusHost = hosts[Math.floor(Math.random() * hosts.length)];
    return audiusHost;
  } catch {
    return null;
  }
}

interface AudiusTrack {
  id: string;
  title: string;
  duration?: number;
  artwork?: Record<string, string>;
  user?: { name?: string };
}

const fmt = (s?: number) =>
  s ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "";

const MusicPicker = ({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (t: PickedTrack) => void;
}) => {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<"global" | "chart">("global");
  const [results, setResults] = useState<PickedTrack[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (source === "chart") {
      setResults(
        tracks.slice(0, 40).map((t) => ({
          title: t.title,
          artist: t.artist,
          youtubeId: t.youtubeId,
        }))
      );
      setLoading(false);
      return;
    }
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const host = await getAudiusHost();
      if (!host) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${host}/v1/tracks/search?query=${encodeURIComponent(term)}&app_name=Primegram`
        );
        const j = await res.json();
        setResults(
          (j.data ?? []).slice(0, 25).map((tr: AudiusTrack) => ({
            title: tr.title,
            artist: tr.user?.name ?? "Unknown",
            artUrl: tr.artwork?.["480x480"] ?? tr.artwork?.["150x150"] ?? null,
            streamUrl: `${host}/v1/tracks/${tr.id}/stream?app_name=Primegram`,
          }))
        );
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q, source, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-xl flex items-end sm:items-center sm:justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="w-full sm:max-w-md h-[80vh] liquid-glass-elevated rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-headline text-foreground font-semibold">Background Track</p>
                <p className="text-caption text-muted-foreground">Search songs from all over the world</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="depth-press w-8 h-8 rounded-full liquid-glass-subtle flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="px-4 pb-3 flex gap-2 relative z-10">
              <button
                onClick={() => setSource("global")}
                className={`depth-press flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  source === "global" ? "bg-primary text-primary-foreground" : "liquid-glass-subtle text-foreground"
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Global
              </button>
              <button
                onClick={() => setSource("chart")}
                className={`depth-press flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  source === "chart" ? "bg-primary text-primary-foreground" : "liquid-glass-subtle text-foreground"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Primegram Chart
              </button>
            </div>

            {source === "global" && (
              <div className="px-4 pb-2 relative z-10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search any song, artist or genre…"
                    className="pl-9 rounded-2xl bg-secondary/60 border-0"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1.5 relative z-10">
              {loading && (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching the world's music…
                </div>
              )}
              {!loading && source === "global" && q.trim().length < 2 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Disc3 className="w-10 h-10 text-primary/60 mb-2" />
                  <p className="text-sm">Type a song name to search millions of tracks worldwide.</p>
                </div>
              )}
              {!loading &&
                results.map((t, i) => (
                  <motion.button
                    key={`${t.title}-${t.artist}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => {
                      onPick(t);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-secondary/60 text-left"
                  >
                    {t.artUrl ? (
                      <img src={t.artUrl} alt="" className="w-11 h-11 rounded-xl object-cover bg-secondary" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Music className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                      <p className="text-caption text-muted-foreground truncate">{t.artist}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">Add</span>
                  </motion.button>
                ))}
              {!loading && results.length === 0 && (source === "chart" || q.trim().length >= 2) && (
                <p className="text-center text-sm text-muted-foreground py-10">No tracks found. Try another search.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MusicPicker;
