import { motion } from "framer-motion";

interface SiriOrbProps {
  size?: number;
  intensity?: number;
  listening?: boolean;
  speaking?: boolean;
  onClick?: () => void;
}

/**
 * Siri orb — a translucent glass sphere with fluid multicolour plasma blobs
 * swirling inside, a refractive rim and an audio-reactive halo.
 * Fully CSS/SVG driven, reacts to `intensity` (0..1) from the mic analyser.
 */
const SiriOrb = ({
  size = 64,
  intensity = 0,
  listening = false,
  speaking = false,
  onClick,
}: SiriOrbProps) => {
  const active = listening || speaking;
  const energy = Math.min(1, Math.max(0, intensity));
  const speed = active ? 3.2 - energy * 1.6 : 7;

  const blob = (
    key: string,
    name: string,
    color: string,
    duration: number,
    pos: { top: string; left: string; size: string },
    delay = 0,
  ) => (
    <div
      key={key}
      className="absolute rounded-full"
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.size,
        height: pos.size,
        background: color,
        filter: `blur(${Math.max(3, size * 0.11)}px)`,
        mixBlendMode: "screen",
        animation: `${name} ${duration}s ease-in-out ${delay}s infinite`,
        willChange: "transform",
      }}
    />
  );


  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Siri assistant"
      className="relative rounded-full overflow-visible"
      style={{ width: size, height: size }}
      animate={{ scale: 1 + energy * 0.14 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 320, damping: 18 }}
    >
      {/* Ambient bloom */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: "-35%",
          background:
            "radial-gradient(circle, hsla(214,100%,62%,0.40) 0%, hsla(280,90%,65%,0.30) 35%, hsla(150,85%,55%,0.22) 60%, transparent 78%)",
          filter: `blur(${size * 0.28}px)`,
        }}
        animate={{
          opacity: active ? [0.7, 1, 0.7] : [0.45, 0.7, 0.45],
          scale: active ? [1, 1.18, 1] : [1, 1.06, 1],
        }}
        transition={{ duration: active ? 1.1 : 3.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Glass sphere with fluid plasma interior */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: "radial-gradient(circle at 50% 55%, hsla(235,55%,7%,0.85), hsla(240,60%,3%,0.95))",
          backdropFilter: "blur(8px) saturate(1.6)",
          WebkitBackdropFilter: "blur(8px) saturate(1.6)",
          boxShadow:
            "inset 0 0 0 1px hsla(0,0%,100%,0.20), inset 0 2px 10px hsla(0,0%,100%,0.22), inset 0 -12px 26px hsla(214,100%,60%,0.35)",
        }}
      >
        {blob("blue", "siri-blob-a", "radial-gradient(circle, hsla(214,100%,58%,1) 0%, hsla(214,100%,50%,0.35) 45%, transparent 72%)", speed, { top: "-14%", left: "-12%", size: "80%" })}
        {blob("violet", "siri-blob-b", "radial-gradient(circle, hsla(288,100%,62%,0.95) 0%, hsla(288,100%,55%,0.30) 45%, transparent 72%)", speed * 1.25, { top: "26%", left: "28%", size: "80%" }, 0.3)}
        {blob("green", "siri-blob-c", "radial-gradient(circle, hsla(150,95%,50%,0.9) 0%, hsla(150,95%,45%,0.28) 45%, transparent 72%)", speed * 1.5, { top: "38%", left: "-16%", size: "68%" }, 0.6)}
        {blob("red", "siri-blob-a", "radial-gradient(circle, hsla(0,95%,58%,0.85) 0%, hsla(0,95%,50%,0.25) 45%, transparent 72%)", speed * 1.8, { top: "-18%", left: "36%", size: "64%" }, 0.9)}

        {/* Inner caustic swirl */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, hsla(0,0%,100%,0.14) 18%, transparent 40%, hsla(0,0%,100%,0.10) 68%, transparent 90%)",
            mixBlendMode: "overlay",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: active ? 5 : 12, repeat: Infinity, ease: "linear" }}
        />

        {/* Depth vignette keeps the plasma reading as liquid inside glass */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 40%, hsla(240,60%,3%,0.55) 82%, hsla(240,60%,2%,0.85) 100%)",
          }}
        />

        {/* Frosted glass veil */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 32% 24%, hsla(0,0%,100%,0.30) 0%, hsla(0,0%,100%,0.05) 26%, transparent 52%)",
          }}

        />
      </div>

      {/* Refractive rim */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow:
            "inset 0 0 0 1px hsla(0,0%,100%,0.30), 0 6px 22px hsla(214,100%,56%,0.35), 0 2px 6px hsla(0,0%,0%,0.45)",
        }}
      />

      {/* Specular highlight */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "26%",
          height: "16%",
          top: "13%",
          left: "23%",
          transform: "rotate(-18deg)",
          background: "radial-gradient(ellipse, hsla(0,0%,100%,0.9) 0%, transparent 72%)",
          filter: "blur(1.5px)",
        }}
      />

      {/* Listening / speaking ripples */}
      {active &&
        [0, 0.45, 0.9].map((delay) => (
          <motion.div
            key={delay}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: "1px solid hsla(0,0%,100%,0.45)" }}
            animate={{ scale: [1, 1.9], opacity: [0.65, 0] }}
            transition={{ duration: 1.7, delay, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
    </motion.button>
  );
};

export default SiriOrb;
