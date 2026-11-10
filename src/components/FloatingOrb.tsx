import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SiriOrb from "./SiriOrb";
import PrimeAIChat from "./PrimeAIChat";
import SiriAssistant from "./SiriAssistant";

const FloatingOrb = () => {
  const [aiOpen, setAiOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const orbRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Global 'P' key listener and click handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        setVoiceOpen((v) => !v);
      }
    };
    
    const handleOpenEvent = () => {
      setVoiceOpen(true);
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('prime:openOrb', handleOpenEvent as EventListener);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('prime:openOrb', handleOpenEvent as EventListener);
    };
  }, [aiOpen]);
  
  // Voice activity detection
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const tick = () => {
        analyserRef.current!.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVoiceIntensity(average / 255);
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      
      tick();
      setIsListening(true);
    } catch (error) {
      console.error('Audio analysis error:', error);
    }
  };
  
  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setVoiceIntensity(0);
  };
  
  // Enhanced orb click handler
  const handleOrbClick = () => {
    setIntensity(1);
    setTimeout(() => setIntensity(0), 500);
    setVoiceOpen(true);
  };

  return (
    <>
      {/* Floating Orb Assistant */}
      <motion.div
        className="fixed bottom-24 left-4 z-[55]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.button
          onClick={handleOrbClick}
          className="relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Siri-style translucent orb */}
          <SiriOrb size={68} intensity={voiceIntensity || intensity} listening={isListening} />
          
          
          {/* Sparkles on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 liquid-glass-elevated rounded-full px-3 py-1.5 text-xs font-medium text-foreground whitespace-nowrap z-10"
              >
                Tap or press 'P' — talk to Siri
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        
        {/* Hidden voice trigger for AI chat */}
        <button
          data-voice-trigger
          className="hidden"
          aria-label="Trigger voice input"
        />
        
        {/* AI Chat */}
        <SiriAssistant
          open={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          onOpenTextChat={() => setAiOpen(true)}
        />

        <PrimeAIChat 
          open={aiOpen} 
          onClose={() => setAiOpen(false)} 
          onOpen={() => setAiOpen(true)}
        />
      </motion.div>
    </>
  );
};

export default FloatingOrb;
