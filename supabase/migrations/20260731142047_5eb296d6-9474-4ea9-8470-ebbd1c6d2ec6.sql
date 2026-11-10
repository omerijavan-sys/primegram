-- Realtime broadcast: restrict listening to the user's own call topics
DROP POLICY IF EXISTS "Users receive own call realtime" ON realtime.messages;
CREATE POLICY "Users receive own call realtime"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = ('calls-' || (auth.uid())::text)
  OR realtime.topic() = ('call-' || (auth.uid())::text)
);

-- Realtime broadcast: only allow sending to well-formed personal call topics
DROP POLICY IF EXISTS "Authenticated can broadcast realtime" ON realtime.messages;
CREATE POLICY "Authenticated can broadcast to call topics"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    realtime.topic() ~ '^calls?-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  )
);

-- Media bucket: strict per-user folder ownership
DROP POLICY IF EXISTS "Users can upload to own folder in media" ON storage.objects;
CREATE POLICY "Users can upload to own folder in media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
  AND array_length(storage.foldername(name), 1) >= 1
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND name LIKE ((auth.uid())::text || '/%')
);

DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'media'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND name LIKE ((auth.uid())::text || '/%')
);

DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = (auth.uid())::text
);