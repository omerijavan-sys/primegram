CREATE TABLE public.reel_likes (id uuid primary key default gen_random_uuid(), reel_id uuid not null references public.reels(id) on delete cascade, user_id uuid not null default auth.uid(), created_at timestamptz not null default now(), unique(reel_id,user_id));
GRANT SELECT, INSERT, DELETE ON public.reel_likes TO authenticated;
GRANT ALL ON public.reel_likes TO service_role;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view reel likes" ON public.reel_likes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Like reels as self" ON public.reel_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unlike own" ON public.reel_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.reel_comments (id uuid primary key default gen_random_uuid(), reel_id uuid not null references public.reels(id) on delete cascade, user_id uuid not null default auth.uid(), content text not null, created_at timestamptz not null default now());
GRANT SELECT, INSERT, DELETE ON public.reel_comments TO authenticated;
GRANT ALL ON public.reel_comments TO service_role;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view reel comments" ON public.reel_comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Comment as self" ON public.reel_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND length(content) between 1 and 1000);
CREATE POLICY "Delete own reel comment" ON public.reel_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_reel_likes_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
  ELSE UPDATE public.reels SET likes_count = greatest(likes_count - 1, 0) WHERE id = OLD.reel_id; END IF;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.sync_reel_likes_count() FROM public, anon, authenticated;
CREATE TRIGGER reel_likes_count AFTER INSERT OR DELETE ON public.reel_likes FOR EACH ROW EXECUTE FUNCTION public.sync_reel_likes_count();