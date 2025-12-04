import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class DeleteCategoryByNameDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del grupo de consumo' })
  @IsUUID()
  @IsNotEmpty()
  consumerGroupId: string;

  @ApiProperty({ example: 'Verduras', description: 'Nombre de la categoría' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Tomate', description: 'Nombre del producto (solo para producto y variedad)', required: false })
  @IsOptional()
  @IsString()
  product?: string;

  @ApiProperty({ example: 'Cherry', description: 'Nombre de la variedad (solo para variedad)', required: false })
  @IsOptional()
  @IsString()
  variety?: string;
}

