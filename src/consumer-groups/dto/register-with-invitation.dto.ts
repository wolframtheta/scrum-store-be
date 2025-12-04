import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class RegisterWithInvitationDto {
  @ApiProperty({ example: 'abc123...', description: 'Token de invitación' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'García', description: 'Apellidos' })
  @IsString()
  @IsNotEmpty()
  surname: string;
}

