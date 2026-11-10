import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, UserPlus, AtSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotificationsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="liquid-glass-elevated safe-area-top">
        <div className="flex items-center gap-3 px-5 py-4 relative z-10">
          <button onClick={() => navigate(-1)} className="depth-press"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <span className="text-headline text-foreground text-base">Notifications</span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-3xl liquid-glass flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-muted-foreground relative z-10" />
        </div>
        <p className="text-foreground font-semibold mb-1">No notifications yet</p>
        <p className="text-sm text-muted-foreground">When someone interacts with your posts, you'll see it here.</p>
      </div>
    </div>
  );
};

export default NotificationsPage;
