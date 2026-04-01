-- 1. notifications table
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

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS notifications_user_source_idx ON notifications(user_id, source);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can manage their own notifications') THEN
    CREATE POLICY "Users can manage their own notifications"
      ON notifications FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 2. sns_accounts table
CREATE TABLE IF NOT EXISTS sns_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform    text NOT NULL CHECK (platform IN ('twitter', 'instagram', 'threads', 'tiktok', 'other')),
  handle      text NOT NULL,
  profile_url text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sns_accounts_user_id_idx ON sns_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS sns_accounts_user_platform_handle_idx ON sns_accounts(user_id, platform, handle);

ALTER TABLE sns_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sns_accounts' AND policyname = 'Users can manage their own sns accounts') THEN
    CREATE POLICY "Users can manage their own sns accounts"
      ON sns_accounts FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. sns_reminders table
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

CREATE INDEX IF NOT EXISTS sns_reminders_user_id_idx ON sns_reminders(user_id);
CREATE INDEX IF NOT EXISTS sns_reminders_content_id_idx ON sns_reminders(content_id);
CREATE INDEX IF NOT EXISTS sns_reminders_user_status_idx ON sns_reminders(user_id, status);

ALTER TABLE sns_reminders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sns_reminders' AND policyname = 'Users can manage their own sns reminders') THEN
    CREATE POLICY "Users can manage their own sns reminders"
      ON sns_reminders FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
