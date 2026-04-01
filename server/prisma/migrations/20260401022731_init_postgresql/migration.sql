-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "github_repo" TEXT,
    "features" TEXT[] DEFAULT ARRAY['tasks', 'notes', 'links']::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'none',
    "due_date" TIMESTAMP(3),
    "project_id" TEXT,
    "parent_id" TEXT,
    "position" INTEGER,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_tags" (
    "todo_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "todo_tags_pkey" PRIMARY KEY ("todo_id","tag_id")
);

-- CreateTable
CREATE TABLE "inbox_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_to" TEXT,
    "processed_id" TEXT,

    CONSTRAINT "inbox_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_rules" (
    "id" TEXT NOT NULL,
    "todo_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "days_of_week" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "next_due" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_commands" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" JSONB NOT NULL DEFAULT '{}',
    "body_template" TEXT,
    "position" INTEGER,

    CONSTRAINT "build_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "build_command_id" TEXT,
    "build_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "command" TEXT,
    "log" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_folders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "position" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "description_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "description_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'video',
    "stage" TEXT NOT NULL DEFAULT 'idea',
    "platform" TEXT NOT NULL DEFAULT 'youtube',
    "note_id" TEXT,
    "youtube_video_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "template_id" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_checklists" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,

    CONSTRAINT "content_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL DEFAULT 'Bearer',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_channels" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "channel_title" TEXT,
    "subscriber_count" INTEGER,
    "video_count" INTEGER,
    "view_count" BIGINT,
    "thumbnail_url" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "youtube_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT,
    "project_id" TEXT,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "storage_type" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsorships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT,
    "brand" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "status" TEXT NOT NULL DEFAULT 'negotiating',
    "contact_info" TEXT,
    "notes" TEXT,
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT,
    "entity_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sns_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "profile_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sns_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sns_reminders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT,
    "platform" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "template_text" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sns_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tags_user_id_idx" ON "tags"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_name_idx" ON "tags"("user_id", "name");

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "projects_user_archived_idx" ON "projects"("user_id", "archived");

-- CreateIndex
CREATE INDEX "todos_user_id_idx" ON "todos"("user_id");

-- CreateIndex
CREATE INDEX "todos_user_status_idx" ON "todos"("user_id", "status");

-- CreateIndex
CREATE INDEX "todos_user_due_date_idx" ON "todos"("user_id", "due_date");

-- CreateIndex
CREATE INDEX "todos_project_id_idx" ON "todos"("project_id");

-- CreateIndex
CREATE INDEX "todos_parent_id_idx" ON "todos"("parent_id");

-- CreateIndex
CREATE INDEX "todos_user_priority_idx" ON "todos"("user_id", "priority");

-- CreateIndex
CREATE INDEX "todo_tags_tag_id_idx" ON "todo_tags"("tag_id");

-- CreateIndex
CREATE INDEX "inbox_items_user_id_idx" ON "inbox_items"("user_id");

-- CreateIndex
CREATE INDEX "inbox_items_user_processed_idx" ON "inbox_items"("user_id", "processed");

-- CreateIndex
CREATE INDEX "recurring_rules_todo_id_idx" ON "recurring_rules"("todo_id");

-- CreateIndex
CREATE INDEX "recurring_rules_next_due_idx" ON "recurring_rules"("next_due");

-- CreateIndex
CREATE INDEX "build_commands_project_id_idx" ON "build_commands"("project_id");

-- CreateIndex
CREATE INDEX "builds_project_id_idx" ON "builds"("project_id");

-- CreateIndex
CREATE INDEX "builds_project_status_idx" ON "builds"("project_id", "status");

-- CreateIndex
CREATE INDEX "builds_build_command_id_idx" ON "builds"("build_command_id");

-- CreateIndex
CREATE UNIQUE INDEX "builds_project_number_idx" ON "builds"("project_id", "build_number");

-- CreateIndex
CREATE INDEX "activity_log_user_id_idx" ON "activity_log"("user_id");

-- CreateIndex
CREATE INDEX "activity_log_user_created_idx" ON "activity_log"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_log_entity_idx" ON "activity_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "note_folders_user_id_idx" ON "note_folders"("user_id");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_folder_id_idx" ON "notes"("folder_id");

-- CreateIndex
CREATE INDEX "notes_project_id_idx" ON "notes"("project_id");

-- CreateIndex
CREATE INDEX "notes_user_pinned_idx" ON "notes"("user_id", "pinned");

-- CreateIndex
CREATE INDEX "links_user_id_idx" ON "links"("user_id");

-- CreateIndex
CREATE INDEX "links_project_id_idx" ON "links"("project_id");

-- CreateIndex
CREATE INDEX "links_user_category_idx" ON "links"("user_id", "category");

-- CreateIndex
CREATE INDEX "description_templates_user_id_idx" ON "description_templates"("user_id");

-- CreateIndex
CREATE INDEX "contents_user_id_idx" ON "contents"("user_id");

-- CreateIndex
CREATE INDEX "contents_user_stage_idx" ON "contents"("user_id", "stage");

-- CreateIndex
CREATE INDEX "contents_project_id_idx" ON "contents"("project_id");

-- CreateIndex
CREATE INDEX "contents_scheduled_at_idx" ON "contents"("scheduled_at");

-- CreateIndex
CREATE INDEX "content_checklists_content_id_idx" ON "content_checklists"("content_id");

-- CreateIndex
CREATE INDEX "google_tokens_user_id_idx" ON "google_tokens"("user_id");

-- CreateIndex
CREATE INDEX "google_tokens_project_id_idx" ON "google_tokens"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_tokens_user_id_project_id_service_key" ON "google_tokens"("user_id", "project_id", "service");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_channels_project_id_key" ON "youtube_channels"("project_id");

-- CreateIndex
CREATE INDEX "youtube_channels_user_id_idx" ON "youtube_channels"("user_id");

-- CreateIndex
CREATE INDEX "youtube_channels_project_id_idx" ON "youtube_channels"("project_id");

-- CreateIndex
CREATE INDEX "assets_user_id_idx" ON "assets"("user_id");

-- CreateIndex
CREATE INDEX "assets_content_id_idx" ON "assets"("content_id");

-- CreateIndex
CREATE INDEX "assets_project_id_idx" ON "assets"("project_id");

-- CreateIndex
CREATE INDEX "assets_storage_type_idx" ON "assets"("user_id", "storage_type");

-- CreateIndex
CREATE INDEX "sponsorships_user_id_idx" ON "sponsorships"("user_id");

-- CreateIndex
CREATE INDEX "sponsorships_content_id_idx" ON "sponsorships"("content_id");

-- CreateIndex
CREATE INDEX "sponsorships_status_idx" ON "sponsorships"("user_id", "status");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_user_source_idx" ON "notifications"("user_id", "source");

-- CreateIndex
CREATE INDEX "notifications_user_created_idx" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "sns_accounts_user_id_idx" ON "sns_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sns_accounts_user_platform_handle_idx" ON "sns_accounts"("user_id", "platform", "handle");

-- CreateIndex
CREATE INDEX "sns_reminders_user_id_idx" ON "sns_reminders"("user_id");

-- CreateIndex
CREATE INDEX "sns_reminders_content_id_idx" ON "sns_reminders"("content_id");

-- CreateIndex
CREATE INDEX "sns_reminders_user_status_idx" ON "sns_reminders"("user_id", "status");

-- CreateIndex
CREATE INDEX "change_history_user_created_idx" ON "change_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "change_history_user_table_record_idx" ON "change_history"("user_id", "table_name", "record_id");

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "todos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todo_tags" ADD CONSTRAINT "todo_tags_todo_id_fkey" FOREIGN KEY ("todo_id") REFERENCES "todos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todo_tags" ADD CONSTRAINT "todo_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_todo_id_fkey" FOREIGN KEY ("todo_id") REFERENCES "todos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_commands" ADD CONSTRAINT "build_commands_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_build_command_id_fkey" FOREIGN KEY ("build_command_id") REFERENCES "build_commands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_folders" ADD CONSTRAINT "note_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "note_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "note_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "description_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_checklists" ADD CONSTRAINT "content_checklists_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_tokens" ADD CONSTRAINT "google_tokens_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_channels" ADD CONSTRAINT "youtube_channels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sns_reminders" ADD CONSTRAINT "sns_reminders_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
