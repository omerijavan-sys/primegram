import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Home, Search, PlusSquare, User, Film } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: PlusSquare, label: "Create", path: "/create" },
  { icon: Film, label: "Reels", path: "/reels" },
  { icon: User, label: "Profile", path: "/profile" },
];

const GlassTabBar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const location = useLocation();

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.path === location.pathname));

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setCollapsed(latest > 100 && latest > prev);
  });

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center safe-area-bottom pb-2"
      animate={collapsed ? { y: 20, opacity: 0.8 } : { y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <motion.nav
        className="liquid-glass-elevated flex items-center gap-1 px-2"
        animate={collapsed ? {
          borderRadius: "2rem", paddingLeft: "0.75rem", paddingRight: "0.75rem",
          paddingTop: "0.5rem", paddingBottom: "0.5rem",
        } : {
          borderRadius: "1.75rem", paddingLeft: "0.75rem", paddingRight: "0.75rem",
          paddingTop: "0.625rem", paddingBottom: "0.625rem",
        }}
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{ width: collapsed ? "auto" : "calc(100% - 2rem)", maxWidth: collapsed ? "280px" : "400px" }}
      >
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = i === activeIndex;
          return (
            <motion.button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`depth-press relative flex items-center justify-center rounded-2xl transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              animate={collapsed ? { width: 40, height: 40 } : { width: 64, height: 48 }}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-2xl liquid-glass-subtle"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 1.5} />
            </motion.button>
          );
        })}
      </motion.nav>
    </motion.div>
  );
};

export default GlassTabBar;
