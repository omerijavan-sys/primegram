-- 1. Wallet: remove client-side write ability
REVOKE INSERT, UPDATE, DELETE ON public.wallet_transactions FROM authenticated;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can delete own wallet" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet" ON public.wallet_transactions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Server-side balance helper
CREATE OR REPLACE FUNCTION public.wallet_balance(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(CASE WHEN type = 'send' THEN -amount ELSE amount END), 0)
  FROM public.wallet_transactions
  WHERE user_id = _user_id;
$$;
REVOKE ALL ON FUNCTION public.wallet_balance(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.wallet_my_balance()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(CASE WHEN type = 'send' THEN -amount ELSE amount END), 0)
  FROM public.wallet_transactions
  WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.wallet_my_balance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallet_my_balance() TO authenticated;

-- 3. Atomic server-side transfer between real app users
CREATE OR REPLACE FUNCTION public.wallet_send(_recipient text, _amount numeric)
RETURNS TABLE (transfer_amount numeric, new_balance numeric)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender uuid := auth.uid();
  _recipient_id uuid;
  _amt numeric(12,2);
  _bal numeric;
BEGIN
  IF _sender IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  _amt := round(_amount, 2);
  IF _amt IS NULL OR _amt <= 0 OR _amt > 100000 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT p.user_id INTO _recipient_id
  FROM public.profiles p
  WHERE lower(p.username) = lower(btrim(_recipient))
  LIMIT 1;

  IF _recipient_id IS NULL THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;
  IF _recipient_id = _sender THEN
    RAISE EXCEPTION 'Cannot send to yourself';
  END IF;

  -- Serialize concurrent transfers for this sender
  PERFORM pg_advisory_xact_lock(hashtextextended(_sender::text, 0));

  _bal := public.wallet_balance(_sender);
  IF _bal < _amt THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, counterparty)
  VALUES (_sender, 'send', _amt, (SELECT username FROM public.profiles WHERE user_id = _recipient_id));

  INSERT INTO public.wallet_transactions (user_id, type, amount, counterparty)
  VALUES (_recipient_id, 'receive', _amt, (SELECT username FROM public.profiles WHERE user_id = _sender));

  RETURN QUERY SELECT _amt, public.wallet_balance(_sender);
END;
$$;
REVOKE ALL ON FUNCTION public.wallet_send(text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallet_send(text, numeric) TO authenticated;

-- 4. Storage: no anonymous access to the media bucket
DROP POLICY IF EXISTS "Public can read media files" ON storage.objects;
CREATE POLICY "Authenticated can read media files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'media'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND name LIKE ((auth.uid())::text || '/%')
);

DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = (auth.uid())::text
);