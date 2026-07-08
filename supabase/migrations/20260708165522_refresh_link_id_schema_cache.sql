/*
# Force PostgREST schema cache refresh for link_id column

The link_id column was added but PostgREST's schema cache hasn't picked it up.
This migration re-adds the column (idempotent) and recreates the index to force a schema refresh.
*/

ALTER TABLE files ADD COLUMN IF NOT EXISTS link_id text;

DROP INDEX IF EXISTS files_link_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS files_link_id_key ON files (link_id) WHERE link_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
