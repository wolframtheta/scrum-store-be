import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class JoinGroupDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email del usuario que se une al grupo' })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({ example: true, description: 'Usuario es cliente', default: true })
  @IsOptional()
  @IsBoolean()
  isClient?: boolean;

  @ApiProperty({ example: false, description: 'Usuario es gestor', default: false })
  @IsOptional()
  @IsBoolean()
  isManager?: boolean;
}

