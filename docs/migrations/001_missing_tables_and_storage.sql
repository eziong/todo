-- Migration: Create missing tables (notifications, sns_accounts, sns_reminders)
-- and Supabase Storage bucket (assets)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
--
-- Pre-check: These tables should NOT exist yet.
-- If any already exist, skip the relevant CREATE TABLE block.

-- =============================================================
-- 1. Notifications (Phase 11)
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source      text NOT NULL CHECK (source IN ('youtube', 'github', 'build', 'system')),
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  url         text,
  entity_id   text,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx
  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx
  ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS notifications_user_source_idx
  ON notifications(user_id, source);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can manage their own notifications'
  ) THEN
    CREATE POLICY "Users can manage their own notifications"
      ON notifications FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================================
-- 2. SNS Accounts (Phase 12)
-- =============================================================
CREATE TABLE IF NOT EXISTS sns_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform    text NOT NULL CHECK (platform IN ('twitter', 'instagram', 'threads', 'tiktok', 'other')),
  handle      text NOT NULL,
  profile_url text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sns_accounts_user_id_idx
  ON sns_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS sns_accounts_user_platform_handle_idx
  ON sns_accounts(user_id, platform, handle);

ALTER TABLE sns_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sns_accounts' AND policyname = 'Users can manage their own sns accounts'
  ) THEN
    CREATE POLICY "Users can manage their own sns accounts"
      ON sns_accounts FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================================
-- 3. SNS Reminders (Phase 12)
-- =============================================================
CREATE TABLE IF NOT EXISTS sns_reminders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id    uuid REFERENCES contents(id) ON DELETE CASCADE,
  platform      text NOT NULL,
  scheduled_at  timestamptz NOT NULL,
  template_text text,
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reminded', 'done', 'skipped')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sns_reminders_user_id_idx
  ON sns_reminders(user_id);
CREATE INDEX IF NOT EXISTS sns_reminders_content_id_idx
  ON sns_reminders(content_id);
CREATE INDEX IF NOT EXISTS sns_reminders_user_status_idx
  ON sns_reminders(user_id, status);

ALTER TABLE sns_reminders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sns_reminders' AND policyname = 'Users can manage their own sns reminders'
  ) THEN
    CREATE POLICY "Users can manage their own sns reminders"
      ON sns_reminders FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================================
-- 4. Supabase Storage: assets bucket (public)
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Authenticated users can upload assets'
  ) THEN
    CREATE POLICY "Authenticated users can upload assets"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow authenticated users to update their uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Authenticated users can update assets'
  ) THEN
    CREATE POLICY "Authenticated users can update assets"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'assets' AND auth.uid() = owner)
      WITH CHECK (bucket_id = 'assets' AND auth.uid() = owner);
  END IF;
END $$;

-- Allow authenticated users to delete their uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Authenticated users can delete assets'
  ) THEN
    CREATE POLICY "Authenticated users can delete assets"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'assets' AND auth.uid() = owner);
  END IF;
END $$;

-- Allow public read access (bucket is public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Public read access for assets'
  ) THEN
    CREATE POLICY "Public read access for assets"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'assets');
  END IF;
END $$;

-- =============================================================
-- Verification queries (run after migration)
-- =============================================================
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
--
-- SELECT * FROM storage.buckets WHERE id = 'assets';
--
-- SELECT tablename, policyname FROM pg_policies
--   WHERE tablename IN ('notifications', 'sns_accounts', 'sns_reminders')
--   ORDER BY tablename;
