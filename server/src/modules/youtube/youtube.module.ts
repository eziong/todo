import { Module } from '@nestjs/common';
import { GoogleModule } from '../google/google.module';
import { YouTubeController } from './youtube.controller';
import { YouTubeService } from './youtube.service';
import { YouTubeAnalyticsService } from './youtube-analytics.service';

@Module({
  imports: [GoogleModule],
  controllers: [YouTubeController],
  providers: [YouTubeService, YouTubeAnalyticsService],
})
export class YouTubeModule {}
