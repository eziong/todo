-- =============================================================
-- Personal Command Center - Database Schema
-- Supabase PostgreSQL with RLS
-- =============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- =============================================================
-- Helper: updated_at trigger function
-- =============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================
-- Tables
-- =============================================================

-- -------------------------------------------------------------
-- Tags
-- -------------------------------------------------------------
create table tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text,
  created_at timestamptz not null default now()
);

create unique index tags_user_name_idx on tags(user_id, name);
create index tags_user_id_idx on tags(user_id);

-- -------------------------------------------------------------
-- Projects
-- -------------------------------------------------------------
create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  color       text,
  icon        text,
  archived    boolean not null default false,
  position    integer,
  github_repo text,
  features    text[] not null default '{tasks,ideas,notes,links}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index projects_user_id_idx on projects(user_id);
create index projects_user_archived_idx on projects(user_id, archived);

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at_column();

-- -------------------------------------------------------------
-- Todos
-- -------------------------------------------------------------
create table todos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  status       text not null default 'todo'
    check (status in ('todo', 'in_progress', 'completed')),
  priority     text not null default 'none'
    check (priority in ('urgent', 'high', 'medium', 'low', 'none')),
  due_date     date,
  project_id   uuid references projects(id) on delete set null,
  parent_id    uuid references todos(id) on delete cascade,
  position     integer,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index todos_user_id_idx on todos(user_id);
create index todos_user_status_idx on todos(user_id, status);
create index todos_user_due_date_idx on todos(user_id, due_date);
create index todos_project_id_idx on todos(project_id);
create index todos_parent_id_idx on todos(parent_id);
create index todos_user_priority_idx on todos(user_id, priority);

create trigger todos_updated_at
  before update on todos
  for each row execute function update_updated_at_column();

-- -------------------------------------------------------------
-- Todo Tags (junction)
-- -------------------------------------------------------------
create table todo_tags (
  todo_id uuid not null references todos(id) on delete cascade,
  tag_id  uuid not null references tags(id) on delete cascade,
  primary key (todo_id, tag_id)
);

create index todo_tags_tag_id_idx on todo_tags(tag_id);

-- -------------------------------------------------------------
-- Inbox Items
-- -------------------------------------------------------------
create table inbox_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content       text not null,
  created_at    timestamptz not null default now(),
  processed     boolean not null default false,
  processed_to  text check (processed_to in ('todo', 'idea')),
  processed_id  uuid
);

create index inbox_items_user_id_idx on inbox_items(user_id);
create index inbox_items_user_processed_idx on inbox_items(user_id, processed);

-- -------------------------------------------------------------
-- Recurring Rules
-- -------------------------------------------------------------
create table recurring_rules (
  id           uuid primary key default gen_random_uuid(),
  todo_id      uuid not null references todos(id) on delete cascade,
  frequency    text not null
    check (frequency in ('daily', 'weekly', 'monthly', 'custom')),
  interval     integer not null default 1,
  days_of_week integer[],
  next_due     date,
  created_at   timestamptz not null default now()
);

create index recurring_rules_todo_id_idx on recurring_rules(todo_id);
create index recurring_rules_next_due_idx on recurring_rules(next_due);

-- -------------------------------------------------------------
-- Build Commands (per project)
-- -------------------------------------------------------------
create table build_commands (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  label         text not null,
  url           text not null,
  method        text not null default 'POST'
    check (method in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  headers       jsonb not null default '{}',
  body_template text,
  position      integer
);

create index build_commands_project_id_idx on build_commands(project_id);

-- -------------------------------------------------------------
-- Builds
-- -------------------------------------------------------------
create table builds (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id) on delete cascade,
  build_command_id uuid references build_commands(id) on delete set null,
  build_number     integer not null,
  status           text not null default 'pending'
    check (status in ('pending', 'running', 'success', 'failed')),
  command          text,
  log              text,
  started_at       timestamptz,
  finished_at      timestamptz,
  notes            text,
  created_at       timestamptz not null default now()
);

create index builds_project_id_idx on builds(project_id);
create index builds_project_status_idx on builds(project_id, status);
create unique index builds_project_number_idx on builds(project_id, build_number);
create index builds_build_command_id_idx on builds(build_command_id);

