import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEmail, IsBoolean } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Cooperativa Agrícola del Vallès', description: 'Nombre del proveedor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'B12345678', description: 'CIF/NIF del proveedor' })
  @IsOptional()
  @IsString()
  cif?: string;

  @ApiPropertyOptional({ example: 'info@cooperativa.cat', description: 'Email del proveedor' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+34 666 777 888', description: 'Teléfono del proveedor' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Barcelona', description: 'Ciudad del proveedor' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Carrer Major 123', description: 'Dirección del proveedor' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '08001', description: 'Código postal' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'ES12 1234 5678 90 1234567890', description: 'IBAN del proveedor' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ example: 'Notas sobre el proveedor', description: 'Notas internas' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del grupo de consumo' })
  @IsUUID()
  @IsNotEmpty()
  consumerGroupId: string;

  @ApiPropertyOptional({ example: true, description: 'Si el proveedor está activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

