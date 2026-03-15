import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UsersService } from './users.service';
import { UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type JsonShape = Record<string, unknown>;

function serializeDoc(value: unknown): JsonShape {
  if (
    typeof value === 'object' &&
    value !== null &&
    'toJSON' in value &&
    typeof (value as { toJSON?: unknown }).toJSON === 'function'
  ) {
    return (value as { toJSON: () => JsonShape }).toJSON();
  }

  return {};
}

@Controller('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mi perfil (cualquier usuario autenticado)' })
  getMe(@Req() req: { user?: unknown }) {
    return { data: serializeDoc(req.user) };
  }

  @Post()
  @SetMetadata('roles', [UserRole.ADMIN])
  @ApiOperation({ summary: '[Admin] crear usuario' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return { message: 'Usuario creado', data: serializeDoc(user) };
  }

  @Get()
  @SetMetadata('roles', [UserRole.ADMIN])
  @ApiOperation({ summary: '[Admin] listar usuarios' })
  async findAll() {
    const users = await this.usersService.findAll();
    return { total: users.length, data: users };
  }

  @Get(':id')
  @SetMetadata('roles', [UserRole.ADMIN])
  @ApiOperation({ summary: '[Admin] obtener usuario por ID' })
  async findOne(@Param('id') id: string) {
    return { data: await this.usersService.findOne(id) };
  }

  @Patch(':id')
  @SetMetadata('roles', [UserRole.ADMIN])
  @ApiOperation({ summary: '[Admin] Actualizar usuario' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return {
      message: 'Actualizando',
      data: await this.usersService.update(id, dto),
    };
  }

  @Delete(':id')
  @SetMetadata('roles', [UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Desactivar usuario (soft delete)' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Usuario desactivado' };
  }
}
