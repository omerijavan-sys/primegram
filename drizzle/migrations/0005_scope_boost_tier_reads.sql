DROP POLICY IF EXISTS "Members see tiers" ON public.prime_subscriptions;
CREATE POLICY "Users see own tiers" ON public.prime_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Members see boosts" ON public.post_boosts;
CREATE POLICY "Users see own boosts" ON public.post_boosts FOR SELECT TO authenticated USING (auth.uid() = user_id);