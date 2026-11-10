-- Music attached to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_title text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_artist text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_art_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_youtube_id text;
COMMENT ON COLUMN public.posts.music_title IS 'Background track title attached by the creator (empty = no track)';

-- Live view counter and adult-content flag on posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_adult boolean NOT NULL DEFAULT false;

-- Server-side record of 18+ verification on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adult_verified_at timestamptz;

-- Count a view once per call; called from the client when a post opens.
CREATE OR REPLACE FUNCTION public.register_post_view(_post_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _views integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  UPDATE public.posts SET views_count = views_count + 1 WHERE id = _post_id RETURNING views_count INTO _views;
  RETURN COALESCE(_views, 0);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.register_post_view(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.register_post_view(uuid) TO authenticated;

-- Age gate: stores verification server-side only when the date of birth shows 18+.
CREATE OR REPLACE FUNCTION public.verify_adult(_dob date)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _age integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _dob IS NULL THEN RETURN false; END IF;
  _age := date_part('year', age(_dob));
  IF _age < 18 OR _dob > current_date THEN RETURN false; END IF;
  UPDATE public.profiles SET adult_verified_at = now() WHERE user_id = auth.uid();
  RETURN true;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.verify_adult(date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.verify_adult(date) TO authenticated;

-- Adult posts are only visible to members the server has recorded as 18+ (or their creator).
DROP POLICY IF EXISTS "Members can view posts" ON public.posts;
CREATE POLICY "Members can view posts" ON public.posts FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    NOT posts.is_adult
    OR posts.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.adult_verified_at IS NOT NULL
    )
  )
);