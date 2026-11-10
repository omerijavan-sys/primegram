import { authHeader } from "@/utils/authFetch";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const PrimeOrb = lazy(() => import("./PrimeOrb"));

const FloatingOrb = lazy(() => import("./FloatingOrb"));

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prime-ai-chat`;

type Msg = { role: "user" | "assistant"; content: string };

const COMMAND_REGISTRY: Record<string, string> = {
  music: "/",
  sports: "/sports",
  movies: "/movies",
  reels: "/reels",
  profile: "/profile",
  messages: "/messages",
  wallet: "/wallet",
  settings: "/settings",
  search: "/search",
  create: "/create",
  home: "/",
};

const PrimeAIChat = ({ open, onClose, onOpen }: { open: boolean; onClose: () => void; onOpen?: () => void }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>();
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Global 'P' key listener to trigger Heiji
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        if (!open) {
          // Chat is closed, open it first
          onOpen?.();
          setTimeout(() => toggleVoiceInput(), 500);
        } else {
          // Chat is open, trigger voice input directly
          toggleVoiceInput();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, listening]);

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVoiceIntensity(avg / 255);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  };

  const stopAudioAnalysis = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setVoiceIntensity(0);
  };

  const checkForCommands = (text: string) => {
    const lower = text.toLowerCase();
    for (const [keyword, path] of Object.entries(COMMAND_REGISTRY)) {
      if (lower.includes(`navigate to ${keyword}`) || lower.includes(`opening ${keyword}`) || lower.includes(`going to ${keyword}`)) {
        setTimeout(() => { onClose(); navigate(path); }, 1500);
        return true;
      }
    }
    return false;
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const plain = text.replace(/[#*_`~\[\]()]/g, "");
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 1;
    utterance.pitch = 1.1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceInput = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported"); return; }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      stopAudioAnalysis();
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      stopAudioAnalysis();
      // Auto-send voice commands
      setTimeout(() => {
        const lower = transcript.toLowerCase();
        // Check for "Heiji" prefix commands
        if (lower.includes("heiji")) {
          for (const [keyword, path] of Object.entries(COMMAND_REGISTRY)) {
            if (lower.includes(keyword)) {
              onClose();
              navigate(path);
              toast.success(`Opening ${keyword}...`);
              return;
            }
          }
        }
      }, 300);
    };
    recognition.onerror = () => { setListening(false); stopAudioAnalysis(); };
    recognition.onend = () => { setListening(false); stopAudioAnalysis(); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    startAudioAnalysis();
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const lower = input.toLowerCase();
    
    // Check for Heiji commands
    const isHeiji = lower.includes("heiji");
    for (const [keyword, path] of Object.entries(COMMAND_REGISTRY)) {
      if ((isHeiji && lower.includes(keyword)) || lower.includes(`open ${keyword}`) || lower.includes(`go to ${keyword}`) || lower === keyword) {
        onClose();
        navigate(path);
        toast.success(`Opening ${keyword}...`);
        setInput("");
        return;
      }
    }
    if (isHeiji && lower.includes("play music")) {
      onClose();
      toast.success("Opening Music Hub...");
      setInput("");
      return;
    }

    const userMsg: Msg = { role: "user", content: input.trim() };
    setInput("");
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || `Error ${resp.status}`); }
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              const final = assistantSoFar;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: final } : m));
                return [...prev, { role: "assistant", content: final }];
              });
            }
          } catch {}
        }
      }
      if (assistantSoFar) {
        speak(assistantSoFar);
        checkForCommands(assistantSoFar);
      }
    } catch (e: any) { toast.error(e.message || "AI error"); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed inset-4 bottom-24 z-[60] liquid-glass-elevated rounded-3xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 relative z-10">
            <div className="flex items-center gap-3">
              <Suspense fallback={<Sparkles className="w-8 h-8 text-primary animate-pulse" />}>
                <PrimeOrb intensity={listening ? voiceIntensity : speaking ? 0.3 : 0} />
              </Suspense>
              <div>
                <span className="text-headline text-foreground text-sm">Heiji AI</span>
                <p className="text-caption text-muted-foreground">Press 'P' for voice</p>
                {speaking && <p className="text-xs text-primary animate-pulse">Speaking...</p>}
                {listening && <p className="text-xs text-green-400 animate-pulse">Listening...</p>}
              </div>
            </div>
            <button onClick={() => { window.speechSynthesis.cancel(); onClose(); }} className="depth-press w-8 h-8 rounded-full liquid-glass-subtle flex items-center justify-center">
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3 relative z-10">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm mt-6">
                <p className="text-base font-medium text-foreground mb-2">Hey! I'm Heiji 🤖</p>
                <p className="text-xs mb-1">Your AI assistant. Try voice commands:</p>
                <p className="text-xs text-primary mb-3">"Heiji, play music" • "Heiji, open Sports"</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Heiji, open Sports", "Heiji, play music", "Go to Profile"].map(cmd => (
                    <button key={cmd} onClick={() => setInput(cmd)} className="depth-press px-3 py-1.5 rounded-xl liquid-glass-subtle text-xs text-foreground relative z-10">
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "liquid-glass-subtle text-foreground relative z-10"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="liquid-glass-subtle rounded-2xl px-4 py-2.5 text-sm text-muted-foreground relative z-10">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 relative z-10">
            <div className="flex gap-2">
              <button onClick={toggleVoiceInput} className={`depth-press w-11 h-11 rounded-2xl flex items-center justify-center ${listening ? "bg-green-500" : "liquid-glass-subtle"}`}>
                {listening ? <MicOff className="w-4 h-4 text-primary-foreground" /> : <Mic className="w-4 h-4 text-foreground" />}
              </button>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={listening ? "Listening..." : "Ask Heiji anything..."} className="flex-1 px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={send} disabled={loading || !input.trim()} className="depth-press w-11 h-11 rounded-2xl bg-primary flex items-center justify-center disabled:opacity-40">
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrimeAIChat;
