import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PeriodRecurrence } from '../entities/period.entity';

export class CreatePeriodArticleDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del artículo' })
  @IsUUID()
  @IsNotEmpty()
  articleId: string;

  @ApiProperty({ example: 4.5, description: 'Precio por unidad del artículo en este período' })
  @IsNotEmpty()
  pricePerUnit: number;
}

export class CreatePeriodArticlesBatchDto {
  @ApiProperty({ 
    type: [CreatePeriodArticleDto],
    description: 'Lista de artículos a añadir al período',
    example: [
      { articleId: '123e4567-e89b-12d3-a456-426614174000', pricePerUnit: 4.5 },
      { articleId: '223e4567-e89b-12d3-a456-426614174001', pricePerUnit: 3.2 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePeriodArticleDto)
  articles: CreatePeriodArticleDto[];
}

export class CreatePeriodDto {
  @ApiProperty({ example: 'Período Q1 2024', description: 'Nombre del período' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del proveedor' })
  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ example: '2024-01-01', description: 'Fecha de inicio del período' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2024-03-31', description: 'Fecha de fin del período' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha de entrega del período' })
  @IsDateString()
  @IsNotEmpty()
  deliveryDate: string;

  @ApiProperty({ enum: PeriodRecurrence, example: PeriodRecurrence.QUARTERLY, description: 'Recurrencia del período' })
  @IsEnum(PeriodRecurrence)
  @IsOptional()
  recurrence?: PeriodRecurrence;

  @ApiPropertyOptional({ example: 25.50, description: 'Cost de transport per aquest període (es repartirà entre totes les comandes)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  transportCost?: number;

  @ApiPropertyOptional({ example: 21, description: 'Percentatge d\'IVA per al transport (0-100)', default: 21 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  transportTaxRate?: number;

  @ApiPropertyOptional({ type: [CreatePeriodArticleDto], description: 'Artículos asociados al período con sus precios' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePeriodArticleDto)
  articles?: CreatePeriodArticleDto[];
}

