// Raw database row types matching schema.sql (snake_case)
// These types represent the exact shape of data from Supabase

export interface TagRow {
  id: string
  user_id: string
  name: string
  color: string | null
  created_at: string
}

export interface ProjectRow {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  archived: boolean
  position: string | null
  github_repo: string | null
  created_at: string
  updated_at: string
}

export type TodoStatus = 'todo' | 'in_progress' | 'completed'
export type TodoPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

export interface TodoRow {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TodoStatus
  priority: TodoPriority
  due_date: string | null
  project_id: string | null
  parent_id: string | null
  position: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TodoTagRow {
  todo_id: string
  tag_id: string
}

export interface InboxItemRow {
  id: string
  user_id: string
  content: string
  created_at: string
  processed: boolean
  processed_to: 'todo' | null
  processed_id: string | null
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface RecurringRuleRow {
  id: string
  todo_id: string
  frequency: RecurringFrequency
  interval: number
  days_of_week: number[] | null
  next_due: string | null
  created_at: string
}

export type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface BuildCommandRow {
  id: string
  project_id: string
  label: string
  url: string
  method: WebhookMethod
  headers: Record<string, string>
  body_template: string | null
  position: string | null
}

export type BuildStatus = 'pending' | 'running' | 'success' | 'failed'

export interface BuildRow {
  id: string
  project_id: string
  build_command_id: string | null
  build_number: number
  status: BuildStatus
  command: string | null
  log: string | null
  started_at: string | null
  finished_at: string | null
  notes: string | null
  created_at: string
}

// --- Phase 6: Notes & Links ---

export interface NoteFolderRow {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  position: string | null
  created_at: string
}

export interface NoteRow {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  content: string | null
  pinned: boolean
  created_at: string
  updated_at: string
}

export type LinkCategory = 'affiliate' | 'social' | 'resource' | 'other'

export interface LinkRow {
  id: string
  user_id: string
  label: string
  url: string
  category: LinkCategory | null
  click_count: number
  position: string | null
  created_at: string
}

export interface DescriptionTemplateRow {
  id: string
  user_id: string
  name: string
  content: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// --- Phase 7: Content Pipeline ---

export type ContentType = 'video' | 'short' | 'post' | 'blog'
export type ContentStage = 'idea' | 'drafting' | 'editing' | 'review' | 'published'
export type ContentPlatform = 'youtube' | 'instagram' | 'twitter' | 'blog' | 'other'

export interface ContentRow {
  id: string
  user_id: string
  project_id: string | null
  title: string
  type: ContentType
  stage: ContentStage
  platform: ContentPlatform
  note_id: string | null
  youtube_video_id: string | null
  scheduled_at: string | null
  published_at: string | null
  template_id: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

// --- Phase 8: YouTube Integration ---

export interface GoogleTokenRow {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  token_type: string
  expires_at: string
  scopes: string[]
  created_at: string
  updated_at: string
}

export interface YouTubeChannelRow {
  id: string
  user_id: string
  channel_id: string
  channel_title: string | null
  subscriber_count: number | null
  video_count: number | null
  view_count: number | null
  thumbnail_url: string | null
  synced_at: string
}

// --- Phase 9: Assets ---

export type AssetStorageType = 'local' | 'google_drive'

export interface AssetRow {
  id: string
  user_id: string
  content_id: string | null
  project_id: string | null
  filename: string
  mime_type: string
  size_bytes: number
  storage_type: AssetStorageType
  storage_path: string
  thumbnail_url: string | null
  tags: string[] | null
  created_at: string
}

// --- Phase 10: Revenue ---

export type SponsorshipStatus = 'negotiating' | 'confirmed' | 'delivered' | 'paid' | 'cancelled'

export interface SponsorshipRow {
  id: string
  user_id: string
  content_id: string | null
  brand: string
  amount: number
  currency: string
  status: SponsorshipStatus
  contact_info: string | null
  notes: string | null
  due_date: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

// --- Phase 11: Notifications ---

export type NotificationSource = 'youtube' | 'build' | 'system'

export interface NotificationRow {
  id: string
  user_id: string
  source: NotificationSource
  type: string
  title: string
  body: string | null
  url: string | null
  entity_id: string | null
  read: boolean
  created_at: string
}

export type ActivityAction = 'created' | 'completed' | 'moved' | 'built' | 'deleted'
export type ActivityEntityType = 'todo' | 'build' | 'project'

export interface ActivityLogRow {
  id: string
  user_id: string
  action: ActivityAction
  entity_type: ActivityEntityType
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}
