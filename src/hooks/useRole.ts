import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user";

/** Server-verified roles for the signed-in user. Never trust client storage for this. */
export const useRoles = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const roles = query.data ?? [];
  return {
    roles,
    isAdmin: roles.includes("admin"),
    isModerator: roles.includes("admin") || roles.includes("moderator"),
    loading: query.isLoading,
  };
};
