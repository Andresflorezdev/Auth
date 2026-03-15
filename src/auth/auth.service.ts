import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserDocument } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RegistrerDto,
} from './dto/auth.dto';

type JsonShape = Record<string, unknown>;

function serializeUser(user: UserDocument): JsonShape {
  return user.toJSON() as JsonShape;
}

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  type: 'access' | 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) return null;
    const valid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    return valid ? user : null;
  }

  private generateTokens(user: UserDocument) {
    const tokenVersion = Number(user.tokenVersion ?? 0);
    const basePayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion,
    };
    const secret = process.env.JWT_SECRET || 'super-secret-key';

    return {
      accessToken: this.jwtService.sign(
        { ...basePayload, type: 'access' },
        { secret, expiresIn: '15m' },
      ),
      refreshToken: this.jwtService.sign(
        { ...basePayload, type: 'refresh' },
        { secret, expiresIn: '7d' },
      ),
    };
  }

  async register(dto: RegistrerDto) {
    const user = await this.usersService.create(dto);
    return {
      message: 'Registro exitoso. Ahora inicia sesion.',
      user: serializeUser(user),
    };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Credenciales invalidas');

    const tokens = this.generateTokens(user);
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      await bcrypt.hash(tokens.refreshToken, 10),
    );
    return { message: 'Login exitoso', user: serializeUser(user), tokens };
  }

  async refresh(refreshToken: string) {
    const secret = process.env.JWT_SECRET || 'super-secret-key';
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Refresh token invalido');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user || !user.isActive || !user.refreshToken) {
      throw new UnauthorizedException('Acceso denegado');
    }

    if (
      user._id.toString() !== payload.sub ||
      (user.tokenVersion ?? 0) !== payload.tokenVersion
    ) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) throw new UnauthorizedException('Refresh token invalido');

    const tokens = this.generateTokens(user);
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      await bcrypt.hash(tokens.refreshToken, 10),
    );
    return { message: 'Tokens renovados', tokens };
  }

  async logout(userId: string) {
    await this.usersService.invalidateUserSessions(userId);
    return { message: 'Sesion cerrada exitosamente' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findOne(userId);
    const fullUser = await this.usersService.findByEmail(user.email);
    if (!fullUser) throw new UnauthorizedException('Usuario no encontrado');

    const valid = await bcrypt.compare(dto.curretPassword, fullUser.password);
    if (!valid) throw new BadRequestException('Contraseña actual incorrecta');

    await fullUser?.updateOne({
      password: await bcrypt.hash(dto.newPassword, 12),
      passwordBackup: this.usersService.buildPasswordBackup(dto.newPassword),
      $inc: { tokenVersion: 1 },
      refreshToken: null,
    });
    return { message: 'Contraseña actualizada. Inicia sesion nuevamente' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      return {
        message: 'Si el correo existe, se mostrará la contraseña registrada.',
      };
    }

    const currentPassword = await this.usersService.getReadablePasswordByEmail(
      dto.email,
    );

    if (!currentPassword) {
      return {
        message:
          'Este usuario no tiene contraseña recuperable guardada. Debe cambiar contraseña una vez.',
      };
    }

    return {
      message: 'Contraseña recuperada correctamente',
      password: currentPassword,
    };
  }
}
