// Branded (nominal) types for type-safe entity IDs
// Usage: const id = TodoId('abc-123')

type Brand<T, B extends string> = T & { readonly __brand: B }

// Entity ID types
export type TodoId = Brand<string, 'TodoId'>
export type ProjectId = Brand<string, 'ProjectId'>
export type TagId = Brand<string, 'TagId'>
export type InboxItemId = Brand<string, 'InboxItemId'>
export type BuildId = Brand<string, 'BuildId'>
export type BuildCommandId = Brand<string, 'BuildCommandId'>
export type ActivityLogId = Brand<string, 'ActivityLogId'>
export type RecurringRuleId = Brand<string, 'RecurringRuleId'>
export type NoteId = Brand<string, 'NoteId'>
export type NoteFolderId = Brand<string, 'NoteFolderId'>
export type LinkId = Brand<string, 'LinkId'>
export type DescriptionTemplateId = Brand<string, 'DescriptionTemplateId'>
export type ContentId = Brand<string, 'ContentId'>
export type ContentStageDataId = Brand<string, 'ContentStageDataId'>
export type UserId = Brand<string, 'UserId'>
export type YouTubeChannelId = Brand<string, 'YouTubeChannelId'>
export type AssetId = Brand<string, 'AssetId'>
export type SponsorshipId = Brand<string, 'SponsorshipId'>
export type NotificationId = Brand<string, 'NotificationId'>

// Factory functions
export const TodoId = (id: string): TodoId => id as TodoId
export const ProjectId = (id: string): ProjectId => id as ProjectId
export const TagId = (id: string): TagId => id as TagId
export const InboxItemId = (id: string): InboxItemId => id as InboxItemId
export const BuildId = (id: string): BuildId => id as BuildId
export const BuildCommandId = (id: string): BuildCommandId => id as BuildCommandId
export const ActivityLogId = (id: string): ActivityLogId => id as ActivityLogId
export const RecurringRuleId = (id: string): RecurringRuleId => id as RecurringRuleId
export const NoteId = (id: string): NoteId => id as NoteId
export const NoteFolderId = (id: string): NoteFolderId => id as NoteFolderId
export const LinkId = (id: string): LinkId => id as LinkId
export const DescriptionTemplateId = (id: string): DescriptionTemplateId => id as DescriptionTemplateId
export const ContentId = (id: string): ContentId => id as ContentId
export const ContentStageDataId = (id: string): ContentStageDataId => id as ContentStageDataId
export const UserId = (id: string): UserId => id as UserId
export const YouTubeChannelId = (id: string): YouTubeChannelId => id as YouTubeChannelId
export const AssetId = (id: string): AssetId => id as AssetId
export const SponsorshipId = (id: string): SponsorshipId => id as SponsorshipId
export const NotificationId = (id: string): NotificationId => id as NotificationId
