import { useEffect, useRef } from "react";

const LiquidBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let mouseX = 0.5, mouseY = 0.5;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      const y = "touches" in e ? e.touches[0]?.clientY : e.clientY;
      if (x !== undefined) {
        mouseX = x / window.innerWidth;
        mouseY = y / window.innerHeight;
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    const draw = () => {
      time += 0.003;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Base dark
      ctx.fillStyle = "hsl(220, 20%, 4%)";
      ctx.fillRect(0, 0, w, h);

      // Liquid blobs
      const blobs = [
        { cx: 0.3 + Math.sin(time * 0.7) * 0.1 + mouseX * 0.05, cy: 0.25 + Math.cos(time * 0.5) * 0.08 + mouseY * 0.03, r: 0.35, color: "210, 100%, 60%" },
        { cx: 0.7 + Math.cos(time * 0.6) * 0.12 - mouseX * 0.04, cy: 0.65 + Math.sin(time * 0.8) * 0.1 - mouseY * 0.04, r: 0.3, color: "280, 70%, 55%" },
        { cx: 0.5 + Math.sin(time * 0.9) * 0.08, cy: 0.5 + Math.cos(time * 0.4) * 0.12 + mouseY * 0.02, r: 0.25, color: "350, 80%, 58%" },
        { cx: 0.15 + Math.cos(time * 1.1) * 0.06 + mouseX * 0.03, cy: 0.8 + Math.sin(time * 0.7) * 0.06, r: 0.2, color: "170, 60%, 50%" },
      ];

      for (const blob of blobs) {
        const grad = ctx.createRadialGradient(
          blob.cx * w, blob.cy * h, 0,
          blob.cx * w, blob.cy * h, blob.r * Math.max(w, h)
        );
        grad.addColorStop(0, `hsla(${blob.color}, 0.06)`);
        grad.addColorStop(0.5, `hsla(${blob.color}, 0.03)`);
        grad.addColorStop(1, `hsla(${blob.color}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Subtle wave lines
      ctx.strokeStyle = "hsla(210, 100%, 60%, 0.02)";
      ctx.lineWidth = 1.5;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        for (let x = 0; x < w; x += 4) {
          const y = h * (0.3 + j * 0.2) +
            Math.sin(x * 0.005 + time * 2 + j) * 30 +
            Math.sin(x * 0.01 + time * 1.5 + j * 2) * 15 +
            mouseY * 10;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
};

export default LiquidBackground;
