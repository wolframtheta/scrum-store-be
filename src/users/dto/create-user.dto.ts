import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'García', description: 'Apellidos del usuario' })
  @IsString()
  @IsNotEmpty()
  surname: string;

  @ApiProperty({ example: '+34612345678', description: 'Teléfono del usuario', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Contraseña del usuario (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ 
    enum: UserRole, 
    example: [UserRole.CLIENT], 
    description: 'Roles del usuario',
    required: false,
    default: [UserRole.CLIENT],
    isArray: true
  })
  @IsOptional()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}

