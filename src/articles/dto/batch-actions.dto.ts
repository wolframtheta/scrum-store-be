import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsBoolean, IsNotEmpty } from 'class-validator';

export class BatchDeleteDto {
  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    description: 'Array de IDs de artículos a eliminar',
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  articleIds: string[];
}

export class BatchToggleShowcaseDto {
  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    description: 'Array de IDs de artículos',
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  articleIds: string[];

  @ApiProperty({ 
    example: true,
    description: 'Valor booleano para establecer el estado del aparador'
  })
  @IsBoolean()
  @IsNotEmpty()
  inShowcase: boolean;
}

export class BatchToggleSeasonalDto {
  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    description: 'Array de IDs de artículos',
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  articleIds: string[];

  @ApiProperty({ 
    example: true,
    description: 'Valor booleano para establecer el estado de temporada'
  })
  @IsBoolean()
  @IsNotEmpty()
  isSeasonal: boolean;
}

export class BatchToggleEcoDto {
  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    description: 'Array de IDs de artículos',
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  articleIds: string[];

  @ApiProperty({ 
    example: true,
    description: 'Valor booleano para establecer el estado ecológico'
  })
  @IsBoolean()
  @IsNotEmpty()
  isEco: boolean;
}

