import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
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
}

export class CreateSaleDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'ID del grupo de consumo' 
  })
  @IsUUID()
  consumerGroupId: string;

  @ApiProperty({ 
    type: [SaleItemDto], 
    description: 'Lista de artículos con sus cantidades' 
  })
  items: SaleItemDto[];
}


