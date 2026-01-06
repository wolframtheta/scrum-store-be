import { ApiProperty } from '@nestjs/swagger';
import { SystemConfig } from '../entities/system-config.entity';

export class SystemConfigResponseDto {
  @ApiProperty({ description: 'Clave de configuración' })
  key: string;

  @ApiProperty({ description: 'Valor de configuración' })
  value: string;

  @ApiProperty({ description: 'Descripción de la configuración', required: false, nullable: true })
  description?: string | null;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  constructor(partial: Partial<SystemConfigResponseDto> | SystemConfig) {
    Object.assign(this, {
      ...partial,
      description: partial.description ?? undefined,
    });
  }
}

