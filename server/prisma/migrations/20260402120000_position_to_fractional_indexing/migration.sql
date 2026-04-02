-- Convert position columns from Int to String for fractional indexing

-- Step 1: Add temporary string columns
ALTER TABLE "projects" ADD COLUMN "position_new" TEXT;
ALTER TABLE "todos" ADD COLUMN "position_new" TEXT;
ALTER TABLE "build_commands" ADD COLUMN "position_new" TEXT;
ALTER TABLE "note_folders" ADD COLUMN "position_new" TEXT;
ALTER TABLE "links" ADD COLUMN "position_new" TEXT;
ALTER TABLE "contents" ADD COLUMN "position_new" TEXT;

-- Step 2: Backfill — convert integer positions to fractional index strings
-- Using alphabetic keys: 'a0', 'a1', 'a2', ... for existing sequential positions
-- The fractional-indexing library uses this format, so these are valid keys

-- Projects: group by user_id
UPDATE "projects" SET "position_new" = 'a' || lpad(position::text, 4, '0')
WHERE "position" IS NOT NULL;

-- Todos: group by user_id + content context
UPDATE "todos" SET "position_new" = 'a' || lpad(position::text, 4, '0')
WHERE "position" IS NOT NULL;

-- Build commands: group by project_id
UPDATE "build_commands" SET "position_new" = 'a' || lpad(position::text, 4, '0')
WHERE "position" IS NOT NULL;

-- Note folders: group by user_id
UPDATE "note_folders" SET "position_new" = 'a' || lpad(position::text, 4, '0')
WHERE "position" IS NOT NULL;

-- Links: group by project_id
UPDATE "links" SET "position_new" = 'a' || lpad(position::text, 4, '0')
WHERE "position" IS NOT NULL;

-- Contents: group by user_id + stage
UPDATE "contents" SET "position_new" = 'a' || lpad(position::text, 4, '0')
WHERE "position" IS NOT NULL;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE "projects" DROP COLUMN "position";
ALTER TABLE "projects" RENAME COLUMN "position_new" TO "position";

ALTER TABLE "todos" DROP COLUMN "position";
ALTER TABLE "todos" RENAME COLUMN "position_new" TO "position";

ALTER TABLE "build_commands" DROP COLUMN "position";
ALTER TABLE "build_commands" RENAME COLUMN "position_new" TO "position";

ALTER TABLE "note_folders" DROP COLUMN "position";
ALTER TABLE "note_folders" RENAME COLUMN "position_new" TO "position";

ALTER TABLE "links" DROP COLUMN "position";
ALTER TABLE "links" RENAME COLUMN "position_new" TO "position";

ALTER TABLE "contents" DROP COLUMN "position";
ALTER TABLE "contents" RENAME COLUMN "position_new" TO "position";
