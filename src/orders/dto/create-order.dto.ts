import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsPositive, IsOptional, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
