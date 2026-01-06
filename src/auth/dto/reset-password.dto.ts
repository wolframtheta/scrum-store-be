import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'NewSecurePass123!', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'NewSecurePass123!', description: 'Confirmación de la nueva contraseña' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  confirmPassword: string;
}

