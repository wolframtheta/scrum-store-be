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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('admin/users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth('JWT-auth')
export class UsersAdminExtendedController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear usuario (SuperAdmin)',
    description: 'Permite crear usuarios con cualquier rol. Solo accesible para SuperAdmin.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario creado exitosamente',
    type: UserResponseDto 
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Se requiere rol SuperAdmin' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todos los usuarios (SuperAdmin)',
    description: 'Obtiene todos los usuarios del sistema con paginación y filtros'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nombre o email' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filtrar por rol' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por estado activo/inactivo' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios con metadatos de paginación',
    schema: {
      example: {
        data: [],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10
        }
      }
    }
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.usersService.findAllAdmin({
      page: page || 1,
      limit: limit || 10,
      search,
      role,
      isActive,
    });
  }

  @Get(':email')
  @ApiOperation({ 
    summary: 'Obtener detalle completo de un usuario (SuperAdmin)',
    description: 'Obtiene toda la información de un usuario incluyendo grupos y estadísticas'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detalle completo del usuario',
    type: UserResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('email') email: string) {
    return this.usersService.findByEmailAdmin(email);
  }

  @Patch(':email')
  @ApiOperation({ 
    summary: 'Actualizar usuario (SuperAdmin)',
    description: 'Permite modificar cualquier campo del usuario'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario actualizado',
    type: UserResponseDto 
  })
  async update(
    @Param('email') email: string,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(email, updateDto);
  }

  @Patch(':email/roles')
  @ApiOperation({ 
    summary: 'Modificar roles de usuario (SuperAdmin)',
    description: 'Permite cambiar los roles de sistema del usuario'
  })
  @ApiResponse({ status: 200, description: 'Roles actualizados' })
  async updateRoles(
    @Param('email') email: string,
    @Body('roles') roles: UserRole[],
  ): Promise<{ message: string; roles: UserRole[] }> {
    await this.usersService.updateRoles(email, roles);
    return { 
      message: 'User roles updated successfully',
      roles 
    };
  }

  @Patch(':email/status')
  @ApiOperation({ 
    summary: 'Activar/Desactivar usuario (SuperAdmin)',
    description: 'Cambia el estado activo/inactivo de un usuario'
  })
  @ApiResponse({ status: 200, description: 'Estado del usuario actualizado' })
  async updateStatus(
    @Param('email') email: string,
    @Body('isActive') isActive: boolean,
  ): Promise<{ message: string; isActive: boolean }> {
    await this.usersService.updateStatus(email, isActive);
    return { 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      isActive 
    };
  }

  @Delete(':email')
  @ApiOperation({ 
    summary: 'Eliminar usuario (SuperAdmin)',
    description: 'Elimina permanentemente un usuario y sus relaciones'
  })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async remove(@Param('email') email: string): Promise<{ message: string }> {
    await this.usersService.delete(email);
    return { message: 'User deleted successfully' };
  }

  @Get(':email/groups')
  @ApiOperation({ 
    summary: 'Listar grupos del usuario (SuperAdmin)',
    description: 'Obtiene todos los grupos donde pertenece el usuario con roles'
  })
  @ApiResponse({ status: 200, description: 'Lista de grupos' })
  async getUserGroups(@Param('email') email: string) {
    return this.usersService.getUserGroups(email);
  }

  @Get(':email/activity')
  @ApiOperation({ 
    summary: 'Obtener historial de actividad del usuario (SuperAdmin)',
    description: 'Obtiene el historial de acciones realizadas por el usuario'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de actividad',
    schema: {
      example: {
        lastLogin: '2024-01-15T10:30:00Z',
        totalLogins: 45,
        lastActions: [],
        stats: {
          totalPurchases: 120,
          totalSales: 50
        }
      }
    }
  })
  async getUserActivity(@Param('email') email: string) {
    return this.usersService.getUserActivity(email);
  }

  @Post(':email/reset-password')
  @ApiOperation({ 
    summary: 'Resetear contraseña de usuario (SuperAdmin)',
    description: 'Genera una nueva contraseña temporal para el usuario'
  })
  @ApiResponse({ status: 200, description: 'Contraseña reseteada' })
  async resetPassword(
    @Param('email') email: string,
  ): Promise<{ message: string; temporaryPassword: string }> {
    const temporaryPassword = await this.usersService.resetPassword(email);
    return { 
      message: 'Password reset successfully',
      temporaryPassword 
    };
  }
}


