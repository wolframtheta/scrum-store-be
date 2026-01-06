import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { SystemConfigResponseDto } from './dto/system-config-response.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@Injectable()
export class ConfigSystemService {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepository: Repository<SystemConfig>,
  ) {}

  async getConfig(key: string): Promise<SystemConfigResponseDto> {
    const config = await this.configRepository.findOne({ where: { key } });
    
    if (!config) {
      // Si no existe, crear con valor por defecto
      if (key === 'login_enabled') {
        const defaultConfig = this.configRepository.create({
          key: 'login_enabled',
          value: 'true',
          description: 'Habilita o deshabilita el login en el sistema',
        });
        const saved = await this.configRepository.save(defaultConfig);
        return new SystemConfigResponseDto(saved);
      }
      throw new NotFoundException(`Config key '${key}' not found`);
    }

    return new SystemConfigResponseDto(config);
  }

  async updateConfig(key: string, updateDto: UpdateSystemConfigDto): Promise<SystemConfigResponseDto> {
    let config = await this.configRepository.findOne({ where: { key } });

    if (!config) {
      // Si no existe, crear
      config = this.configRepository.create({
        key,
        value: updateDto.value,
        description: key === 'login_enabled' 
          ? 'Habilita o deshabilita el login en el sistema'
          : null,
      });
    } else {
      config.value = updateDto.value;
    }

    const saved = await this.configRepository.save(config);
    return new SystemConfigResponseDto(saved);
  }

  async isLoginEnabled(): Promise<boolean> {
    try {
      const config = await this.getConfig('login_enabled');
      return config.value === 'true';
    } catch (error) {
      // Si no existe, por defecto está habilitado
      return true;
    }
  }
}

