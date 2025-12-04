import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'Juan', description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'García', description: 'Apellidos del usuario' })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional({ example: '+34612345678', description: 'Teléfono del usuario' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'NewPass123!', description: 'Nueva contraseña' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

