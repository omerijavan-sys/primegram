import { supabase } from "@/integrations/supabase/client";

export const rtcChannelName = (a: string, b: string) => `rtc-${[a, b].sort().join("--")}`;

export async function beginCall(callerId: string, receiverId: string, audio = false) {
  if (callerId === receiverId) throw new Error("Choose another member to call.");
  const { data, error } = await supabase.from("call_invitations")
    .insert({ caller_id: callerId, receiver_id: receiverId, audio })
    .select("id").single();
  if (error) throw error;
  return `/call/${receiverId}?call=${data.id}${audio ? "&audio=1" : ""}`;
}