import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { MessageCircle, Settings, Wallet, UserPlus, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import pLogo from "@/assets/p-logo-lux.png";

const TopNavBar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { scrollY } = useScroll();
  const navigate = useNavigate();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setCollapsed(latest > 60 && latest > prev);
  });

  const iconBtn = "depth-press w-8 h-8 flex items-center justify-center rounded-full liquid-glass-subtle";

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 safe-area-top"
      animate={collapsed ? { y: -10, opacity: 0.9 } : { y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <motion.div
        className="liquid-glass-elevated mx-auto flex items-center justify-between"
        animate={collapsed ? {
          marginLeft: "1.5rem", marginRight: "1.5rem", marginTop: "0.5rem",
          borderRadius: "2rem", paddingLeft: "1rem", paddingRight: "1rem",
          paddingTop: "0.5rem", paddingBottom: "0.5rem",
        } : {
          marginLeft: "0rem", marginRight: "0rem", marginTop: "0rem",
          borderRadius: "0rem", paddingLeft: "1rem", paddingRight: "1rem",
          paddingTop: "0.625rem", paddingBottom: "0.625rem",
        }}
        layout
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        <motion.div
          className="flex items-center gap-2"
          animate={collapsed ? { justifyContent: "center", flex: 1 } : { justifyContent: "flex-start", flex: 0 }}
        >
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('prime:openOrb'))}
            className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center depth-press"
            aria-label="Open Heiji AI"
          >
            <img src={pLogo} alt="Primegram" className="w-full h-full object-contain" />
          </button>
          <motion.h1
            className="text-headline text-foreground"
            animate={collapsed ? { fontSize: "0rem", width: 0, opacity: 0 } : { fontSize: "1.15rem", width: "auto", opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            Primegram
          </motion.h1>
        </motion.div>

        <motion.div
          className="flex items-center gap-2"
          animate={collapsed ? { opacity: 0, width: 0, overflow: "hidden" } : { opacity: 1, width: "auto" }}
        >
          <button className={iconBtn} onClick={() => navigate("/discover")} aria-label="Discover people">
            <UserPlus className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          </button>
          <button className={iconBtn} onClick={() => navigate("/messages")}>
            <MessageCircle className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          </button>
          <button className={iconBtn} onClick={() => navigate("/extreme")} aria-label="Prime Extreme">
            <Rocket className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </button>
          <button className={iconBtn} onClick={() => navigate("/wallet")}>
            <Wallet className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          </button>
          <button className={iconBtn} onClick={() => navigate("/settings")}>
            <Settings className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          </button>
        </motion.div>
      </motion.div>
    </motion.header>
  );
};

export default TopNavBar;
