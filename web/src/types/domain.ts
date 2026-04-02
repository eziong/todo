// Domain types (camelCase, branded IDs)
// Mapped from database row types via service layer

import type {
  TodoId,
  ProjectId,
  TagId,
  InboxItemId,
  BuildId,
  BuildCommandId,
  ActivityLogId,
  NoteId,
  NoteFolderId,
  LinkId,
  DescriptionTemplateId,
  ContentId,
  ContentChecklistId,
  ContentStageDataId,
  UserId,
  YouTubeChannelId,
  AssetId,
  SponsorshipId,
  NotificationId,
} from './branded'
import type {
  TodoStatus,
  TodoPriority,
  BuildStatus,
  RecurringFrequency,
  ActivityAction,
  ActivityEntityType,
  LinkCategory,
  ContentType,
  ContentStage,
  ContentPlatform,
  AssetStorageType,
  SponsorshipStatus,
  NotificationSource,
  WebhookMethod,
} from './database'

// Re-export union types for convenience
export type { TodoStatus, TodoPriority, BuildStatus, RecurringFrequency, LinkCategory, ContentType, ContentStage, ContentPlatform, AssetStorageType, SponsorshipStatus, NotificationSource, WebhookMethod }

// --- Domain Entities ---

export interface Tag {
  id: TagId
  userId: UserId
  name: string
  color: string | null
  createdAt: string
}

export type ProjectFeature = 'tasks' | 'builds' | 'content' | 'assets' | 'youtube' | 'revenue' | 'notes' | 'links'

export type ProjectTemplateId = 'dev' | 'youtube' | 'content' | 'general'

export interface ProjectTemplate {
  id: ProjectTemplateId
  name: string
  description: string
  features: ProjectFeature[]
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'dev',
    name: 'Dev Project',
    description: 'Software development with builds and assets',
    features: ['tasks', 'builds', 'assets', 'notes', 'links'],
  },
  {
    id: 'youtube',
    name: 'YouTube Channel',
    description: 'YouTube content pipeline with analytics and revenue',
    features: ['tasks', 'content', 'assets', 'youtube', 'revenue', 'notes', 'links'],
  },
  {
    id: 'content',
    name: 'Content / Blog',
    description: 'Content creation with asset management',
    features: ['tasks', 'content', 'assets', 'notes', 'links'],
  },
  {
    id: 'general',
    name: 'General',
    description: 'Simple project with tasks, notes, and links',
    features: ['tasks', 'notes', 'links'],
  },
]

export interface Project {
  id: ProjectId
  userId: UserId
  name: string
  description: string | null
  color: string | null
  icon: string | null
  archived: boolean
  position: number | null
  githubRepo: string | null
  features: ProjectFeature[]
  createdAt: string
  updatedAt: string
}

