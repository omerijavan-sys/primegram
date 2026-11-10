import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Cinematic auth intro:
 * a supercar pulls up → scissor door lifts → figure steps out →
 * briefcase slips, tumbles, bursts open → light wipe into the credential form.
 */

const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;

const Supercar = ({ doorOpen }: { doorOpen: boolean }) => (
  <svg viewBox="0 0 520 200" className="w-full h-auto" aria-hidden="true">
    <defs>
      <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(220 18% 30%)" />
        <stop offset="35%" stopColor="hsl(220 20% 14%)" />
        <stop offset="70%" stopColor="hsl(220 22% 8%)" />
        <stop offset="100%" stopColor="hsl(220 24% 4%)" />
      </linearGradient>
      <linearGradient id="carSheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="hsla(0,0%,100%,0)" />
        <stop offset="45%" stopColor="hsla(0,0%,100%,0.32)" />
        <stop offset="60%" stopColor="hsla(214,100%,70%,0.22)" />
        <stop offset="100%" stopColor="hsla(0,0%,100%,0)" />
      </linearGradient>
      <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsla(210,60%,70%,0.45)" />
        <stop offset="100%" stopColor="hsla(220,40%,10%,0.85)" />
      </linearGradient>
      <radialGradient id="headlight" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="hsla(200,100%,92%,1)" />
        <stop offset="45%" stopColor="hsla(205,100%,75%,0.55)" />
        <stop offset="100%" stopColor="hsla(205,100%,70%,0)" />
      </radialGradient>
    </defs>

    {/* ground shadow */}
    <ellipse cx="255" cy="176" rx="215" ry="14" fill="hsla(0,0%,0%,0.6)" />

    {/* wheels */}
    {[130, 388].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={150} r="30" fill="hsl(220 15% 6%)" />
        <circle cx={cx} cy={150} r="17" fill="none" stroke="hsl(220 10% 45%)" strokeWidth="3" />
        <circle cx={cx} cy={150} r="6" fill="hsl(220 12% 55%)" />
      </g>
    ))}

    {/* low wedge body */}
    <path
      d="M28 148 L54 118 L128 104 L182 74 L318 70 L392 98 L474 112 L496 132 L492 150 L432 152 C424 128 400 118 388 118 C368 118 350 132 346 152 L172 152 C166 128 148 118 130 118 C110 118 94 132 90 152 Z"
      fill="url(#carBody)"
      stroke="hsla(0,0%,100%,0.12)"
      strokeWidth="1"
    />

    {/* cabin glass */}
    <path d="M192 80 L308 76 L364 100 L206 104 Z" fill="url(#glassGrad)" />

    {/* scissor door */}
    <motion.g
      style={{ originX: "215px", originY: "108px" }}
      animate={{ rotate: doorOpen ? -62 : 0 }}
      transition={{ duration: 1.15, ease: EASE_CINEMATIC }}
    >
      <path
        d="M212 104 L300 100 L336 128 L330 150 L216 150 Z"
        fill="url(#carBody)"
        stroke="hsla(0,0%,100%,0.22)"
        strokeWidth="1.2"
      />
      <path d="M220 106 L296 103 L322 124 L226 126 Z" fill="hsla(210,60%,70%,0.28)" />
    </motion.g>

    {/* body sheen sweep */}
    <motion.path
      d="M28 148 L54 118 L128 104 L182 74 L318 70 L392 98 L474 112 L496 132 L492 150 L28 150 Z"
      fill="url(#carSheen)"
      initial={{ x: -520, opacity: 0 }}
      animate={{ x: 520, opacity: [0, 1, 0] }}
      transition={{ duration: 2.2, delay: 0.7, ease: "easeInOut" }}
    />

    {/* headlights */}
    <ellipse cx="486" cy="126" rx="52" ry="26" fill="url(#headlight)" opacity="0.85" />
    <path d="M456 112 L486 118 L486 130 L454 126 Z" fill="hsla(200,100%,95%,0.9)" />
    <path d="M52 122 L74 118 L74 128 L52 130 Z" fill="hsla(0,85%,58%,0.85)" />
  </svg>
);

const Figure = ({ variant }: { variant: "step" | "stand" }) => (
  <svg viewBox="0 0 120 260" className="h-full w-auto" aria-hidden="true">
    <defs>
      <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(220 20% 22%)" />
        <stop offset="100%" stopColor="hsl(220 24% 6%)" />
      </linearGradient>
    </defs>
    {/* head */}
    <circle cx="60" cy="26" r="16" fill="hsl(28 30% 62%)" />
    <path d="M44 22 C46 8 74 8 76 22 C70 16 50 16 44 22 Z" fill="hsl(220 20% 8%)" />
    {/* torso / suit */}
    <path d="M40 44 L80 44 L92 108 L84 168 L36 168 L28 108 Z" fill="url(#suitGrad)" />
    <path d="M58 44 L62 44 L66 112 L54 112 Z" fill="hsla(0,0%,100%,0.9)" />
    <path d="M60 46 L54 60 L60 82 L66 60 Z" fill="hsl(214 90% 40%)" />
    {/* arms */}
    <path
      d={variant === "step" ? "M40 50 L18 112 L26 122 L48 62 Z" : "M40 50 L14 104 L24 112 L48 60 Z"}
      fill="url(#suitGrad)"
    />
    <path d="M80 50 L104 110 L96 120 L74 62 Z" fill="url(#suitGrad)" />
    {/* legs */}
    <path
      d={
        variant === "step"
          ? "M40 166 L34 250 L50 252 L58 172 Z M64 168 L78 246 L94 240 L76 166 Z"
          : "M42 166 L36 250 L52 252 L58 172 Z M66 168 L74 250 L90 250 L78 168 Z"
      }
      fill="hsl(220 22% 10%)"
    />
    <ellipse cx="42" cy="252" rx="14" ry="5" fill="hsl(220 15% 4%)" />
    <ellipse cx="86" cy="248" rx="14" ry="5" fill="hsl(220 15% 4%)" />
  </svg>
);

const Briefcase = () => (
  <svg viewBox="0 0 120 84" className="w-full h-auto" aria-hidden="true">
    <defs>
      <linearGradient id="leather" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(24 38% 26%)" />
        <stop offset="100%" stopColor="hsl(22 42% 12%)" />
      </linearGradient>
    </defs>
    <rect x="8" y="20" width="104" height="56" rx="9" fill="url(#leather)" stroke="hsla(38,60%,70%,0.35)" strokeWidth="1.5" />
    <rect x="40" y="6" width="40" height="16" rx="8" fill="none" stroke="hsl(30 35% 30%)" strokeWidth="5" />
    <rect x="50" y="40" width="20" height="14" rx="3" fill="hsl(45 55% 62%)" />
    <line x1="8" y1="48" x2="112" y2="48" stroke="hsla(0,0%,0%,0.45)" strokeWidth="2" />
  </svg>
);

interface Props {
  onDone: () => void;
}

const AuthCinematic = ({ onDone }: Props) => {
  const [stage, setStage] = useState(0);
  // 0 arrive · 1 door · 2 step out · 3 briefcase slips · 4 burst · 5 done

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onDone();
      return;
    }
    const marks: [number, number][] = [
      [1, 1500],
      [2, 2500],
      [3, 3500],
      [4, 4600],
      [5, 5400],
    ];
    const timers = marks.map(([s, t]) =>
      setTimeout(() => {
        setStage(s);
        if (s === 5) onDone();
      }, t),
    );
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <AnimatePresence>
      {stage < 5 && (
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ background: "radial-gradient(120% 100% at 50% 100%, hsl(220 28% 8%), hsl(220 30% 2%))" }}
        >
          {/* asphalt + horizon light */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
              background:
                "linear-gradient(to bottom, hsla(214,100%,60%,0.06), hsla(0,0%,0%,0.9)), repeating-linear-gradient(90deg, hsla(0,0%,100%,0.03) 0 2px, transparent 2px 60px)",
            }}
          />
          <motion.div
            className="absolute left-1/2 top-1/3 h-40 w-[60vw] -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsla(214,100%,60%,0.22), transparent 70%)" }}
            animate={{ opacity: [0.4, 0.9, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* speed streaks on arrival */}
          {stage === 0 &&
            [0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute h-[2px] rounded-full"
                style={{
                  top: `${44 + i * 5}%`,
                  width: "40vw",
                  background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.5), transparent)",
                }}
                initial={{ x: "110vw", opacity: 0 }}
                animate={{ x: "-60vw", opacity: [0, 1, 0] }}
                transition={{ duration: 0.7, delay: i * 0.08, repeat: 1 }}
              />
            ))}

          {/* car */}
          <motion.div
            className="absolute bottom-[26%] left-1/2 w-[min(760px,105vw)] -translate-x-1/2"
            initial={{ x: "70vw", scale: 1.15, opacity: 0 }}
            animate={
              stage >= 4
                ? { x: "-50%", scale: 1, opacity: 0 }
                : { x: "-50%", scale: 1, opacity: 1 }
            }
            transition={{ duration: stage >= 4 ? 0.6 : 1.5, ease: EASE_CINEMATIC }}
          >
            <Supercar doorOpen={stage >= 1} />
          </motion.div>

          {/* figure steps out */}
          <AnimatePresence>
            {stage >= 2 && stage < 4 && (
              <motion.div
                className="absolute bottom-[24%] left-[40%] h-[34vh] max-h-[300px]"
                initial={{ x: "60%", opacity: 0, scaleY: 0.9 }}
                animate={{ x: "-40%", opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: EASE_CINEMATIC }}
              >
                <Figure variant="step" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* briefcase slips and tumbles */}
          <AnimatePresence>
            {stage >= 3 && stage < 4 && (
              <motion.div
                className="absolute bottom-[24%] left-[36%] w-24"
                initial={{ y: -90, rotate: 0, opacity: 0 }}
                animate={{ y: [-90, 10, -18, 6, 0], rotate: [0, 140, 260, 340, 372], opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeIn" }}
              >
                <Briefcase />
              </motion.div>
            )}
          </AnimatePresence>

          {/* burst open → light wipe */}
          <AnimatePresence>
            {stage >= 4 && (
              <motion.div
                className="absolute left-[38%] bottom-[26%] -translate-x-1/2"
                initial={{ scale: 0.1, opacity: 0 }}
                animate={{ scale: 26, opacity: [0, 1, 0.9] }}
                transition={{ duration: 0.85, ease: EASE_CINEMATIC }}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: "40%",
                  background:
                    "radial-gradient(circle, hsla(0,0%,100%,0.95) 0%, hsla(214,100%,72%,0.5) 40%, hsla(145,72%,50%,0.18) 70%, transparent 100%)",
                }}
              />
            )}
          </AnimatePresence>

          {/* vignette + film grain */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(115% 90% at 50% 55%, transparent 52%, hsla(0,0%,0%,0.7) 100%)" }}
          />

          <button
            onClick={() => {
              setStage(5);
              onDone();
            }}
            className="absolute bottom-6 right-6 z-10 rounded-full liquid-glass px-4 py-2 text-xs font-semibold text-foreground"
          >
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthCinematic;
export { Figure };
