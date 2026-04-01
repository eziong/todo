import { Injectable, NotFoundException } from '@nestjs/common';
import { google, type youtube_v3 } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';

export interface YouTubeVideoResponse {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  privacyStatus: string;
  tags: string[];
}

export interface YouTubeVideoListResponse {
  videos: YouTubeVideoResponse[];
  nextPageToken: string | null;
  totalResults: number;
}

export interface YouTubeCommentReplyResponse {
  replyId: string;
  authorName: string;
  authorProfileUrl: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

export interface YouTubeCommentResponse {
  commentId: string;
  videoId: string;
  videoTitle: string;
  authorName: string;
  authorProfileUrl: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  isOwnerReplied: boolean;
  totalReplyCount: number;
  replies: YouTubeCommentReplyResponse[];
}

export interface YouTubeCommentListResponse {
  comments: YouTubeCommentResponse[];
  nextPageToken: string | null;
  totalResults: number;
}

export interface ChannelStatsResponse {
  channelId: string;
  channelTitle: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string | null;
  syncedAt: string;
}

export interface AvailableChannelResponse {
  channelId: string;
  title: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
}

@Injectable()
export class YouTubeService {
  constructor(private prisma: PrismaService) {}

  private getYouTubeClient(accessToken: string): youtube_v3.Youtube {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.youtube({ version: 'v3', auth: oauth2Client });
  }

  async fetchChannelStats(
    accessToken: string,
    projectId: string,
  ): Promise<ChannelStatsResponse> {
    // Check cache (5 minutes)
    const cached = await this.prisma.youtube_channels.findUnique({
      where: { project_id: projectId },
    });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (cached && cached.synced_at > fiveMinutesAgo) {
      return {
        channelId: cached.channel_id,
        channelTitle: cached.channel_title,
        subscriberCount: cached.subscriber_count ?? 0,
        videoCount: cached.video_count ?? 0,
        viewCount: Number(cached.view_count ?? 0),
        thumbnailUrl: cached.thumbnail_url,
        syncedAt: cached.synced_at.toISOString(),
      };
    }

    // If we have a cached channel_id, fetch that specific channel
    if (cached) {
      const yt = this.getYouTubeClient(accessToken);
      const res = await yt.channels.list({
        part: ['snippet', 'statistics'],
        id: [cached.channel_id],
      });

      const channel = res.data.items?.[0];
      if (!channel) {
        // Channel was deleted on YouTube — clean up stale DB entry
        await this.prisma.youtube_channels.delete({
          where: { project_id: projectId },
        });
        throw new NotFoundException('YouTube channel not found');
      }

      const stats = {
        channelId: channel.id ?? '',
        channelTitle: channel.snippet?.title ?? null,
        subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
        videoCount: Number(channel.statistics?.videoCount ?? 0),
        viewCount: Number(channel.statistics?.viewCount ?? 0),
        thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? null,
      };

      // Update cache
      await this.prisma.youtube_channels.update({
        where: { project_id: projectId },
        data: {
          channel_title: stats.channelTitle,
          subscriber_count: stats.subscriberCount,
          video_count: stats.videoCount,
          view_count: BigInt(stats.viewCount),
          thumbnail_url: stats.thumbnailUrl,
          synced_at: new Date(),
        },
      });

      return { ...stats, syncedAt: new Date().toISOString() };
    }

    // No cached channel — use mine=true (fallback for single-channel accounts)
    const yt = this.getYouTubeClient(accessToken);
    const res = await yt.channels.list({
      part: ['snippet', 'statistics'],
      mine: true,
    });

    const channel = res.data.items?.[0];
    if (!channel) {
      throw new NotFoundException('YouTube channel not found');
    }

    return {
      channelId: channel.id ?? '',
      channelTitle: channel.snippet?.title ?? null,
      subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
      videoCount: Number(channel.statistics?.videoCount ?? 0),
      viewCount: Number(channel.statistics?.viewCount ?? 0),
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? null,
      syncedAt: new Date().toISOString(),
    };
  }

  async listAvailableChannels(
    accessToken: string,
  ): Promise<AvailableChannelResponse[]> {
    const yt = this.getYouTubeClient(accessToken);
    const res = await yt.channels.list({
      part: ['snippet', 'statistics'],
      mine: true,
      maxResults: 50,
    });

    return (res.data.items ?? []).map((ch) => ({
      channelId: ch.id ?? '',
      title: ch.snippet?.title ?? null,
      thumbnailUrl: ch.snippet?.thumbnails?.default?.url ?? null,
      subscriberCount: Number(ch.statistics?.subscriberCount ?? 0),
      videoCount: Number(ch.statistics?.videoCount ?? 0),
    }));
  }

