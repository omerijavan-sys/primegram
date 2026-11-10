import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Maximize2 } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  artist: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}

const YouTubePlayer = ({ videoId, title, artist, isPlaying, onPlay, onPause }: YouTubePlayerProps) => {
  const playerRef = useRef<HTMLIFrameElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!playerRef.current || !isPlaying) return;

    // Send play command to hidden iframe
    const message = {
      event: 'command',
      func: 'playVideo',
      args: [videoId]
    };

    // For YouTube iframe communication
    playerRef.current?.contentWindow?.postMessage(message, '*');
  }, [videoId, isPlaying]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`relative transition-all duration-300 ${isExpanded ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="liquid-glass-elevated rounded-2xl overflow-hidden h-full"
      >
        {/* Hidden YouTube iframe for full playback */}
        <iframe
          ref={playerRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&controls=1&modestbranding=1&rel=0&showinfo=0`}
          title={title}
          className="w-full h-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ display: isPlaying ? 'block' : 'none' }}
        />
        
        {/* Overlay controls */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 pointer-events-none" />
        
        {/* Track info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-foreground">
                <p className="text-sm font-medium truncate max-w-[200px]">{title}</p>
                <p className="text-xs text-muted-foreground">{artist}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleExpand}
                className="depth-press w-8 h-8 rounded-full liquid-glass-subtle flex items-center justify-center"
              >
                <Maximize2 className="w-4 h-4 text-foreground" />
              </button>
              
              <button
                onClick={isPlaying ? onPause : onPlay}
                className="depth-press w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Play className="w-4 h-4 text-primary-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default YouTubePlayer;
