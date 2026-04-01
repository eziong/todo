import { Module } from '@nestjs/common';
import { GoogleAuthController } from './google-auth.controller';
import { GoogleAuthService } from './google-auth.service';
import { GoogleTokenService } from './google-token.service';
import { GoogleConnectedGuard } from './guards/google-connected.guard';
import { YouTubeConnectedGuard } from './guards/youtube-connected.guard';
import { DriveConnectedGuard } from './guards/drive-connected.guard';

@Module({
  controllers: [GoogleAuthController],
  providers: [
    GoogleAuthService,
    GoogleTokenService,
    GoogleConnectedGuard,
    YouTubeConnectedGuard,
    DriveConnectedGuard,
  ],
  exports: [
    GoogleTokenService,
    GoogleConnectedGuard,
    YouTubeConnectedGuard,
    DriveConnectedGuard,
  ],
})
export class GoogleModule {}