  async searchChannels(
    accessToken: string,
    query: string,
  ): Promise<AvailableChannelResponse[]> {
    const yt = this.getYouTubeClient(accessToken);

    const searchRes = await yt.search.list({
      part: ['snippet'],
      q: query,
      type: ['channel'],
      maxResults: 10,
    });

    const channelIds = (searchRes.data.items ?? [])
      .map((item) => item.snippet?.channelId)
      .filter((id): id is string => Boolean(id));

    if (channelIds.length === 0) return [];

    const channelsRes = await yt.channels.list({
      part: ['snippet', 'statistics'],
      id: channelIds,
    });

    return (channelsRes.data.items ?? []).map((ch) => ({
      channelId: ch.id ?? '',
      title: ch.snippet?.title ?? null,
      thumbnailUrl: ch.snippet?.thumbnails?.default?.url ?? null,
      subscriberCount: Number(ch.statistics?.subscriberCount ?? 0),
      videoCount: Number(ch.statistics?.videoCount ?? 0),
    }));
  }

  async selectChannel(
    userId: string,
    projectId: string,
    channelId: string,
    accessToken: string,
  ): Promise<ChannelStatsResponse> {
    // Fetch channel details from YouTube API
    const yt = this.getYouTubeClient(accessToken);
    const res = await yt.channels.list({
      part: ['snippet', 'statistics'],
      id: [channelId],
    });

    const channel = res.data.items?.[0];
    if (!channel) {
      throw new NotFoundException(`Channel ${channelId} not found`);
    }

    const stats = {
      channelId: channel.id ?? '',
      channelTitle: channel.snippet?.title ?? null,
      subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
      videoCount: Number(channel.statistics?.videoCount ?? 0),
      viewCount: Number(channel.statistics?.viewCount ?? 0),
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? null,
    };

    await this.prisma.youtube_channels.upsert({
      where: { project_id: projectId },
      create: {
        user_id: userId,
        project_id: projectId,
        channel_id: stats.channelId,
        channel_title: stats.channelTitle,
        subscriber_count: stats.subscriberCount,
        video_count: stats.videoCount,
        view_count: BigInt(stats.viewCount),
        thumbnail_url: stats.thumbnailUrl,
        synced_at: new Date(),
      },
      update: {
        channel_id: stats.channelId,
        channel_title: stats.channelTitle,
        subscriber_count: stats.subscriberCount,
        video_count: stats.videoCount,
        view_count: BigInt(stats.viewCount),
        thumbnail_url: stats.thumbnailUrl,
        synced_at: new Date(),
      },
    });

    return { ...stats, syncedAt: new Date().toISOString() };
  }

  async fetchVideos(
    accessToken: string,
    options?: { pageToken?: string; maxResults?: number; search?: string },
  ): Promise<YouTubeVideoListResponse> {
    const yt = this.getYouTubeClient(accessToken);
    const maxResults = options?.maxResults ?? 12;

    const searchRes = await yt.search.list({
      part: ['id'],
      forMine: true,
      type: ['video'],
      maxResults,
      pageToken: options?.pageToken ?? undefined,
      q: options?.search ?? undefined,
      order: 'date',
    });

    const videoIds = (searchRes.data.items ?? [])
      .map((item) => item.id?.videoId)
      .filter((id): id is string => Boolean(id));

    if (videoIds.length === 0) {
      return { videos: [], nextPageToken: null, totalResults: 0 };
    }

    const videosRes = await yt.videos.list({
      part: ['snippet', 'statistics', 'contentDetails', 'status'],
      id: videoIds,
    });

    const videos: YouTubeVideoResponse[] = (videosRes.data.items ?? []).map(
      (item) => ({
        videoId: item.id ?? '',
        title: item.snippet?.title ?? '',
        description: item.snippet?.description ?? '',
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? '',
        publishedAt: item.snippet?.publishedAt ?? '',
        viewCount: Number(item.statistics?.viewCount ?? 0),
        likeCount: Number(item.statistics?.likeCount ?? 0),
        commentCount: Number(item.statistics?.commentCount ?? 0),
        duration: item.contentDetails?.duration ?? '',
        privacyStatus: item.status?.privacyStatus ?? 'private',
        tags: item.snippet?.tags ?? [],
      }),
    );

    return {
      videos,
      nextPageToken: searchRes.data.nextPageToken ?? null,
      totalResults: searchRes.data.pageInfo?.totalResults ?? videos.length,
    };
  }

  async fetchVideoDetail(
    accessToken: string,
    videoId: string,
  ): Promise<YouTubeVideoResponse> {
    const yt = this.getYouTubeClient(accessToken);
    const res = await yt.videos.list({
      part: ['snippet', 'statistics', 'contentDetails', 'status'],
      id: [videoId],
    });

    const item = res.data.items?.[0];
    if (!item) {
      throw new NotFoundException(`Video ${videoId} not found`);
    }

    return {
      videoId: item.id ?? '',
      title: item.snippet?.title ?? '',
      description: item.snippet?.description ?? '',
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? '',
      publishedAt: item.snippet?.publishedAt ?? '',
      viewCount: Number(item.statistics?.viewCount ?? 0),
      likeCount: Number(item.statistics?.likeCount ?? 0),
      commentCount: Number(item.statistics?.commentCount ?? 0),
      duration: item.contentDetails?.duration ?? '',
      privacyStatus: item.status?.privacyStatus ?? 'private',
      tags: item.snippet?.tags ?? [],
    };
  }