export interface Todo {
  id: TodoId
  userId: UserId
  title: string
  description: string | null
  status: TodoStatus
  priority: TodoPriority
  dueDate: string | null
  projectId: ProjectId | null
  parentId: TodoId | null
  position: number | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InboxItem {
  id: InboxItemId
  userId: UserId
  content: string
  createdAt: string
  processed: boolean
  processedTo: 'todo' | null
  processedId: string | null
}

export interface Build {
  id: BuildId
  projectId: ProjectId
  buildCommandId: BuildCommandId | null
  buildNumber: number
  status: BuildStatus
  command: string | null
  log: string | null
  startedAt: string | null
  finishedAt: string | null
  notes: string | null
  createdAt: string
}

export interface BuildCommand {
  id: BuildCommandId
  projectId: ProjectId
  label: string
  url: string
  method: WebhookMethod
  headers: Record<string, string>
  bodyTemplate: string | null
  position: number | null
}

export interface ActivityLog {
  id: ActivityLogId
  userId: UserId
  action: ActivityAction
  entityType: ActivityEntityType
  entityId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

// --- View Types (domain + computed/joined fields) ---

export interface TodoWithProject extends Todo {
  project: Pick<Project, 'id' | 'name' | 'color'> | null
}

export interface ProjectWithStats extends Project {
  todoCount: number
  completedCount: number
}

// --- Input Types (for create/update) ---

export interface CreateTodoInput {
  title: string
  description?: string
  status?: TodoStatus
  priority?: TodoPriority
  dueDate?: string
  projectId?: string
  parentId?: string
  position?: number
}

export interface UpdateTodoInput {
  title?: string
  description?: string | null
  status?: TodoStatus
  priority?: TodoPriority
  dueDate?: string | null
  projectId?: string | null
  position?: number
}

export interface CreateProjectInput {
  name: string
  description?: string
  color?: string
  icon?: string
  githubRepo?: string
  features?: ProjectFeature[]
}

export interface UpdateProjectInput {
  name?: string
  description?: string | null
  color?: string | null
  icon?: string | null
  archived?: boolean
  position?: number
  githubRepo?: string | null
  features?: ProjectFeature[]
}

export interface CreateInboxItemInput {
  content: string
}

export interface ProcessInboxItemInput {
  processedTo: 'todo'
  title?: string
  projectId?: string
}

// --- Build View Types ---

export interface BuildWithProject extends Build {
  projectName: string
  projectColor: string | null
}

// --- Build Input Types ---

export interface CreateBuildInput {
  projectId: string
  command?: string
  notes?: string
  buildCommandId?: string
}

export interface CreateBuildCommandInput {
  label: string
  url: string
  method?: WebhookMethod
  headers?: Record<string, string>
  bodyTemplate?: string
  position?: number
}

export interface UpdateBuildCommandInput {
  label?: string
  url?: string
  method?: WebhookMethod
  headers?: Record<string, string>
  bodyTemplate?: string
  position?: number
}

// --- Filter Types ---

export interface TodoFilters {
  status?: TodoStatus
  priority?: TodoPriority
  projectId?: string
  hasDueDate?: boolean
  search?: string
}

// ===================================================================
// Phase 6: Notes & Links
// ===================================================================

// --- Note Domain Entities ---

export interface NoteFolder {
  id: NoteFolderId
  userId: UserId
  name: string
  parentId: NoteFolderId | null
  position: number | null
  createdAt: string
}

export interface Note {
  id: NoteId
  userId: UserId
  folderId: NoteFolderId | null
  projectId: ProjectId | null
  title: string
  content: string | null
  pinned: boolean
  createdAt: string
  updatedAt: string
}

// --- Note View Types ---

export interface NoteWithFolder extends Note {
  folderName: string | null
}

// --- Note Input Types ---

export interface CreateNoteInput {
  title: string
  content?: string
  folderId?: string
  projectId?: string
  pinned?: boolean
}

export interface UpdateNoteInput {
  title?: string
  content?: string | null
  folderId?: string | null
  projectId?: string | null
  pinned?: boolean
}

export interface CreateNoteFolderInput {
  name: string
  parentId?: string
  position?: number
}

export interface UpdateNoteFolderInput {
  name?: string
  parentId?: string | null
  position?: number
}

// --- Note Filter Types ---

export interface NoteFilters {
  folderId?: string
  projectId?: string
  pinned?: boolean
  search?: string
}

// --- Link Domain Entities ---

export interface Link {
  id: LinkId
  userId: UserId
  projectId: ProjectId | null
  label: string
  url: string
  category: LinkCategory | null
  clickCount: number
  position: number | null
  createdAt: string
}

export interface DescriptionTemplate {
  id: DescriptionTemplateId
  userId: UserId
  name: string
  content: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// --- Link Input Types ---

export interface CreateLinkInput {
  label: string
  url: string
  category?: LinkCategory
  position?: number
  projectId?: string
}

export interface UpdateLinkInput {
  label?: string
  url?: string
  category?: LinkCategory | null
  position?: number
  projectId?: string | null
}

export interface LinkFilters {
  category?: LinkCategory
  projectId?: string
}

export interface CreateDescriptionTemplateInput {
  name: string
  content: string
  isDefault?: boolean
}

export interface UpdateDescriptionTemplateInput {
  name?: string
  content?: string
  isDefault?: boolean
}

// ===================================================================
// Phase 7: Content Pipeline
// ===================================================================

// --- Content Domain Entities ---

export interface Content {
  id: ContentId
  userId: UserId
  projectId: ProjectId | null
  title: string
  type: ContentType
  stage: ContentStage
  platform: ContentPlatform
  noteId: NoteId | null
  youtubeVideoId: string | null
  scheduledAt: string | null
  publishedAt: string | null
  templateId: DescriptionTemplateId | null
  tags: string[]
  position: number | null
  createdAt: string
  updatedAt: string
}

export interface ReorderContentItem {
  id: string
  stage: ContentStage
  position: number
}

export interface ContentChecklist {
  id: ContentChecklistId
  contentId: ContentId
  stage: ContentStage
  label: string
  checked: boolean
  position: number | null
}

export interface ContentStageData {
  id: ContentStageDataId
  contentId: ContentId
  stage: ContentStage
  description: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

// --- Content View Types ---

export interface ContentWithDetails extends Content {
  projectName: string | null
  projectColor: string | null
  noteTitle: string | null
  checklists: ContentChecklist[]
  stageData: ContentStageData[]
}

// --- Content Input Types ---

export interface CreateContentInput {
  title: string
  type?: ContentType
  stage?: ContentStage
  platform?: ContentPlatform
  projectId?: string
  noteId?: string
  templateId?: string
  scheduledAt?: string
  tags?: string[]
}

export interface UpdateContentInput {
  title?: string
  type?: ContentType
  stage?: ContentStage
  platform?: ContentPlatform
  projectId?: string | null
  noteId?: string | null
  templateId?: string | null
  scheduledAt?: string | null
  publishedAt?: string | null
  tags?: string[]
  youtubeVideoId?: string | null
}

export interface CreateContentChecklistInput {
  contentId: string
  stage?: ContentStage
  label: string
  position?: number
}

export interface UpsertStageDataInput {
  description?: string | null
}

export interface UpdateContentChecklistInput {
  label?: string
  checked?: boolean
  position?: number
}

// --- Content Filter Types ---

export interface ContentFilters {
  stage?: ContentStage
  type?: ContentType
  platform?: ContentPlatform
  projectId?: string
  search?: string
}

// ===================================================================
// Phase 8: YouTube Integration
// ===================================================================

// --- YouTube Domain Entities ---

export type YouTubePrivacyStatus = 'public' | 'unlisted' | 'private'

export interface YouTubeChannel {
  id: YouTubeChannelId
  userId: UserId
  channelId: string
  channelTitle: string | null
  subscriberCount: number | null
  videoCount: number | null
  viewCount: number | null
  thumbnailUrl: string | null
  syncedAt: string
}

export interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
  privacyStatus: YouTubePrivacyStatus
  tags: string[]
}

export interface YouTubeComment {
  commentId: string
  videoId: string
  videoTitle: string
  authorName: string
  authorProfileUrl: string
  text: string
  likeCount: number
  publishedAt: string
  isOwnerReplied: boolean
  totalReplyCount: number
  replies: YouTubeCommentReply[]
}

export interface YouTubeCommentReply {
  replyId: string
  authorName: string
  authorProfileUrl: string
  text: string
  likeCount: number
  publishedAt: string
}

// --- YouTube Response Types ---

export interface YouTubeVideoListResponse {
  videos: YouTubeVideo[]
  nextPageToken: string | null
  totalResults: number
}

export interface YouTubeCommentListResponse {
  comments: YouTubeComment[]
  nextPageToken: string | null
  totalResults: number
}

// --- YouTube Input Types ---

export interface UpdateVideoMetadataInput {
  title?: string
  description?: string
  tags?: string[]
  privacyStatus?: YouTubePrivacyStatus
}

export interface UploadVideoInput {
  title: string
  description?: string
  tags?: string[]
  privacyStatus?: YouTubePrivacyStatus
  contentId?: string
}

// --- Google Auth Types ---

export interface GoogleConnectionStatus {
  youtubeConnected: boolean
  driveConnected: boolean
  channelTitle: string | null
  channelId: string | null
  thumbnailUrl: string | null
  subscriberCount: number | null
  videoCount: number | null
}

export interface AvailableChannel {
  channelId: string
  title: string | null
  thumbnailUrl: string | null
  subscriberCount: number
  videoCount: number
}

// ===================================================================
// Phase 9: Assets & Storage
// ===================================================================

// --- Asset Domain Entities ---

export interface Asset {
  id: AssetId
  userId: UserId
  contentId: ContentId | null
  projectId: ProjectId | null
  filename: string
  mimeType: string
  sizeBytes: number
  storageType: AssetStorageType
  storagePath: string
  thumbnailUrl: string | null
  tags: string[]
  createdAt: string
}

// --- Asset Input Types ---

export interface CreateAssetInput {
  filename: string
  mimeType: string
  sizeBytes: number
  storageType: AssetStorageType
  storagePath: string
  thumbnailUrl?: string
  contentId?: string
  projectId?: string
  tags?: string[]
}

export interface UpdateAssetInput {
  filename?: string
  contentId?: string | null
  projectId?: string | null
  tags?: string[]
}

// --- Asset Filter Types ---

export interface AssetFilters {
  contentId?: string
  projectId?: string
  storageType?: AssetStorageType
  mimeType?: string
  search?: string
}

// --- Drive Types ---

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  thumbnailLink: string | null
  createdTime: string
}

// ===================================================================
// Phase 10: Revenue
// ===================================================================

// --- Sponsorship Domain Entities ---

export interface Sponsorship {
  id: SponsorshipId
  userId: UserId
  contentId: ContentId | null
  brand: string
  amount: number
  currency: string
  status: SponsorshipStatus
  contactInfo: string | null
  notes: string | null
  dueDate: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

// --- Sponsorship View Types ---

export interface SponsorshipWithContent extends Sponsorship {
  contentTitle: string | null
}

// --- Sponsorship Input Types ---

export interface CreateSponsorshipInput {
  brand: string
  amount: number
  currency?: string
  status?: SponsorshipStatus
  contentId?: string
  contactInfo?: string
  notes?: string
  dueDate?: string
}

export interface UpdateSponsorshipInput {
  brand?: string
  amount?: number
  currency?: string
  status?: SponsorshipStatus
  contentId?: string | null
  contactInfo?: string | null
  notes?: string | null
  dueDate?: string | null
  paidAt?: string | null
}

// --- Sponsorship Filter Types ---

export interface SponsorshipFilters {
  status?: SponsorshipStatus
  contentId?: string
  search?: string
}

// --- YouTube Analytics Types ---

export interface YouTubeMonthlyAnalytics {
  month: string
  estimatedRevenue: number
  views: number
  estimatedMinutesWatched: number
}

// --- Revenue Summary Types ---

export interface RevenueSummary {
  totalAdRevenue: number
  totalSponsorships: number
  totalRevenue: number
  paidCount: number
  pendingCount: number
}

// ===================================================================
// Phase 11: Notifications
// ===================================================================

// --- Notification Domain Entities ---

export interface Notification {
  id: NotificationId
  userId: UserId
  source: NotificationSource
  type: string
  title: string
  body: string | null
  url: string | null
  entityId: string | null
  read: boolean
  createdAt: string
}

// --- Notification Filter Types ---

export interface NotificationFilters {
  source?: NotificationSource
}

