import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsUUID, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UnitMeasure } from '../entities/article.entity';

export class CreateArticleDto {
  @ApiProperty({ example: 'Tomates Cherry Ecológicos', description: 'Nombre del artículo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Verduras', description: 'Categoría del artículo' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Tomate', description: 'Producto' })
  @IsOptional()
  @IsString()
  product?: string;

  @ApiPropertyOptional({ example: 'Cherry', description: 'Variedad del producto' })
  @IsOptional()
  @IsString()
  variety?: string;

  @ApiPropertyOptional({ example: 'Tomates cherry de agricultura ecológica', description: 'Descripción del artículo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    enum: UnitMeasure, 
    example: UnitMeasure.KG, 
    description: 'Unidad de medida (g, kg, ml, cl, l, unit)' 
  })
  @IsEnum(UnitMeasure)
  @IsNotEmpty()
  unitMeasure: UnitMeasure;

  @ApiProperty({ example: 4.5, description: 'Precio por unidad de medida' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  @IsNotEmpty()
  pricePerUnit: number;

  @ApiPropertyOptional({ example: 'Barcelona', description: 'Ciudad de origen del producto' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del productor' })
  @IsOptional()
  @IsUUID()
  producerId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del grupo de consumo' })
  @IsUUID()
  @IsNotEmpty()
  consumerGroupId: string;

  @ApiPropertyOptional({ example: false, description: 'Si el artículo está en el aparador', default: false })
  @IsOptional()
  @IsBoolean()
  inShowcase?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Si el artículo es de temporada', default: false })
  @IsOptional()
  @IsBoolean()
  isSeasonal?: boolean;
}

