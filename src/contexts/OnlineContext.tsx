import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const OnlineContext = createContext<{ ids: string[]; connected: boolean }>({ ids: [], connected: false });
export const useOnline = () => useContext(OnlineContext);

export function OnlineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    setIds([]);
    setConnected(false);
    if (!user || user.is_anonymous) return;
    const channel = supabase.channel("primegram-online", {
      config: { private: true, presence: { key: user.id } },
    });
    channel.on("presence", { event: "sync" }, () => setIds(Object.keys(channel.presenceState())))
      .subscribe(async state => {
        setConnected(state === "SUBSCRIBED");
        if (state === "SUBSCRIBED") await channel.track({ online_at: new Date().toISOString() });
      });
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);
  return <OnlineContext.Provider value={{ ids, connected }}>{children}</OnlineContext.Provider>;
}