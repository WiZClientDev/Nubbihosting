/*
# Add link_id column to files table

1. Changes
- Add `link_id` (text, nullable) to `files`.
  - When a user picks "auto", link_id stays NULL and the share link uses the existing `id` (short random ID).
  - When a user picks "filename" or a custom name, link_id is set to a URL-safe slug and the share link uses it instead.
- Add a unique index on `link_id` so two uploads can't claim the same custom link.
2. Security
- No policy changes. Existing anon/authenticated CRUD policies already cover the new column.
3. Important Notes
- `id` remains the primary key and the storage path key; `link_id` only affects the share URL.
- The download page will look up by `link_id` first, then fall back to `id` so old links keep working.
*/

ALTER TABLE files ADD COLUMN IF NOT EXISTS link_id text;

CREATE UNIQUE INDEX IF NOT EXISTS files_link_id_key ON files (link_id) WHERE link_id IS NOT NULL;
