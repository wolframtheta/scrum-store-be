import { 
  Controller, 
  Get, 
  Post,
  Patch,
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConsumerGroupsService } from './consumer-groups.service';
import { CreateConsumerGroupDto } from './dto/create-consumer-group.dto';
import { UpdateConsumerGroupDto } from './dto/update-consumer-group.dto';
import { ConsumerGroupResponseDto } from './dto/consumer-group-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('admin/groups')
@Controller('admin/groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth('JWT-auth')
export class ConsumerGroupsAdminController {
  constructor(private readonly consumerGroupsService: ConsumerGroupsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear grupo de consumo (SuperAdmin)',
    description: 'Permite crear un grupo de consumo y asignar un manager. Solo accesible para SuperAdmin.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Grupo creado exitosamente',
    type: ConsumerGroupResponseDto 
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Se requiere rol SuperAdmin' })
  async createGroup(
    @Body() createDto: CreateConsumerGroupDto,
  ): Promise<ConsumerGroupResponseDto> {
    // Validar que managerEmail esté presente para creación por admin
    if (!createDto.managerEmail) {
      throw new BadRequestException('managerEmail is required for admin group creation');
    }
    return this.consumerGroupsService.create(createDto, createDto.managerEmail);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todos los grupos (SuperAdmin)',
    description: 'Obtiene todos los grupos del sistema con paginación y filtros'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nombre' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por estado activo/inactivo' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de grupos con metadatos de paginación',
    schema: {
      example: {
        data: [],
        meta: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5
        }
      }
    }
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.consumerGroupsService.findAllAdmin({
      page: page || 1,
      limit: limit || 10,
      search,
      isActive,
    });
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener detalle completo de un grupo (SuperAdmin)',
    description: 'Obtiene toda la información de un grupo incluyendo estadísticas y miembros'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detalle completo del grupo',
    type: ConsumerGroupResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.consumerGroupsService.findByIdAdmin(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar grupo (SuperAdmin)',
    description: 'Permite modificar cualquier campo del grupo'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Grupo actualizado',
    type: ConsumerGroupResponseDto 
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConsumerGroupDto,
  ): Promise<ConsumerGroupResponseDto> {
    return this.consumerGroupsService.update(id, updateDto);
  }

  @Patch(':id/status')
  @ApiOperation({ 
    summary: 'Activar/Desactivar grupo (SuperAdmin)',
    description: 'Cambia el estado activo/inactivo de un grupo'
  })
  @ApiResponse({ status: 200, description: 'Estado del grupo actualizado' })
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<{ message: string, isActive: boolean }> {
    await this.consumerGroupsService.updateStatus(id, isActive);
    return { 
      message: `Group ${isActive ? 'activated' : 'deactivated'} successfully`,
      isActive 
    };
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar grupo (SuperAdmin)',
    description: 'Elimina permanentemente un grupo y sus relaciones'
  })
  @ApiResponse({ status: 200, description: 'Grupo eliminado' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.consumerGroupsService.delete(id);
    return { message: 'Group deleted successfully' };
  }

  @Get(':id/members')
  @ApiOperation({ 
    summary: 'Listar miembros del grupo con detalles (SuperAdmin)',
    description: 'Obtiene todos los miembros del grupo con su información completa'
  })
  @ApiResponse({ status: 200, description: 'Lista de miembros' })
  async getMembers(@Param('id') id: string) {
    return this.consumerGroupsService.getMembers(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ 
    summary: 'Obtener estadísticas del grupo (SuperAdmin)',
    description: 'Obtiene métricas y estadísticas detalladas del grupo'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas del grupo',
    schema: {
      example: {
        totalMembers: 25,
        totalSales: 5000,
        totalArticles: 120,
        activeMembers: 20,
        salesThisMonth: 1200,
        pendingPayments: 350
      }
    }
  })
  async getStatistics(@Param('id') id: string) {
    return this.consumerGroupsService.getGroupStatistics(id);
  }
}

