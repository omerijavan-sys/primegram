-- Likes
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view likes" ON public.post_likes
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like as themselves" ON public.post_likes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON public.post_likes
FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX post_likes_post_idx ON public.post_likes(post_id);

-- Comments
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view comments" ON public.post_comments
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can comment as themselves" ON public.post_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.post_comments
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX post_comments_post_created_idx ON public.post_comments(post_id, created_at DESC);

CREATE TRIGGER post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Keep posts.likes_count in sync
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSE
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_post_likes_count() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER post_likes_count_sync
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();