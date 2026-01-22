import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsPositive, IsOptional, IsArray, ArrayMinSize, ValidateNested, IsString, IsNotEmpty, IsBoolean, Min, ValidateIf, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

class SelectedOptionValueDto {
  @ApiProperty({ example: 'opt-1', description: 'ID de la opción' })
  @IsString()
  @IsNotEmpty()
  optionId: string;

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

  @ApiProperty({ 
    example: 'rojo', 
    description: 'Valor seleccionado (boolean | number | string | string[])' 
  })
  @IsDefined()
  value: boolean | number | string | string[];

  @ApiPropertyOptional({ 
    example: 2.5, 
    description: 'Precio adicional de esta opción seleccionada',
    default: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price?: number;
}

export class OrderItemDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'ID del artículo' 
  })
  @IsUUID()
  articleId: string;

  @ApiProperty({ 
    example: 2.5, 
    description: 'Cantidad del artículo (en la unidad de medida del artículo)' 
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'ID del período de pedido (opcional)' 
  })
  @IsOptional()
  @IsUUID()
  orderPeriodId?: string;

  @ApiPropertyOptional({ 
    type: [SelectedOptionValueDto], 
    description: 'Opciones personalizadas seleccionadas' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedOptionValueDto)
  selectedOptions?: SelectedOptionValueDto[];
}

export class CreateOrderDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'ID del grupo de consumo' 
  })
  @IsUUID()
  consumerGroupId: string;

  @ApiProperty({ 
    type: [OrderItemDto], 
    description: 'Lista de artículos con sus cantidades' 
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
