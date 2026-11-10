import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthNS = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthNS }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const authorizationId = params.get("authorization_id") ?? "";
  const { user, loading: authLoading } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authorizationId) {
      setError("Missing authorization_id");
      return;
    }
    if (!user) {
      const next = window.location.pathname + window.location.search;
      navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }
    let active = true;
    (async () => {
      try {
        const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message || "Failed to load authorization");
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? String(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, user, authLoading, navigate]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message || "Authorization failed");
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md liquid-glass rounded-3xl p-6 space-y-4 relative z-10">
        {error ? (
          <>
            <h1 className="text-headline text-foreground">Authorization error</h1>
            <p className="text-sm text-destructive">{error}</p>
          </>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">Loading authorization…</p>
        ) : (
          <>
            <h1 className="text-xl text-display text-foreground">
              Connect {details.client?.name ?? details.client?.client_name ?? "an app"} to Primegram
            </h1>
            <p className="text-sm text-muted-foreground">
              {details.client?.name ?? "This client"} will be able to use Primegram tools while you're signed in
              as <span className="text-foreground font-medium">{user?.email ?? "your account"}</span>.
            </p>
            <div className="rounded-2xl liquid-glass-subtle p-3 text-xs text-muted-foreground relative z-10">
              <p className="mb-1 text-foreground font-medium">This does not bypass Primegram's permissions.</p>
              <p>Access is scoped by row-level security to your account only.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => decide(false)}
                disabled={busy}
                className="depth-press flex-1 py-3 rounded-2xl liquid-glass-subtle text-foreground text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => decide(true)}
                disabled={busy}
                className="depth-press flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {busy ? "..." : "Approve"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthConsent;
