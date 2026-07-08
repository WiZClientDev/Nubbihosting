/*
# Fix missing storage upload policy

1. Issue
- The `anon_upload_uploads` INSERT policy on `storage.objects` for the `uploads` bucket was missing, causing file uploads to fail silently.
2. Fix
- Re-create the INSERT policy allowing anon + authenticated to upload objects to the `uploads` bucket.
3. No schema changes
- Table structure unchanged.
*/

DROP POLICY IF EXISTS "anon_upload_uploads" ON storage.objects;
CREATE POLICY "anon_upload_uploads" ON storage.objects FOR INSERT
TO anon, authenticated WITH CHECK (bucket_id = 'uploads');