import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { YouTubeConnectedGuard } from '../google/guards/youtube-connected.guard';
import { GoogleAccessToken } from '../google/decorators/google-access-token.decorator';
import { YouTubeService } from './youtube.service';
import { YouTubeAnalyticsService } from './youtube-analytics.service';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import { SelectChannelDto } from './dto/select-channel.dto';

@Controller('projects/:projectId/youtube')
@UseGuards(YouTubeConnectedGuard)
export class YouTubeController {
  constructor(
    private readonly youtubeService: YouTubeService,
    private readonly analyticsService: YouTubeAnalyticsService,
  ) {}

  @Get('channel')
  fetchChannel(
    @GoogleAccessToken() accessToken: string,
    @Param('projectId') projectId: string,
  ) {
    return this.youtubeService.fetchChannelStats(accessToken, projectId);
  }

  @Get('videos')
  fetchVideos(
    @GoogleAccessToken() accessToken: string,
    @Query('pageToken') pageToken?: string,
    @Query('maxResults') maxResults?: string,
    @Query('search') search?: string,
  ) {
    return this.youtubeService.fetchVideos(accessToken, {
      pageToken,
      maxResults: maxResults ? Number(maxResults) : undefined,
      search,
    });
  }

  @Get('videos/:id')
  fetchVideo(
    @GoogleAccessToken() accessToken: string,
    @Param('id') videoId: string,
  ) {
    return this.youtubeService.fetchVideoDetail(accessToken, videoId);
  }

  @Patch('videos/:id')
  updateVideo(
    @GoogleAccessToken() accessToken: string,
    @Param('id') videoId: string,
    @Body() dto: UpdateVideoDto,
  ) {
    return this.youtubeService.updateVideoMetadata(accessToken, videoId, dto);
  }

  @Get('comments')
  fetchComments(
    @GoogleAccessToken() accessToken: string,
    @Query('videoId') videoId: string,
    @Query('pageToken') pageToken?: string,
    @Query('filter') filter?: 'all' | 'unanswered',
  ) {
    return this.youtubeService.fetchComments(accessToken, videoId, {
      pageToken,
      filter,
    });
  }

  @Post('comments/reply')
  replyToComment(
    @GoogleAccessToken() accessToken: string,
    @Body() dto: ReplyCommentDto,
  ) {
    return this.youtubeService.replyToComment(
      accessToken,
      dto.commentId,
      dto.text,
    );
  }

  @Post('upload')
  createUploadSession(
    @GoogleAccessToken() accessToken: string,
    @Body() dto: UploadVideoDto,
  ) {
    return this.youtubeService
      .createResumableUpload(accessToken, dto)
      .then((uploadUrl) => ({
        uploadUrl,
        contentId: dto.contentId ?? null,
      }));
  }

  @Get('analytics')
  fetchAnalytics(
    @GoogleAccessToken() accessToken: string,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? Number(year) : new Date().getFullYear();
    return this.analyticsService
      .fetchMonthlyRevenue(accessToken, targetYear)
      .then((analytics) => ({
        year: targetYear,
        analytics,
      }));
  }

  @Get('channels/available')
  listAvailableChannels(@GoogleAccessToken() accessToken: string) {
    return this.youtubeService.listAvailableChannels(accessToken);
  }

  @Get('channels/search')
  searchChannels(
    @GoogleAccessToken() accessToken: string,
    @Query('q') query: string,
  ) {
    if (!query || query.trim().length === 0) return [];
    return this.youtubeService.searchChannels(accessToken, query.trim());
  }

  @Post('channel/select')
  selectChannel(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @GoogleAccessToken() accessToken: string,
    @Body() dto: SelectChannelDto,
  ) {
    return this.youtubeService.selectChannel(
      user.id,
      projectId,
      dto.channelId,
      accessToken,
    );
  }
}
