import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Music2, Pause, Play } from "lucide-react";

export interface PostMusic {
  title: string;
  artist?: string | null;
  art_url?: string | null;
  stream_url?: string | null;
  youtube_id?: string | null;
}

// One shared audio element app-wide so only one track plays at a time.
let sharedAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

const BAR_HEIGHTS = [10, 18, 26, 14, 22, 30, 16, 24, 12, 20, 28, 15, 22, 11, 19, 27];

const PostMusicPlayer = ({ music }: { music: PostMusic }) => {
  const [playing, setPlaying] = useState(false);
  const ytRef = useRef<HTMLIFrameElement>(null);

  const ytId = music.youtube_id || null;

  // Mark the hidden YouTube iframe ready so play commands are accepted.
  useEffect(() => {
    if (!ytId) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== "https://www.youtube.com") return;
      try {
        const d = JSON.parse(e.data);
        if (d?.event === "onReady" || d?.event === "infoDelivery") {
          ytRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: playing ? "playVideo" : "pauseVideo", args: [] }),
            "https://www.youtube.com"
          );
        }
      } catch {
        /* non-JSON frame message */
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytId]);

  const toggle = () => {
    if (music.stream_url) {
      if (sharedAudio && currentUrl !== music.stream_url) {
        sharedAudio.pause();
        sharedAudio = null;
      }
      if (!sharedAudio) {
        sharedAudio = new Audio(music.stream_url);
        currentUrl = music.stream_url;
        sharedAudio.addEventListener("ended", () => setPlaying(false));
      }
      if (playing) {
        sharedAudio.pause();
        setPlaying(false);
      } else {
        sharedAudio
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      }
    } else if (ytId) {
      const win = ytRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(
        JSON.stringify({ event: "command", func: playing ? "pauseVideo" : "playVideo", args: [] }),
        "https://www.youtube.com"
      );
      setPlaying(!playing);
    }
  };

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-primary/30 bg-card/70 backdrop-blur-xl px-3 py-2.5 flex items-center gap-3 relative z-10">
      {ytId && (
        <iframe
          ref={ytRef}
          src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&origin=${window.location.origin}`}
          title={music.title}
          className="absolute w-px h-px opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
      <button
        onClick={toggle}
        aria-label={playing ? "Pause track" : "Play track"}
        className="depth-press w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0"
      >
        {playing ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground" />}
      </button>
      {music.art_url ? (
        <img src={music.art_url} alt="" className="w-10 h-10 rounded-xl object-cover bg-secondary shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Music2 className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{music.title}</p>
        <p className="text-caption text-muted-foreground truncate">{music.artist || "Primegram"}</p>
      </div>
      <div className="flex items-end gap-[3px] h-8 shrink-0" aria-hidden="true">
        {BAR_HEIGHTS.map((h, i) => (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-primary/80 origin-bottom"
            style={{ height: h }}
            animate={playing ? { scaleY: [0.35, 1, 0.55, 0.9, 0.4] } : { scaleY: 0.4 }}
            transition={
              playing
                ? { duration: 1.1, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }
                : { duration: 0.2 }
            }
          />
        ))}
      </div>
    </div>
  );
};

export default PostMusicPlayer;
