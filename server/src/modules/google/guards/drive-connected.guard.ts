import { Injectable } from '@nestjs/common';
import { GoogleConnectedGuard } from './google-connected.guard';
import { TokenService } from '../google-token.service';

@Injectable()
export class DriveConnectedGuard extends GoogleConnectedGuard {
  protected readonly requiredService: TokenService = 'drive';
}
