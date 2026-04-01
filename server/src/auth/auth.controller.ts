import { Controller, Get, Request } from '@nestjs/common';
import { AuthUser } from '../common/types/auth.types';

@Controller('auth')
export class AuthController {
  @Get('me')
  getMe(@Request() req: { user: AuthUser }) {
    return { user: req.user };
  }
}