-- -------------------------------------------------------------
-- Ideas
-- -------------------------------------------------------------
create table ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'new'
    check (status in ('new', 'considering', 'planned', 'implemented', 'rejected')),
  build_id    uuid references builds(id) on delete set null,
  position    integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index ideas_user_id_idx on ideas(user_id);
create index ideas_project_id_idx on ideas(project_id);
create index ideas_user_status_idx on ideas(user_id, status);

create trigger ideas_updated_at
  before update on ideas
  for each row execute function update_updated_at_column();

-- -------------------------------------------------------------
-- Build Ideas (junction)
-- -------------------------------------------------------------
create table build_ideas (
  build_id uuid not null references builds(id) on delete cascade,
  idea_id  uuid not null references ideas(id) on delete cascade,
  primary key (build_id, idea_id)
);

create index build_ideas_idea_id_idx on build_ideas(idea_id);

-- -------------------------------------------------------------
-- Activity Log
-- -------------------------------------------------------------
create table activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  action      text not null
    check (action in ('created', 'completed', 'moved', 'built', 'deleted')),
  entity_type text not null
    check (entity_type in ('todo', 'idea', 'build', 'project')),
  entity_id   uuid,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

create index activity_log_user_id_idx on activity_log(user_id);
create index activity_log_user_created_idx on activity_log(user_id, created_at desc);
create index activity_log_entity_idx on activity_log(entity_type, entity_id);

-- -------------------------------------------------------------
-- Note Folders
-- -------------------------------------------------------------
create table note_folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  parent_id   uuid references note_folders(id) on delete cascade,
  position    integer,
  created_at  timestamptz not null default now()
);

create index note_folders_user_id_idx on note_folders(user_id);

-- -------------------------------------------------------------
-- Notes
-- -------------------------------------------------------------
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  folder_id   uuid references note_folders(id) on delete set null,
  project_id  uuid references projects(id) on delete set null,
  title       text not null,
  content     text,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index notes_user_id_idx on notes(user_id);
create index notes_folder_id_idx on notes(folder_id);
create index notes_project_id_idx on notes(project_id);
create index notes_user_pinned_idx on notes(user_id, pinned);

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at_column();

-- -------------------------------------------------------------
-- Links
-- -------------------------------------------------------------
create table links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  label       text not null,
  url         text not null,
  category    text check (category in ('affiliate', 'social', 'resource', 'other')),
  click_count integer not null default 0,
  position    integer,
  created_at  timestamptz not null default now()
);

create index links_user_id_idx on links(user_id);
create index links_project_id_idx on links(project_id);
create index links_user_category_idx on links(user_id, category);

-- -------------------------------------------------------------
-- Description Templates
-- -------------------------------------------------------------
create table description_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  content     text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index description_templates_user_id_idx on description_templates(user_id);

create trigger description_templates_updated_at
  before update on description_templates
  for each row execute function update_updated_at_column();

-- -------------------------------------------------------------
-- Contents (Phase 7)
-- -------------------------------------------------------------
create table contents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  project_id      uuid references projects(id) on delete set null,
  title           text not null,
  description     text,
  type            text not null default 'video'
    check (type in ('video', 'short', 'post', 'blog')),
  stage           text not null default 'idea'
    check (stage in ('idea', 'research', 'script', 'filming', 'editing', 'thumbnail', 'upload_ready', 'published', 'promoting')),
  platform        text not null default 'youtube'
    check (platform in ('youtube', 'instagram', 'twitter', 'blog', 'other')),
  note_id         uuid references notes(id) on delete set null,
  youtube_video_id text,
  scheduled_at    timestamptz,
  published_at    timestamptz,
  template_id     uuid references description_templates(id) on delete set null,
  tags            text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index contents_user_id_idx on contents(user_id);
create index contents_user_stage_idx on contents(user_id, stage);
create index contents_project_id_idx on contents(project_id);
create index contents_scheduled_at_idx on contents(scheduled_at);

create trigger contents_updated_at
  before update on contents
  for each row execute function update_updated_at_column();

-- -------------------------------------------------------------
-- Content Checklists (Phase 7)
-- -------------------------------------------------------------
create table content_checklists (
  id          uuid primary key default gen_random_uuid(),
  content_id  uuid not null references contents(id) on delete cascade,
  label       text not null,
  checked     boolean not null default false,
  position    integer
);

