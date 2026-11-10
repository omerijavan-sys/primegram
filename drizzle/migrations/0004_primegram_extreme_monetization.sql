
CREATE TABLE public.post_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tier text NOT NULL,
  price numeric NOT NULL,
  target_views integer NOT NULL,
  placement text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '3 days'
);
GRANT SELECT ON public.post_boosts TO authenticated;
GRANT ALL ON public.post_boosts TO service_role;
ALTER TABLE public.post_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see boosts" ON public.post_boosts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE public.prime_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier text NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
GRANT SELECT ON public.prime_subscriptions TO authenticated;
GRANT ALL ON public.prime_subscriptions TO service_role;
ALTER TABLE public.prime_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see tiers" ON public.prime_subscriptions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE public.crushes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid(),
  target_id uuid NOT NULL,
  revealed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, target_id)
);
GRANT SELECT, INSERT, DELETE ON public.crushes TO authenticated;
GRANT ALL ON public.crushes TO service_role;
ALTER TABLE public.crushes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Senders see own crushes" ON public.crushes FOR SELECT TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "Send crush as self" ON public.crushes FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND target_id <> auth.uid() AND revealed = false);
CREATE POLICY "Delete own crush" ON public.crushes FOR DELETE TO authenticated USING (sender_id = auth.uid());

CREATE TABLE public.market_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 80),
  description text CHECK (char_length(description) <= 500),
  price numeric NOT NULL CHECK (price >= 0 AND price <= 10000000),
  category text NOT NULL DEFAULT 'other',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_listings TO authenticated;
