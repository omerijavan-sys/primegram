-- Guests (anonymous sign-ins) must not pass the same rules as signed-in members.
-- One restrictive policy per app table: anonymous sessions fail every command.
CREATE POLICY "block_anonymous_sessions" ON public.bounties AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.crushes AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.follows AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.market_listings AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.messages AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.mpesa_topups AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.post_boosts AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.post_comments AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.post_likes AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.posts AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.prime_subscriptions AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.reels AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.reports AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.security_audit_log AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.user_roles AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "block_anonymous_sessions" ON public.wallet_transactions AS RESTRICTIVE FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

-- Posts and reels are member-visible content (like profiles): signed-in, non-guest users only.
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Members can view posts" ON public.posts FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Anyone can view reels" ON public.reels;
CREATE POLICY "Members can view reels" ON public.reels FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Post comments are member-visible: signed-in, non-guest users only.
DROP POLICY IF EXISTS "Signed-in users can view comments" ON public.post_comments;
CREATE POLICY "Members can view comments" ON public.post_comments FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Likes are private to their owner; the UI only ever reads the caller's own likes.
DROP POLICY IF EXISTS "Signed-in users can view likes" ON public.post_likes;
CREATE POLICY "Users can view own likes" ON public.post_likes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Media files: reading through the Storage API is bound to the file's owner
-- (public bucket URLs keep working without this policy).
DROP POLICY IF EXISTS "Authenticated can read media files" ON storage.objects;
CREATE POLICY "Users can read own media files" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND auth.uid() IS NOT NULL
    AND (auth.jwt() ->> 'role') = 'authenticated'
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );