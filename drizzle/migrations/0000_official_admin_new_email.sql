CREATE OR REPLACE FUNCTION public.grant_official_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) IN ('official@primegram.app', 'officialprimegram.app@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    UPDATE public.profiles
    SET username = 'primegram', display_name = 'Primegram', is_official = true, is_verified = true,
        bio = COALESCE(NULLIF(bio, ''), 'Official Primegram account. Created by Java prime · Sponsored by JP7 ULTRA.')
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_official_admin() FROM PUBLIC, anon, authenticated;

-- Apply to the already-existing confirmed account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) = 'officialprimegram.app@gmail.com' AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles p SET username = 'primegram', display_name = 'Primegram', is_official = true, is_verified = true
FROM auth.users u WHERE p.user_id = u.id AND lower(u.email) = 'officialprimegram.app@gmail.com' AND u.email_confirmed_at IS NOT NULL;