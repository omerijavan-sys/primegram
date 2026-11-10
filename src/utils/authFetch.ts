import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the signed-in user's access token for calling edge functions.
 * Edge functions validate this JWT, so anonymous callers are rejected.
 */
export const getAccessToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

export const authHeader = async (): Promise<string> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in to continue.");
  return `Bearer ${token}`;
};
