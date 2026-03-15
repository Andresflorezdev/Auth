import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest<TUser = Record<string, unknown>>(
    err: unknown,
    user: TUser,
    info: { message?: string } | undefined,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    void context;
    void status;

    if (err || !user) {
      throw new UnauthorizedException(
        info?.message || 'Token invalido o expirado',
      );
    }
    return user;
  }
}
