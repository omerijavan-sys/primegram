DROP POLICY "Members view reel likes" ON public.reel_likes;
CREATE POLICY "Members view reel likes" ON public.reel_likes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
DROP POLICY "Members view reel comments" ON public.reel_comments;
CREATE POLICY "Members view reel comments" ON public.reel_comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);