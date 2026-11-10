import { useEffect, useRef } from "react";

/**
 * Web-Audio ringtone / notification tones. No asset files needed.
 */
const getCtx = (() => {
  let ctx: AudioContext | null = null;
  return () => {
    if (!ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };
})();

const beep = (freq: number, start: number, dur: number, gain = 0.14) => {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.03);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.05);
};

/** Short two-tone "ding" for incoming messages / notifications. */
export const playNotificationTone = () => {
  beep(880, 0, 0.14);
  beep(1180, 0.14, 0.18);
};

/** Classic double-ring pattern, repeated until stopped. */
export const startRingtone = () => {
  const ring = () => {
    beep(440, 0, 0.4, 0.16);
    beep(560, 0.45, 0.4, 0.16);
  };
  ring();
  const id = window.setInterval(ring, 2000);
  const vibrate = () => navigator.vibrate?.([500, 300, 500, 1200]);
  vibrate();
  const vibId = window.setInterval(vibrate, 2500);
  return () => {
    window.clearInterval(id);
    window.clearInterval(vibId);
    navigator.vibrate?.(0);
  };
};

/** Rings for as long as `active` is true. */
export const useRingtone = (active: boolean) => {
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (active) {
      stopRef.current = startRingtone();
    }
    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [active]);
};
