import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional, IsArray, ValidateNested, IsString, IsNotEmpty, Min, IsDefined } from 'class-validator';
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

export class UpdateOrderItemDto {
  @ApiPropertyOptional({ 
    example: 2.5, 
    description: 'Cantidad del artículo (en la unidad de medida del artículo)' 
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Type(() => Number)
  quantity?: number;

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
