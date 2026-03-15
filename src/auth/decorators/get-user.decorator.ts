import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type AuthenticatedRequest = {
  user?: Record<string, unknown>;
};

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
