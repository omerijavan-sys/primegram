CREATE TABLE public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL,
  event text NOT NULL,
  target text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.security_audit_log TO authenticated;
GRANT ALL ON public.security_audit_log TO service_role;

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own audit entries"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE INDEX security_audit_log_created_at_idx ON public.security_audit_log (created_at DESC);
CREATE INDEX security_audit_log_user_idx ON public.security_audit_log (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_security_event(
  _category text,
  _event text,
  _target text DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _category IS NULL OR _event IS NULL THEN
    RETURN;
  END IF;
  IF _category NOT IN ('auth', 'otp', 'realtime') THEN
    RETURN;
  END IF;
  INSERT INTO public.security_audit_log (user_id, category, event, target, details)
  VALUES (
    auth.uid(),
    left(_category, 32),
    left(_event, 64),
    left(coalesce(_target, ''), 256),
    coalesce(_details, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) TO anon, authenticated, service_role;