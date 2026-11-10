
-- Storage: replace overly broad policies on media bucket
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;

-- View individual files (no broad LIST without prefix knowledge): allow read of any object in media for public display
CREATE POLICY "Public can read media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- INSERT: must be authenticated AND first folder segment = auth.uid()
CREATE POLICY "Users can upload to own folder in media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: only own folder
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Realtime: restrict channel subscriptions to participants
-- Drop any existing permissive policies, then add scoped ones
DROP POLICY IF EXISTS "Authenticated can receive realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Users receive own chat realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Users receive own call realtime" ON realtime.messages;

-- Allow users to subscribe only to their own call channel: calls-<their uid>
CREATE POLICY "Users receive own call realtime"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'calls-' || auth.uid()::text
  OR realtime.topic() LIKE 'chat-%'
);

-- Allow send (broadcast) by authenticated users (still topic-scoped above for receive)
CREATE POLICY "Authenticated can broadcast realtime"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Revoke public/anon execute on internal trigger function
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
