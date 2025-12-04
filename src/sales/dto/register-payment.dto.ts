import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemPaymentDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'ID del item de venta' 
  })
  @IsUUID()
  itemId: string;

  @ApiProperty({ 
    example: 5.50, 
    description: 'Cantidad pagada para este item (debe ser <= precio total del item)' 
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  amount: number;
}

export class RegisterPaymentDto {
  @ApiProperty({ 
    type: [ItemPaymentDto], 
    description: 'Pagos por item. Puede ser un pago completo o parcial de cada item.',
    example: [
      { itemId: '123e4567-e89b-12d3-a456-426614174000', amount: 5.50 },
      { itemId: '223e4567-e89b-12d3-a456-426614174001', amount: 3.25 }
    ]
  })
  items: ItemPaymentDto[];
}