GRANT ALL ON public.market_listings TO service_role;
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members browse listings" ON public.market_listings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Sell as self" ON public.market_listings FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Edit own listing" ON public.market_listings FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Delete own listing" ON public.market_listings FOR DELETE TO authenticated USING (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.bounties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  deposit numeric NOT NULL,
  remaining numeric NOT NULL,
  per_follow numeric NOT NULL DEFAULT 10,
  followers_paid integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bounties TO authenticated;
GRANT ALL ON public.bounties TO service_role;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see bounties" ON public.bounties FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- shared spend helper (internal)
CREATE OR REPLACE FUNCTION public._wallet_spend(_uid uuid, _amt numeric, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(_uid::text, 0));
  IF public.wallet_balance(_uid) < _amt THEN RAISE EXCEPTION 'Insufficient balance — top up your wallet'; END IF;
  INSERT INTO public.wallet_transactions(user_id, type, amount, counterparty, note) VALUES (_uid, 'send', _amt, 'Primegram', _note);
END $$;
REVOKE ALL ON FUNCTION public._wallet_spend(uuid, numeric, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.prime_boost(_post_id uuid, _tier text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _price numeric; _views int; _place text; _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM posts WHERE id = _post_id AND user_id = _uid) THEN RAISE EXCEPTION 'You can only boost your own posts'; END IF;
  CASE _tier
    WHEN 'starter' THEN _price := 30; _views := 300; _place := 'feed';
    WHEN 'explore' THEN _price := 100; _views := 1500; _place := 'explore_top';
    WHEN 'trending' THEN _price := 300; _views := 5000; _place := 'trending_kisumu';
    ELSE RAISE EXCEPTION 'Unknown boost';
  END CASE;
  PERFORM public._wallet_spend(_uid, _price, 'Boost: ' || _tier);
  INSERT INTO post_boosts(post_id, user_id, tier, price, target_views, placement) VALUES (_post_id, _uid, _tier, _price, _views, _place) RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.prime_subscribe(_tier text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _price numeric; _exp timestamptz;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  CASE _tier WHEN 'blue' THEN _price := 199; WHEN 'gold' THEN _price := 499; WHEN 'black' THEN _price := 999; ELSE RAISE EXCEPTION 'Unknown tier'; END CASE;
  PERFORM public._wallet_spend(_uid, _price, 'Prime Verified ' || _tier);
  INSERT INTO prime_subscriptions(user_id, tier, price) VALUES (_uid, _tier, _price) RETURNING expires_at INTO _exp;
  RETURN _exp;
END $$;

CREATE OR REPLACE FUNCTION public.prime_tier(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tier FROM prime_subscriptions WHERE user_id = _user_id AND expires_at > now()
  ORDER BY CASE tier WHEN 'black' THEN 3 WHEN 'gold' THEN 2 ELSE 1 END DESC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.prime_tip(_recipient uuid, _amount numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _amt numeric := round(_amount, 2); _net numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _amt NOT IN (5,20,50,100,500,1000) THEN RAISE EXCEPTION 'Pick a tip amount'; END IF;
  IF _recipient = _uid OR NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = _recipient) THEN RAISE EXCEPTION 'Invalid creator'; END IF;
  PERFORM public._wallet_spend(_uid, _amt, 'Tip');
  _net := round(_amt * 0.95, 2);
  INSERT INTO wallet_transactions(user_id, type, amount, counterparty, note)
  VALUES (_recipient, 'receive', _net, (SELECT username FROM profiles WHERE user_id = _uid), 'Tip (5% fee)');
  RETURN _net;
END $$;

CREATE OR REPLACE FUNCTION public.my_crushes()
RETURNS TABLE(id uuid, sender_username text, sender_avatar text, revealed boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id,
    CASE WHEN c.revealed THEN p.username END,
    CASE WHEN c.revealed THEN p.avatar_url END,
    c.revealed, c.created_at
  FROM crushes c LEFT JOIN profiles p ON p.user_id = c.sender_id
  WHERE c.target_id = auth.uid() ORDER BY c.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.crush_reveal(_crush_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _sender uuid;
BEGIN
  SELECT sender_id INTO _sender FROM crushes WHERE id = _crush_id AND target_id = _uid AND revealed = false;
  IF _sender IS NULL THEN RAISE EXCEPTION 'Crush not found'; END IF;
  PERFORM public._wallet_spend(_uid, 30, 'Crush reveal');
  UPDATE crushes SET revealed = true WHERE id = _crush_id;
  RETURN (SELECT username FROM profiles WHERE user_id = _sender);
END $$;

CREATE OR REPLACE FUNCTION public.bounty_create(_deposit numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _amt numeric := round(_deposit, 2); _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _amt < 100 OR _amt > 100000 THEN RAISE EXCEPTION 'Deposit between 100 and 100,000 KES'; END IF;
  PERFORM public._wallet_spend(_uid, _amt, 'Bounty escrow');
  INSERT INTO bounties(creator_id, deposit, remaining) VALUES (_uid, _amt, _amt) RETURNING id INTO _id;
  RETURN _id;
END $$;

-- pay new followers from active bounty: follower gets 9, platform keeps 1 (10%)
CREATE OR REPLACE FUNCTION public.bounty_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _b bounties%ROWTYPE;
BEGIN
  SELECT * INTO _b FROM bounties WHERE creator_id = NEW.following_id AND active AND remaining >= per_follow ORDER BY created_at LIMIT 1 FOR UPDATE;
  IF FOUND AND NOT EXISTS (SELECT 1 FROM wallet_transactions WHERE user_id = NEW.follower_id AND note = 'Bounty ' || _b.id::text) THEN
    UPDATE bounties SET remaining = remaining - per_follow, followers_paid = followers_paid + 1,
      active = (remaining - per_follow) >= per_follow WHERE id = _b.id;
    INSERT INTO wallet_transactions(user_id, type, amount, counterparty, note)
    VALUES (NEW.follower_id, 'receive', round(_b.per_follow * 0.9, 2), (SELECT username FROM profiles WHERE user_id = _b.creator_id), 'Bounty ' || _b.id::text);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.bounty_on_follow() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER follows_bounty AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.bounty_on_follow();

REVOKE ALL ON FUNCTION public.prime_boost(uuid,text), public.prime_subscribe(text), public.prime_tier(uuid), public.prime_tip(uuid,numeric), public.my_crushes(), public.crush_reveal(uuid), public.bounty_create(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prime_boost(uuid,text), public.prime_subscribe(text), public.prime_tier(uuid), public.prime_tip(uuid,numeric), public.my_crushes(), public.crush_reveal(uuid), public.bounty_create(numeric) TO authenticated;
