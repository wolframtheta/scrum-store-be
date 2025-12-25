import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEmail, IsBoolean, ValidateIf } from 'class-validator';

export class CreateProducerDto {
  @ApiProperty({ example: 'Cal Pagès', description: 'Nombre del productor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del proveedor', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.supplierId !== null && o.supplierId !== undefined)
  @IsUUID(undefined, { message: 'supplierId must be a valid UUID' })
  supplierId?: string;

  @ApiPropertyOptional({ example: 'calpages@example.com', description: 'Email del productor' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+34 666 777 888', description: 'Teléfono del productor' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Barcelona', description: 'Ciudad del productor' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Carrer Major 123', description: 'Dirección del productor' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Notas sobre el productor', description: 'Notas internas' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del grupo de consumo' })
  @IsUUID()
  @IsNotEmpty()
  consumerGroupId: string;

  @ApiPropertyOptional({ example: true, description: 'Si el productor está activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

