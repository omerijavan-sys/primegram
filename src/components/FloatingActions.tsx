import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Layers, Music, Trophy, Gamepad2, Film, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnlineCalls from "./OnlineCalls";
import { useNavigate } from "react-router-dom";
import PrimeMusicHub from "./PrimeMusicHub";

const hubItems = [
  { icon: Music, label: "Music", color: "hsl(350, 80%, 58%)", id: "music" },
  { icon: Trophy, label: "Sports", color: "hsl(210, 100%, 60%)", id: "sports" },
  { icon: Gamepad2, label: "Games", color: "hsl(280, 70%, 55%)", id: "games" },
  { icon: Film, label: "Movies", color: "hsl(40, 90%, 55%)", id: "movies" },
];

const PrimeHubPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [musicOpen, setMusicOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = (id: string) => {
    if (id === "music") setMusicOpen(true);
    else if (id === "sports") { onClose(); navigate("/sports"); }
    else if (id === "games") window.open("https://poki.com", "_blank");
    else if (id === "movies") { onClose(); navigate("/movies"); }
  };

  return (
    <>
      <AnimatePresence>
        {open && !musicOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-28 right-4 z-[60] liquid-glass-elevated rounded-3xl p-5 w-56"
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span className="text-headline text-foreground text-sm">Prime Hub</span>
              </div>
              <button onClick={onClose} className="depth-press w-7 h-7 rounded-full liquid-glass-subtle flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              {hubItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleClick(item.id)}
                  className="depth-press liquid-glass rounded-2xl p-3 flex flex-col items-center gap-2 relative z-10"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}20` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-caption text-foreground">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PrimeMusicHub open={musicOpen} onClose={() => setMusicOpen(false)} />
    </>
  );
};

const FloatingActions = () => {
  const [callsOpen, setCallsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const [PrimeAI, setPrimeAI] = useState<React.ComponentType<any> | null>(null);

  const openAI = async () => {
    if (!PrimeAI) {
      const mod = await import("./PrimeAIChat");
      setPrimeAI(() => mod.default);
    }
    setAiOpen(true);
    setHubOpen(false);
  };

  return (
    <>
      <div className="fixed right-4 bottom-24 z-[55] flex flex-col gap-3">
        <Button variant="outline" size="icon" aria-label="1-on-1 online calls" title="1-on-1 online calls" onClick={() => setCallsOpen(true)} className="depth-press w-12 h-12 rounded-xl liquid-glass-elevated relative">
          <Video className="text-primary" /><span className="absolute -top-1 -right-1 rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs flex items-center justify-center">1</span>
        </Button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => { setHubOpen(!hubOpen); setAiOpen(false); }}
          className="depth-press w-12 h-12 rounded-2xl liquid-glass-elevated flex items-center justify-center"
        >
          <Layers className="w-5 h-5 text-primary relative z-10" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={openAI}
          className="depth-press w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg"
          style={{ boxShadow: "0 4px 20px hsla(210, 100%, 60%, 0.3)" }}
        >
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </motion.button>
      </div>

      <PrimeHubPanel open={hubOpen} onClose={() => setHubOpen(false)} />
      <OnlineCalls open={callsOpen} onClose={() => setCallsOpen(false)} />
      {PrimeAI && <PrimeAI open={aiOpen} onClose={() => setAiOpen(false)} />}
    </>
  );
};

export default FloatingActions;
