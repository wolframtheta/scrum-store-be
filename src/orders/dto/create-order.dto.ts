import { IsArray, IsNotEmpty, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  articleId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  pricePerUnit: number;

  @IsOptional()
  article?: any; // Full article info from frontend
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  consumerGroupId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}


