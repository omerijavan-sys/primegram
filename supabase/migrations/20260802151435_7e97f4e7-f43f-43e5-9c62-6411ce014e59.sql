-- Internal trigger functions must never be callable through the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- Audit logger: only signed-in users may write audit entries
REVOKE ALL ON FUNCTION public.log_security_event(text, text, text, jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) TO authenticated;