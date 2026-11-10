import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Keyboard, Square } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SiriOrb from "./SiriOrb";
import { authHeader } from "@/utils/authFetch";
import { Button } from "@/components/ui/button";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prime-ai-chat`;

type Msg = { role: "user" | "assistant"; content: string };
type Phase = "idle" | "listening" | "thinking" | "speaking";

const COMMANDS: Record<string, string> = {
  home: "/",
  music: "/",
  sports: "/sports",
  movies: "/movies",
  reels: "/reels",
  profile: "/profile",
  messages: "/messages",
  wallet: "/wallet",
  settings: "/settings",
  search: "/search",
  discover: "/discover",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenTextChat?: () => void;
}

/**
 * Siri-style real-time voice assistant.
 * Continuous speech recognition -> streamed AI reply -> spoken response,
 * then automatically resumes listening for a natural back-and-forth.
 */
const SiriAssistant = ({ open, onClose, onOpenTextChat }: Props) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [intensity, setIntensity] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [history, setHistory] = useState<Msg[]>([]);
  const navigate = useNavigate();

  const recognitionRef = useRef<any>(null);
  const wantListeningRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const busyRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>();

  const setPhaseSafe = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  /* ---------------- mic level meter (drives orb reactivity) ---------------- */
  const startMeter = useCallback(async () => {
    if (audioCtxRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setIntensity((prev) => prev * 0.6 + (avg / 180) * 0.4);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      toast.error("Microphone access is needed for voice chat");
    }
  }, []);

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setIntensity(0);
  }, []);

  /* ---------------- speech synthesis (Siri-like voice) ---------------- */
  const pickVoice = () => {
    const voices = window.speechSynthesis?.getVoices?.() ?? [];
    return (
      voices.find((v) => /samantha|siri|ava|serena|zira|female/i.test(v.name) && v.lang.startsWith("en")) ??
      voices.find((v) => v.lang.startsWith("en")) ??
      null
    );
  };

  const speak = useCallback((text: string, onDone: () => void) => {
    if (!("speechSynthesis" in window) || !text.trim()) {
      onDone();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[#*_`~\[\]()]/g, ""));
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = 1.02;
    u.pitch = 1.05;
    u.onstart = () => setPhaseSafe("speaking");
    u.onend = onDone;
    u.onerror = onDone;
    window.speechSynthesis.speak(u);
  }, []);

  /* ---------------- recognition control ---------------- */
  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  const askAI = useCallback(
    async (text: string) => {
      busyRef.current = true;
      stopRecognition();
      setPhaseSafe("thinking");
      setReply("");

      // Local navigation intents answered instantly
      const lower = text.toLowerCase();
      for (const [word, path] of Object.entries(COMMANDS)) {
        if (lower.match(new RegExp(`(open|go to|show|take me to|navigate to)\\s+(the\\s+)?${word}`))) {
          const line = `Opening ${word}.`;
          setReply(line);
          navigate(path);
          speak(line, () => {
            busyRef.current = false;
            if (wantListeningRef.current) startRecognition();
            else setPhaseSafe("idle");
          });
          return;
        }
      }

      const userMsg: Msg = { role: "user", content: text };
      const convo = [...history, userMsg].slice(-16);
      let full = "";
      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: await authHeader() },
          body: JSON.stringify({ messages: convo, mode: "voice" }),
        });
        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}));
          throw new Error(e.error || `Error ${resp.status}`);
        }
        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const delta = JSON.parse(json).choices?.[0]?.delta?.content;
              if (delta) {
                full += delta;
                setReply(full);
              }
            } catch {}
          }
        }
      } catch (e: any) {
        full = e?.message || "Sorry, I couldn't reach my brain just now.";
        setReply(full);
      }

      setHistory([...convo, { role: "assistant" as const, content: full }].slice(-16));
      speak(full, () => {
        busyRef.current = false;
        if (wantListeningRef.current) startRecognition();
        else setPhaseSafe("idle");
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history, navigate, speak, stopRecognition],
  );

  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Live voice isn't supported in this browser — use the keyboard instead");
      return;
    }
    if (busyRef.current) return;
    try {
      recognitionRef.current?.abort();
    } catch {}

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript((final || interim).trim());
      if (final.trim() && !busyRef.current) askAI(final.trim());
    };
    rec.onerror = (e: any) => {
      const err = e?.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        wantListeningRef.current = false;
        setPhaseSafe("idle");
        toast.error("Microphone is blocked — allow it in your browser, or open the app in its own tab");
      } else if (err === "audio-capture") {
        toast.error("No microphone found");
      } else if (err === "network") {
        toast.error("Voice recognition needs an internet connection");
      }
    };
    rec.onend = () => {
      // Auto-restart for a truly continuous conversation
      if (wantListeningRef.current && !busyRef.current) {
        setTimeout(() => {
          if (wantListeningRef.current && !busyRef.current) {
            try {
              recognitionRef.current?.start();
            } catch {}
          }
        }, 250);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setPhaseSafe("listening");
    } catch (err) {
      console.warn("Speech recognition failed to start", err);
    }
  }, [askAI]);

  const beginSession = useCallback(() => {
    wantListeningRef.current = true;
    // Start recognition synchronously inside the tap so the browser keeps the user gesture
    startRecognition();
    // Level meter is cosmetic; start it after recognition has claimed the mic
    setTimeout(() => { startMeter(); }, 600);
  }, [startMeter, startRecognition]);

  const endSession = useCallback(() => {
    wantListeningRef.current = false;
    busyRef.current = false;
    try {
      recognitionRef.current?.abort();
    } catch {}
    window.speechSynthesis?.cancel();
    stopMeter();
    setPhaseSafe("idle");
  }, [stopMeter]);

  // Auto-start the live session when opened
  useEffect(() => {
    if (open) {
      setTranscript("");
      setReply("");
      beginSession();
    } else {
      endSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => endSession(), [endSession]);

  // Prime the voice list (Chrome loads voices async)
  useEffect(() => {
    window.speechSynthesis?.getVoices?.();
  }, []);

  const label =
    phase === "listening"
      ? "Listening…"
      : phase === "thinking"
        ? "Thinking…"
        : phase === "speaking"
          ? "Speaking…"
          : "Tap the orb to talk";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-label="Heiji assistant"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto py-6"
        >
          {/* Dim + glass backdrop */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" />

          <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center gap-5">
            <div className="w-full flex items-center justify-between border-b border-border pb-3"><h2 className="text-xl font-semibold text-foreground">Heiji</h2><span className="text-xs text-muted-foreground">{label}</span></div>
            {/* Orb */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <SiriOrb
                size={190}
                intensity={phase === "speaking" ? 0.55 : intensity}
                listening={phase === "listening"}
                speaking={phase === "speaking" || phase === "thinking"}
                onClick={() => (wantListeningRef.current ? endSession() : beginSession())}
              />
            </motion.div>

            <div className="text-center w-full min-h-[92px] max-h-[30dvh] overflow-y-auto break-words">
              <p className="text-caption text-muted-foreground mb-1">{label}</p>
              {transcript && <p className="text-sm text-foreground/80 italic mb-2">“{transcript}”</p>}
              {reply && <p className="text-base text-foreground leading-relaxed">{reply}</p>}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon"
                onClick={() => (wantListeningRef.current ? endSession() : beginSession())}
                className={`depth-press w-14 h-14 rounded-full flex items-center justify-center ${
                  wantListeningRef.current ? "bg-primary" : "liquid-glass-subtle"
                }`}
                aria-label={wantListeningRef.current ? "Mute microphone" : "Start listening"}
              >
                {wantListeningRef.current ? (
                  <MicOff className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <Mic className="w-5 h-5 text-foreground" />
                )}
              </Button>

              <Button variant="ghost" size="icon"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  busyRef.current = false;
                  if (wantListeningRef.current) startRecognition();
                  else setPhaseSafe("idle");
                }}
                className="depth-press w-14 h-14 rounded-full liquid-glass-subtle flex items-center justify-center"
                aria-label="Stop speaking"
              >
                <Square className="w-5 h-5 text-foreground" />
              </Button>

              <Button variant="ghost" size="icon"
                onClick={() => {
                  endSession();
                  onClose();
                  onOpenTextChat?.();
                }}
                className="depth-press w-14 h-14 rounded-full liquid-glass-subtle flex items-center justify-center"
                aria-label="Switch to typing"
              >
                <Keyboard className="w-5 h-5 text-foreground" />
              </Button>

              <Button variant="ghost" size="icon"
                onClick={() => {
                  endSession();
                  onClose();
                }}
                className="depth-press w-14 h-14 rounded-full liquid-glass-subtle flex items-center justify-center"
                aria-label="Close assistant"
              >
                <X className="w-5 h-5 text-foreground" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SiriAssistant;
