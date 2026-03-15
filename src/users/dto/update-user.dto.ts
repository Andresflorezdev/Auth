import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
