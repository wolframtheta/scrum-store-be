import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token para renovar el access token' })
  refreshToken: string;

  @ApiProperty({ description: 'Tipo de token', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: 'Tiempo de expiración del access token en segundos', example: 900 })
  expiresIn: number;

  @ApiProperty({ description: 'Información del usuario', type: UserResponseDto })
  user: UserResponseDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}

