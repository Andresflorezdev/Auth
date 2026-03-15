import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key',
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    tokenVersion: number;
    type: 'access' | 'refresh';
  }) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Token invalido o usuario inactivo');
    }

    if (
      user._id.toString() !== payload.sub ||
      (user.tokenVersion ?? 0) !== payload.tokenVersion
    ) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    return user;
  }
}
