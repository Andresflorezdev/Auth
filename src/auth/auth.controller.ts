import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegistrerDto,
} from './dto/auth.dto';
import { GetUser } from './decorators/get-user.decorator';

type JsonShape = Record<string, unknown>;

function serializeUser(user: unknown): JsonShape {
  if (
    typeof user === 'object' &&
    user !== null &&
    'toJSON' in user &&
    typeof (user as { toJSON?: unknown }).toJSON === 'function'
  ) {
    return (user as { toJSON: () => JsonShape }).toJSON();
  }

  return {};
}

@ApiTags('Auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  register(@Body() dto: RegistrerDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesion => retorna access + refresh token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token con refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener usuario autenticado actual' })
  getMe(@GetUser() user: unknown) {
    return { data: serializeUser(user) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cerrar sesion (invalida refresh token)' })
  logout(@GetUser('_id') userId: string) {
    return this.authService.logout(userId.toString());
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'cambiar contraseña e invalidar sesiones' })
  changePassword(
    @GetUser('_id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId.toString(), dto);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mostrar contraseña actual por correo' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }
}
