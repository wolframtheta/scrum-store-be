import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateInvitationDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del grupo de consumo (se asigna automáticamente desde la URL)' })
  @IsOptional()
  @IsString()
  consumerGroupId?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email del usuario a invitar (opcional)' })
  @IsOptional()
  @IsEmail()
  invitedEmail?: string;

  @ApiProperty({ example: false, description: 'Si el usuario será gestor', default: false })
  @IsBoolean()
  @IsOptional()
  isManager?: boolean;

  @ApiProperty({ example: true, description: 'Si el usuario será cliente', default: true })
  @IsBoolean()
  @IsOptional()
  isClient?: boolean;

  @ApiProperty({ example: false, description: 'Si el usuario será preparador', default: false })
  @IsBoolean()
  @IsOptional()
  isPreparer?: boolean;

  @ApiPropertyOptional({ 
    example: 0, 
    description: 'Días hasta que expire la invitación. 0 = no caduca nunca. Por defecto: 0 (sin expiración)', 
    default: 0 
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  expirationDays?: number;
}

