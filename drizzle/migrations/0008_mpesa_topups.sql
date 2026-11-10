CREATE TABLE public.mpesa_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  amount numeric(12,2) NOT NULL,
  checkout_request_id text UNIQUE NOT NULL,
  merchant_request_id text,
  status text NOT NULL DEFAULT 'pending',
  mpesa_receipt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT ON public.mpesa_topups TO authenticated;
GRANT ALL ON public.mpesa_topups TO service_role;
ALTER TABLE public.mpesa_topups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own M-Pesa top-ups"
  ON public.mpesa_topups FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX mpesa_topups_user_created_idx ON public.mpesa_topups(user_id, created_at DESC);