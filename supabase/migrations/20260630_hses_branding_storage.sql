-- Make the hses-branding bucket public so logo URLs are accessible without auth.
-- Run this in the Supabase SQL editor if the bucket was created as private.

UPDATE storage.buckets
SET public = true
WHERE id = 'hses-branding';

-- Allow public (anonymous + authenticated) read access to objects in this bucket.
DROP POLICY IF EXISTS "hses-branding public read" ON storage.objects;
CREATE POLICY "hses-branding public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'hses-branding');
