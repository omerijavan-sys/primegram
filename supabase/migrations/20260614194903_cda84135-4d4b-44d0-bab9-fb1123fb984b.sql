CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup','send','receive')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  counterparty TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallet" ON public.wallet_transactions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX wallet_tx_user_created_idx ON public.wallet_transactions(user_id, created_at DESC);