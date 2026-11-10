DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Signed-in users can view follows" ON public.follows FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Signed-in users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);