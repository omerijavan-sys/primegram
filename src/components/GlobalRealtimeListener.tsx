import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import IncomingCallModal from "@/components/IncomingCallModal";
import { playNotificationTone } from "@/hooks/useRingtone";
import { logSecurityEvent } from "@/utils/audit";
import { readPreference } from "@/utils/preferences";

interface Ring {
  id: string;
  callerId: string;
  callerName: string;
  audio?: boolean;
}

/**
 * App-wide realtime listener: incoming WebRTC calls (with ringtone) and
 * live message / notification toasts with a sound.
 */
const GlobalRealtimeListener = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [ring, setRing] = useState<Ring | null>(null);

  useEffect(() => {
    if (!user) return;

    const showRing = async (row: { id: string; caller_id: string; audio: boolean; status: string; created_at: string }) => {
      if (row.status !== "ringing" || Date.now() - Date.parse(row.created_at) > 45000) return;
      const { data } = await supabase.from("profiles").select("display_name, username").eq("user_id", row.caller_id).maybeSingle();
      const name = data?.display_name || data?.username || "Member";
      setRing({ id: row.id, callerId: row.caller_id, callerName: name, audio: row.audio });
      if (readPreference("notifications", { push: false }).push && document.hidden && "Notification" in window && Notification.permission === "granted") {
        new Notification("Incoming Primegram call", { body: name, icon: "/favicon.png", tag: row.id });
      }
    };
    const calls = supabase
      .channel(`call-invitations-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "call_invitations", filter: `receiver_id=eq.${user.id}` }, ({ new: row }) => { void showRing(row as any); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "call_invitations", filter: `receiver_id=eq.${user.id}` }, ({ new: row }) => {
        if (row.status !== "ringing") setRing(current => current?.id === row.id ? null : current);
      })
      .subscribe();

    const refreshRings = async () => {
      const { data } = await supabase.from("call_invitations").select("*").eq("receiver_id", user.id).eq("status", "ringing")
        .gte("created_at", new Date(Date.now() - 45000).toISOString()).order("created_at", { ascending: false }).limit(1);
      if (data?.[0]) void showRing(data[0]);
      else setRing(null);
    };
    void refreshRings();
    const ringPoll = setInterval(refreshRings, 5000);

    const inbox = supabase
      .channel(`inbox-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        async ({ new: row }: any) => {
          const prefs = readPreference("notifications", { push: false, messages: true });
          if (!prefs.messages) return;
          playNotificationTone();
          void logSecurityEvent("realtime", "message_received", row.sender_id, { message_id: row.id });
          const { data } = await supabase
            .from("profiles")
            .select("display_name, username")
            .eq("user_id", row.sender_id)
            .maybeSingle();
          const name = data?.display_name || data?.username || "New message";
          if (prefs.push && document.hidden && "Notification" in window && Notification.permission === "granted") {
            const notice = new Notification(name, { body: "New message on Primegram", icon: "/favicon.png" });
            notice.onclick = () => { window.focus(); navigate("/messages"); notice.close(); };
          }
          toast(name, {
            description: String(row.content ?? "").slice(0, 120),
            action: { label: "Open", onClick: () => navigate("/messages") },
          });
        },
      )
      .subscribe();

    return () => {
      clearInterval(ringPoll);
      supabase.removeChannel(calls);
      supabase.removeChannel(inbox);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Never overlay the modal while already on a call screen.
  const onCallScreen = location.pathname.startsWith("/call/");

  const decline = () => {
    if (ring && user) {
      void logSecurityEvent("realtime", "call_declined", ring.callerId);
      void supabase.from("call_invitations").update({ status: "declined" }).eq("id", ring.id);
    }
    setRing(null);
  };

  return (
    <IncomingCallModal
      isOpen={!!ring && !onCallScreen}
      callerName={ring?.callerName || ""}
      onJoin={async () => {
        if (!ring) return;
        const { data, error } = await supabase.from("call_invitations").update({ status: "accepted" }).eq("id", ring.id).eq("status", "ringing").select("id").maybeSingle();
        if (error || !data) { setRing(null); toast.error("This call is no longer available."); return; }
        const target = `/call/${ring.callerId}?incoming=1&call=${ring.id}${ring.audio ? "&audio=1" : ""}`;
        setRing(null);
        navigate(target);
      }}
      onDecline={decline}
    />
  );
};

export default GlobalRealtimeListener;
