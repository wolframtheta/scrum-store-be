import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSystemConfigDto {
  @ApiProperty({ description: 'Valor de configuración' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

