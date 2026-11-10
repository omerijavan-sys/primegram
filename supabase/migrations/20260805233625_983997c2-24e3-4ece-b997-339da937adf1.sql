DROP POLICY IF EXISTS "Authenticated can read media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

CREATE POLICY "Authenticated can read media files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media' AND auth.uid() IS NOT NULL AND (auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media' AND auth.uid() IS NOT NULL AND (auth.jwt() ->> 'role') = 'authenticated'
  AND owner = auth.uid() AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'media' AND auth.uid() IS NOT NULL AND (auth.jwt() ->> 'role') = 'authenticated'
  AND owner = auth.uid() AND (storage.foldername(name))[1] = auth.uid()::text
  AND name LIKE auth.uid()::text || '/%'
);

CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND auth.uid() IS NOT NULL AND (auth.jwt() ->> 'role') = 'authenticated'
  AND owner = auth.uid() AND (storage.foldername(name))[1] = auth.uid()::text
);