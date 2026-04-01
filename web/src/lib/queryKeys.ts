import type { TodoId, ProjectId, BuildId, BuildCommandId, NoteId, LinkId, DescriptionTemplateId, ContentId, AssetId, SponsorshipId, NotificationId } from '@/types/branded'
import type { TodoFilters, NoteFilters, LinkFilters, ContentFilters, AssetFilters, SponsorshipFilters, NotificationFilters } from '@/types/domain'

export const queryKeys = {
  todos: {
    all: ['todos'] as const,
    lists: () => [...queryKeys.todos.all, 'list'] as const,
    list: (filters?: TodoFilters) => [...queryKeys.todos.lists(), filters] as const,
    details: () => [...queryKeys.todos.all, 'detail'] as const,
    detail: (id: TodoId) => [...queryKeys.todos.details(), id] as const,
  },
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (archived?: boolean) => [...queryKeys.projects.lists(), { archived }] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: ProjectId) => [...queryKeys.projects.details(), id] as const,
  },
  inbox: {
    all: ['inbox'] as const,
    lists: () => [...queryKeys.inbox.all, 'list'] as const,
    list: (processed?: boolean) => [...queryKeys.inbox.lists(), { processed }] as const,
  },
  builds: {
    all: ['builds'] as const,
    lists: () => [...queryKeys.builds.all, 'list'] as const,
    list: (projectId?: ProjectId) => [...queryKeys.builds.lists(), { projectId }] as const,
    details: () => [...queryKeys.builds.all, 'detail'] as const,
    detail: (id: BuildId) => [...queryKeys.builds.details(), id] as const,
  },
  buildCommands: {
    all: ['buildCommands'] as const,
    lists: () => [...queryKeys.buildCommands.all, 'list'] as const,
    list: (projectId?: ProjectId) => [...queryKeys.buildCommands.lists(), { projectId }] as const,
  },
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
  },
  activity: {
    all: ['activity'] as const,
    lists: () => [...queryKeys.activity.all, 'list'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
  },
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    list: (filters?: NoteFilters) => [...queryKeys.notes.lists(), filters] as const,
    details: () => [...queryKeys.notes.all, 'detail'] as const,
    detail: (id: NoteId) => [...queryKeys.notes.details(), id] as const,
  },
  noteFolders: {
    all: ['noteFolders'] as const,
    lists: () => [...queryKeys.noteFolders.all, 'list'] as const,
  },
  links: {
    all: ['links'] as const,
    lists: () => [...queryKeys.links.all, 'list'] as const,
    list: (filters?: LinkFilters) => [...queryKeys.links.lists(), filters] as const,
  },
  descriptionTemplates: {
    all: ['descriptionTemplates'] as const,
    lists: () => [...queryKeys.descriptionTemplates.all, 'list'] as const,
    details: () => [...queryKeys.descriptionTemplates.all, 'detail'] as const,
    detail: (id: DescriptionTemplateId) => [...queryKeys.descriptionTemplates.details(), id] as const,
  },
  contents: {
    all: ['contents'] as const,
    lists: () => [...queryKeys.contents.all, 'list'] as const,
    list: (filters?: ContentFilters) => [...queryKeys.contents.lists(), filters] as const,
    details: () => [...queryKeys.contents.all, 'detail'] as const,
    detail: (id: ContentId) => [...queryKeys.contents.details(), id] as const,
  },
  contentChecklists: {
    all: ['contentChecklists'] as const,
    lists: () => [...queryKeys.contentChecklists.all, 'list'] as const,
    list: (contentId: ContentId) => [...queryKeys.contentChecklists.lists(), contentId] as const,
  },
  youtube: {
    all: ['youtube'] as const,
    channel: (projectId: string) => [...queryKeys.youtube.all, 'channel', projectId] as const,
    videos: (projectId: string) => [...queryKeys.youtube.all, 'videos', projectId] as const,
    videoList: (projectId: string, pageToken?: string, search?: string) =>
      [...queryKeys.youtube.videos(projectId), { pageToken, search }] as const,
    videoDetail: (projectId: string, videoId: string) => [...queryKeys.youtube.videos(projectId), videoId] as const,
    comments: (projectId: string, videoId: string) => [...queryKeys.youtube.all, 'comments', projectId, videoId] as const,
    availableChannels: (projectId: string) => [...queryKeys.youtube.all, 'availableChannels', projectId] as const,
  },
  googleAuth: {
    all: ['googleAuth'] as const,
    connection: (projectId: string) => [...queryKeys.googleAuth.all, 'connection', projectId] as const,
  },
  assets: {
    all: ['assets'] as const,
    lists: () => [...queryKeys.assets.all, 'list'] as const,
    list: (filters?: AssetFilters) => [...queryKeys.assets.lists(), filters] as const,
    details: () => [...queryKeys.assets.all, 'detail'] as const,
    detail: (id: AssetId) => [...queryKeys.assets.details(), id] as const,
  },
  drive: {
    all: ['drive'] as const,
    files: (projectId: string) => [...queryKeys.drive.all, 'files', projectId] as const,
    fileList: (projectId: string, options?: { pageToken?: string; mimeType?: string }) =>
      [...queryKeys.drive.files(projectId), options] as const,
  },
  sponsorships: {
    all: ['sponsorships'] as const,
    lists: () => [...queryKeys.sponsorships.all, 'list'] as const,
    list: (filters?: SponsorshipFilters) => [...queryKeys.sponsorships.lists(), filters] as const,
    details: () => [...queryKeys.sponsorships.all, 'detail'] as const,
    detail: (id: SponsorshipId) => [...queryKeys.sponsorships.details(), id] as const,
  },
  revenue: {
    all: ['revenue'] as const,
    analytics: (projectId: string, year?: number) => [...queryKeys.revenue.all, 'analytics', projectId, year] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: NotificationFilters) => [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
  backup: {
    all: ['backup'] as const,
    info: () => [...queryKeys.backup.all, 'info'] as const,
  },
  undo: {
    all: ['undo'] as const,
    history: (limit?: number) => [...queryKeys.undo.all, 'history', limit] as const,
  },
} as const
