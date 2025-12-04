import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

class DaySchedule {
  @ApiProperty({ example: '09:00' })
  open: string;

  @ApiProperty({ example: '18:00' })
  close: string;

  @ApiProperty({ example: false })
  closed: boolean;
}

export class CreateConsumerGroupDto {
  @ApiProperty({ example: 'group@example.com', description: 'Email del grupo' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Grupo de Consumo Barcelona', description: 'Nombre del grupo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Grupo de consumo ecológico...', description: 'Descripción del grupo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Barcelona', description: 'Ciudad del grupo' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Calle Mayor 123', description: 'Dirección del grupo' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ 
    description: 'Horarios de apertura por día',
    example: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      sunday: { closed: true }
    }
  })
  @IsOptional()
  @IsObject()
  openingSchedule?: Record<string, DaySchedule>;

  @ApiProperty({ 
    example: 'manager@example.com', 
    description: 'Email del usuario que será el manager del grupo',
    required: false
  })
  @IsOptional()
  @IsEmail()
  managerEmail?: string;
}

