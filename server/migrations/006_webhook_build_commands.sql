-- Migration 006: Convert build_commands to webhook-based triggers
-- and add build_command_id FK to builds

-- 1. build_commands: Remove old columns, add webhook columns
ALTER TABLE build_commands DROP COLUMN IF EXISTS command;
ALTER TABLE build_commands DROP COLUMN IF EXISTS directory;
ALTER TABLE build_commands ADD COLUMN url text NOT NULL DEFAULT '';
ALTER TABLE build_commands ADD COLUMN method text NOT NULL DEFAULT 'POST'
  CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE'));
ALTER TABLE build_commands ADD COLUMN headers jsonb NOT NULL DEFAULT '{}';
ALTER TABLE build_commands ADD COLUMN body_template text;
ALTER TABLE build_commands ALTER COLUMN url DROP DEFAULT;

-- 2. builds: Add webhook config reference
ALTER TABLE builds ADD COLUMN build_command_id uuid
  REFERENCES build_commands(id) ON DELETE SET NULL;
CREATE INDEX builds_build_command_id_idx ON builds(build_command_id);
