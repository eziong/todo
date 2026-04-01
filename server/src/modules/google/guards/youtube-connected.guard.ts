import { Injectable } from '@nestjs/common';
import { GoogleConnectedGuard } from './google-connected.guard';
import { TokenService } from '../google-token.service';

@Injectable()
export class YouTubeConnectedGuard extends GoogleConnectedGuard {
  protected readonly requiredService: TokenService = 'youtube';
}
