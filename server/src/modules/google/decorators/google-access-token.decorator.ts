import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GoogleAccessToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.googleAccessToken as string;
  },
);
