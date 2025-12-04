import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class UpdateCategoryNameDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del grupo de consumo' })
  @IsUUID()
  @IsNotEmpty()
  consumerGroupId: string;

  @ApiProperty({ example: 'Verduras', description: 'Nombre antiguo' })
  @IsString()
  @IsNotEmpty()
  oldName: string;

  @ApiProperty({ example: 'Hortalizas', description: 'Nombre nuevo' })
  @IsString()
  @IsNotEmpty()
  newName: string;

  @ApiProperty({ example: 'Verduras', description: 'Categoría (solo para producto y variedad)', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'Tomate', description: 'Producto (solo para variedad)', required: false })
  @IsOptional()
  @IsString()
  product?: string;
}

