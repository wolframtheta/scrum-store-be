import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Verdures', description: 'Categoría del producto' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ example: 'Tomate', description: 'Nombre del producto' })
  @IsOptional()
  @IsString()
  product?: string;

  @ApiPropertyOptional({ example: 'Cherry', description: 'Variedad del producto' })
  @IsOptional()
  @IsString()
  variety?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del grupo de consumo' })
  @IsUUID()
  @IsNotEmpty()
  consumerGroupId: string;
}

