import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PrimeLogo from "@/components/PrimeLogo";

const WelcomePage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate("/auth", { replace: true }), 2600);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 45%, hsl(var(--primary) / 0.25), transparent 55%)" }} />
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: "easeOut" }} className="relative">
        <motion.div className="absolute -inset-8 rounded-full border border-primary/40" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }} />
        <PrimeLogo size={96} />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10 text-2xl font-black tracking-[0.3em] text-primary">PRIMEGRAM</motion.h1>
      <div className="mt-8 h-1 w-40 rounded-full bg-secondary overflow-hidden">
        <motion.div className="h-full bg-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.4, ease: "easeInOut" }} />
      </div>
      <p className="absolute bottom-8 text-xs text-muted-foreground">Created by Java Prime · Sponsored by JP7 ULTRA</p>
    </div>
  );
};

export default WelcomePage;
