import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsUUID, IsBoolean, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UnitMeasure } from '../entities/article.entity';

class CustomizationOptionValueDto {
  @ApiProperty({ example: 'opt-1', description: 'ID del valor de la opción' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Rojo', description: 'Etiqueta del valor' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ example: 2.5, description: 'Precio adicional por este valor', default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price?: number;
}

class CustomizationOptionDto {
  @ApiProperty({ example: 'opt-1', description: 'ID de la opción' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Color', description: 'Título de la opción' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    enum: ['boolean', 'numeric', 'string', 'select', 'multiselect'], 
    example: 'select', 
    description: 'Tipo de opción' 
  })
  @IsString()
  @IsNotEmpty()
  type: 'boolean' | 'numeric' | 'string' | 'select' | 'multiselect';

  @ApiPropertyOptional({ example: false, description: 'Si la opción es obligatoria', default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: 1.5, description: 'Precio adicional cuando se activa/selecciona esta opción', default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ 
    type: [CustomizationOptionValueDto], 
    description: 'Valores posibles para select/multiselect' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationOptionValueDto)
  values?: CustomizationOptionValueDto[];
}

export class CreateArticleDto {
  @ApiProperty({ example: 'Verduras', description: 'Categoría del artículo' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Tomate', description: 'Producto' })
  @IsString()
  @IsNotEmpty()
  product: string;

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

  @ApiPropertyOptional({ example: true, description: 'Si el producto es ecológico', default: false })
  @IsOptional()
  @IsBoolean()
  isEco?: boolean;

  @ApiPropertyOptional({ example: 21, description: 'Porcentaje de IVA (0-100)', default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  taxRate?: number;

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

  @ApiPropertyOptional({ 
    type: [CustomizationOptionDto], 
    description: 'Opciones de personalización del artículo' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationOptionDto)
  customizationOptions?: CustomizationOptionDto[];
}

