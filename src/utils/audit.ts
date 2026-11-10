import { supabase } from "@/integrations/supabase/client";

export type AuditCategory = "auth" | "otp" | "realtime";

/**
 * Fire-and-forget security audit log. Never throws — auditing must never
 * break a user-facing flow.
 */
export async function logSecurityEvent(
  category: AuditCategory,
  event: string,
  target?: string,
  details: Record<string, unknown> = {},
) {
  try {
    await (supabase as any).rpc("log_security_event", {
      _category: category,
      _event: event,
      _target: target ?? null,
      _details: details,
    });
  } catch {
    /* ignore */
  }
}
