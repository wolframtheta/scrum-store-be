import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
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

  @ApiProperty({ example: 'SecurePass123!', description: 'Contraseña del usuario (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '+34612345678', description: 'Teléfono del usuario', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  // Note: Los roles se asignan automáticamente como [CLIENT] en el registro público
  // Solo SuperAdmin puede crear usuarios con otros roles usando el endpoint /users
}