  async updateVideoMetadata(
    accessToken: string,
    videoId: string,
    input: {
      title?: string;
      description?: string;
      tags?: string[];
      privacyStatus?: string;
    },
  ): Promise<YouTubeVideoResponse> {
    const yt = this.getYouTubeClient(accessToken);

    // Fetch current video to get categoryId (required for update)
    const current = await yt.videos.list({
      part: ['snippet', 'status'],
      id: [videoId],
    });
    const currentItem = current.data.items?.[0];
    if (!currentItem) {
      throw new NotFoundException(`Video ${videoId} not found`);
    }

    const updateBody: youtube_v3.Schema$Video = {
      id: videoId,
      snippet: {
        title: input.title ?? currentItem.snippet?.title ?? '',
        description:
          input.description ?? currentItem.snippet?.description ?? '',
        tags: input.tags ?? currentItem.snippet?.tags ?? [],
        categoryId: currentItem.snippet?.categoryId ?? '22',
      },
    };

    if (input.privacyStatus) {
      updateBody.status = { privacyStatus: input.privacyStatus };
    }

    const parts = ['snippet'];
    if (input.privacyStatus) parts.push('status');

    await yt.videos.update({
      part: parts,
      requestBody: updateBody,
    });

    return this.fetchVideoDetail(accessToken, videoId);
  }

  async fetchComments(
    accessToken: string,
    videoId: string,
    options?: { pageToken?: string; filter?: 'all' | 'unanswered' },
  ): Promise<YouTubeCommentListResponse> {
    const yt = this.getYouTubeClient(accessToken);

    const res = await yt.commentThreads.list({
      part: ['snippet', 'replies'],
      videoId,
      maxResults: 20,
      pageToken: options?.pageToken ?? undefined,
      order: 'time',
    });

    // Get video title for context
    const videoRes = await yt.videos.list({
      part: ['snippet'],
      id: [videoId],
    });
    const videoTitle = videoRes.data.items?.[0]?.snippet?.title ?? '';

    const comments: YouTubeCommentResponse[] = (res.data.items ?? []).map(
      (thread) => {
        const topComment = thread.snippet?.topLevelComment?.snippet;
        const replies: YouTubeCommentReplyResponse[] = (
          thread.replies?.comments ?? []
        ).map((reply) => ({
          replyId: reply.id ?? '',
          authorName: reply.snippet?.authorDisplayName ?? '',
          authorProfileUrl: reply.snippet?.authorProfileImageUrl ?? '',
          text: reply.snippet?.textDisplay ?? '',
          likeCount: reply.snippet?.likeCount ?? 0,
          publishedAt: reply.snippet?.publishedAt ?? '',
        }));

        return {
          commentId: thread.snippet?.topLevelComment?.id ?? '',
          videoId,
          videoTitle,
          authorName: topComment?.authorDisplayName ?? '',
          authorProfileUrl: topComment?.authorProfileImageUrl ?? '',
          text: topComment?.textDisplay ?? '',
          likeCount: topComment?.likeCount ?? 0,
          publishedAt: topComment?.publishedAt ?? '',
          isOwnerReplied: (thread.replies?.comments?.length ?? 0) > 0,
          totalReplyCount: thread.snippet?.totalReplyCount ?? 0,
          replies,
        };
      },
    );

    const filteredComments =
      options?.filter === 'unanswered'
        ? comments.filter((c) => !c.isOwnerReplied)
        : comments;

    return {
      comments: filteredComments,
      nextPageToken: res.data.nextPageToken ?? null,
      totalResults: res.data.pageInfo?.totalResults ?? comments.length,
    };
  }

  async replyToComment(
    accessToken: string,
    parentId: string,
    text: string,
  ): Promise<YouTubeCommentReplyResponse> {
    const yt = this.getYouTubeClient(accessToken);

    const res = await yt.comments.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          parentId,
          textOriginal: text,
        },
      },
    });

    const reply = res.data;
    return {
      replyId: reply.id ?? '',
      authorName: reply.snippet?.authorDisplayName ?? '',
      authorProfileUrl: reply.snippet?.authorProfileImageUrl ?? '',
      text: reply.snippet?.textDisplay ?? '',
      likeCount: reply.snippet?.likeCount ?? 0,
      publishedAt: reply.snippet?.publishedAt ?? '',
    };
  }

  async createResumableUpload(
    accessToken: string,
    metadata: {
      title: string;
      description?: string;
      tags?: string[];
      privacyStatus?: string;
    },
  ): Promise<string> {
    const body = {
      snippet: {
        title: metadata.title,
        description: metadata.description ?? '',
        tags: metadata.tags ?? [],
        categoryId: '22',
      },
      status: {
        privacyStatus: metadata.privacyStatus ?? 'private',
      },
    };

    const res = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      throw new Error(
        `Failed to create upload session: ${res.status} ${res.statusText}`,
      );
    }

    const uploadUrl = res.headers.get('location');
    if (!uploadUrl) {
      throw new Error('No upload URL returned from YouTube');
    }

    return uploadUrl;
  }
}
