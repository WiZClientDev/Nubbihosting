/*
# Create files table and uploads storage bucket

1. New Tables
- `files`
  - `id` (text, primary key) — short random ID used in share links
  - `filename` (text, not null) — original uploaded file name
  - `filepath` (text, not null) — path inside the `uploads` storage bucket
  - `file_size` (bigint, nullable) — size of the file in bytes
  - `mime_type` (text, nullable) — detected content type of the file
  - `downloads` (integer, default 0) — count of times the file has been downloaded
  - `created_at` (timestamptz, default now()) — when the file was uploaded
2. New Storage
- Create the `uploads` storage bucket (public) so uploaded files can be read by anyone with the share link.
3. Security
- Enable RLS on `files`.
- This is a single-tenant, no-sign-in file-sharing app, so all CRUD is intentionally public (anon + authenticated) so the anon-key frontend can insert file records and anyone can look them up by share-link ID.
- Storage bucket policies allow public read + insert for anon/authenticated.
4. Important Notes
- No user_id / auth ownership: anyone with a share link can view and download.
- Download counter is incremented via an UPDATE policy on anon/authenticated.
- Bucket is public so `getPublicUrl` works for downloads.
*/

CREATE TABLE IF NOT EXISTS files (
  id text PRIMARY KEY,
  filename text NOT NULL,
  filepath text NOT NULL,
  file_size bigint,
  mime_type text,
  downloads integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_files" ON files;
CREATE POLICY "anon_select_files" ON files FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_files" ON files;
CREATE POLICY "anon_insert_files" ON files FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_files" ON files;
CREATE POLICY "anon_update_files" ON files FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_files" ON files;
CREATE POLICY "anon_delete_files" ON files FOR DELETE
TO anon, authenticated USING (true);

-- Storage bucket (public so share links resolve without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies
DROP POLICY IF EXISTS "anon_upload_uploads" ON storage.objects;
CREATE POLICY "anon_upload_uploads" ON storage.objects FOR INSERT
TO anon, authenticated WITH CHECK (bucket_id = 'uploads');

DROP POLICY IF EXISTS "anon_read_uploads" ON storage.objects;
CREATE POLICY "anon_read_uploads" ON storage.objects FOR SELECT
TO anon, authenticated USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "anon_delete_uploads" ON storage.objects;
CREATE POLICY "anon_delete_uploads" ON storage.objects FOR DELETE
TO anon, authenticated USING (bucket_id = 'uploads');