create index content_checklists_content_id_idx on content_checklists(content_id);

-- =============================================================
-- Row Level Security
-- =============================================================

-- Enable RLS on all tables
alter table tags enable row level security;
alter table projects enable row level security;
alter table todos enable row level security;
alter table todo_tags enable row level security;
alter table inbox_items enable row level security;
alter table recurring_rules enable row level security;
alter table build_commands enable row level security;
alter table builds enable row level security;
alter table ideas enable row level security;
alter table build_ideas enable row level security;
alter table activity_log enable row level security;

-- ----- Tags -----
create policy "Users can manage their own tags"
  on tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Projects -----
create policy "Users can manage their own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Todos -----
create policy "Users can manage their own todos"
  on todos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Todo Tags (junction: RLS via parent todo's user_id) -----
create policy "Users can manage tags on their own todos"
  on todo_tags for all
  using (
    exists (
      select 1 from todos
      where todos.id = todo_tags.todo_id
        and todos.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from todos
      where todos.id = todo_tags.todo_id
        and todos.user_id = auth.uid()
    )
  );

-- ----- Inbox Items -----
create policy "Users can manage their own inbox items"
  on inbox_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Recurring Rules (RLS via parent todo's user_id) -----
create policy "Users can manage recurring rules on their own todos"
  on recurring_rules for all
  using (
    exists (
      select 1 from todos
      where todos.id = recurring_rules.todo_id
        and todos.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from todos
      where todos.id = recurring_rules.todo_id
        and todos.user_id = auth.uid()
    )
  );

-- ----- Build Commands (RLS via parent project's user_id) -----
create policy "Users can manage build commands on their own projects"
  on build_commands for all
  using (
    exists (
      select 1 from projects
      where projects.id = build_commands.project_id
        and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from projects
      where projects.id = build_commands.project_id
        and projects.user_id = auth.uid()
    )
  );

-- ----- Builds (RLS via parent project's user_id) -----
create policy "Users can manage builds on their own projects"
  on builds for all
  using (
    exists (
      select 1 from projects
      where projects.id = builds.project_id
        and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from projects
      where projects.id = builds.project_id
        and projects.user_id = auth.uid()
    )
  );

-- ----- Ideas -----
create policy "Users can manage their own ideas"
  on ideas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Build Ideas (junction: RLS via parent build's project's user_id) -----
create policy "Users can manage ideas linked to their own builds"
  on build_ideas for all
  using (
    exists (
      select 1 from builds
      join projects on projects.id = builds.project_id
      where builds.id = build_ideas.build_id
        and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from builds
      join projects on projects.id = builds.project_id
      where builds.id = build_ideas.build_id
        and projects.user_id = auth.uid()
    )
  );

-- ----- Activity Log -----
create policy "Users can manage their own activity log"
  on activity_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Note Folders -----
alter table note_folders enable row level security;
create policy "Users can manage their own note folders"
  on note_folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Notes -----
alter table notes enable row level security;
create policy "Users can manage their own notes"
  on notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Links -----
alter table links enable row level security;
create policy "Users can manage their own links"
  on links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Description Templates -----
alter table description_templates enable row level security;
create policy "Users can manage their own description templates"
  on description_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Contents -----
alter table contents enable row level security;
create policy "Users can manage their own contents"
  on contents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Content Checklists (RLS via parent content's user_id) -----
alter table content_checklists enable row level security;
create policy "Users can manage checklists on their own contents"
  on content_checklists for all
  using (
    exists (
      select 1 from contents
      where contents.id = content_checklists.content_id
        and contents.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from contents
      where contents.id = content_checklists.content_id
        and contents.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- Google Tokens (Phase 8 — server-side only)
-- -------------------------------------------------------------
create table google_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade unique,
  access_token    text not null,
  refresh_token   text not null,
  token_type      text not null default 'Bearer',
  expires_at      timestamptz not null,
  scopes          text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index google_tokens_user_id_idx on google_tokens(user_id);

create trigger google_tokens_updated_at
  before update on google_tokens
  for each row execute function update_updated_at_column();

-- -------------------------------------------------------------
-- YouTube Channels (Phase 8 — cache)
-- -------------------------------------------------------------
create table youtube_channels (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade unique,
  channel_id        text not null,
  channel_title     text,
  subscriber_count  integer,
  video_count       integer,
  view_count        bigint,
  thumbnail_url     text,
  synced_at         timestamptz not null default now()
);

create index youtube_channels_user_id_idx on youtube_channels(user_id);

-- -------------------------------------------------------------
-- Assets (Phase 9)
-- -------------------------------------------------------------
create table assets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content_id    uuid references contents(id) on delete set null,
  project_id    uuid references projects(id) on delete set null,
  filename      text not null,
  mime_type     text not null,
  size_bytes    bigint not null,
  storage_type  text not null check (storage_type in ('supabase', 'google_drive')),
  storage_path  text not null,
  thumbnail_url text,
  tags          text[],
  created_at    timestamptz not null default now()
);

create index assets_user_id_idx on assets(user_id);
create index assets_content_id_idx on assets(content_id);
create index assets_project_id_idx on assets(project_id);
create index assets_storage_type_idx on assets(user_id, storage_type);

-- ----- Google Tokens -----
alter table google_tokens enable row level security;
create policy "Users can manage their own google tokens"
  on google_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- YouTube Channels -----
alter table youtube_channels enable row level security;
create policy "Users can manage their own youtube channels"
  on youtube_channels for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- Assets -----
alter table assets enable row level security;
create policy "Users can manage their own assets"
  on assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Sponsorships (Phase 10)
-- -------------------------------------------------------------
create table sponsorships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content_id    uuid references contents(id) on delete set null,
  brand         text not null,
  amount        decimal(10,2) not null,
  currency      text not null default 'KRW',
  status        text not null default 'negotiating'
    check (status in ('negotiating', 'confirmed', 'delivered', 'paid', 'cancelled')),
  contact_info  text,
  notes         text,
  due_date      date,
  paid_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index sponsorships_user_id_idx on sponsorships(user_id);
create index sponsorships_content_id_idx on sponsorships(content_id);
create index sponsorships_status_idx on sponsorships(user_id, status);

create trigger sponsorships_updated_at
  before update on sponsorships
  for each row execute function update_updated_at_column();

-- ----- Sponsorships -----
alter table sponsorships enable row level security;
create policy "Users can manage their own sponsorships"
  on sponsorships for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Notifications (Phase 11)
-- -------------------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  source      text not null check (source in ('youtube', 'github', 'build', 'system')),
  type        text not null,
  title       text not null,
  body        text,
  url         text,
  entity_id   text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_id_idx on notifications(user_id);
create index notifications_user_read_idx on notifications(user_id, read);
create index notifications_user_source_idx on notifications(user_id, source);
create index notifications_user_created_idx on notifications(user_id, created_at desc);

-- ----- Notifications -----
alter table notifications enable row level security;
create policy "Users can manage their own notifications"
  on notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- SNS Accounts (Phase 12)
-- -------------------------------------------------------------
create table sns_accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  platform    text not null check (platform in ('twitter', 'instagram', 'threads', 'tiktok', 'other')),
  handle      text not null,
  profile_url text,
  created_at  timestamptz not null default now()
);

create index sns_accounts_user_id_idx on sns_accounts(user_id);
create unique index sns_accounts_user_platform_handle_idx on sns_accounts(user_id, platform, handle);

-- -------------------------------------------------------------
-- SNS Reminders (Phase 12)
-- -------------------------------------------------------------
create table sns_reminders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content_id    uuid references contents(id) on delete cascade,
  platform      text not null,
  scheduled_at  timestamptz not null,
  template_text text,
  status        text not null default 'pending'
    check (status in ('pending', 'reminded', 'done', 'skipped')),
  created_at    timestamptz not null default now()
);

create index sns_reminders_user_id_idx on sns_reminders(user_id);
create index sns_reminders_content_id_idx on sns_reminders(content_id);
create index sns_reminders_user_status_idx on sns_reminders(user_id, status);

-- ----- SNS Accounts -----
alter table sns_accounts enable row level security;
create policy "Users can manage their own sns accounts"
  on sns_accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----- SNS Reminders -----
alter table sns_reminders enable row level security;
create policy "Users can manage their own sns reminders"
  on sns_reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
