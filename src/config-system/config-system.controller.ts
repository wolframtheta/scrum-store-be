import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ConfigSystemService } from './config-system.service';
import { SystemConfigResponseDto } from './dto/system-config-response.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@ApiTags('config-system')
@Controller('config-system')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ConfigSystemController {
  constructor(private readonly configSystemService: ConfigSystemService) {}

  @Get('login-enabled')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Obtener estado del login',
    description: 'Obtiene si el login está habilitado o no. Solo accesible para super_admin y admin.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del login obtenido exitosamente', 
    type: SystemConfigResponseDto 
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos (requiere super_admin o admin)' })
  async getLoginEnabled(): Promise<SystemConfigResponseDto> {
    return this.configSystemService.getConfig('login_enabled');
  }

  @Patch('login-enabled')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Actualizar estado del login',
    description: 'Habilita o deshabilita el login en el sistema. Solo accesible para super_admin y admin.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del login actualizado exitosamente', 
    type: SystemConfigResponseDto 
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos (requiere super_admin o admin)' })
  async updateLoginEnabled(@Body() updateDto: UpdateSystemConfigDto): Promise<SystemConfigResponseDto> {
    return this.configSystemService.updateConfig('login_enabled', updateDto);
  }
}

