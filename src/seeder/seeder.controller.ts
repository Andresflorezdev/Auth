import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SeederService } from './seeder.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';

@ApiTags('Seeder')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('seeder')
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Ver estado del seeder (Publico)' })
  status() {
    return this.seederService.getStatus();
  }

  @Post('run')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ejecutar seeder (Publico)',
    description:
      'Crea usuarios de prueba. Es idempotente: no duplica si ya existen.',
  })
  runSeeder() {
    return this.seederService.runSeeder();
  }
  @Delete('clear')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpiar seeder (solo Admin)',
    description:
      'Desactiva UNICAMENTE los registros con isSeeded=true. No elimina fisicamente ni toca usuarios reales.',
  })
  clearSeeded() {
    return this.seederService.crearSeeded();
  }
}
