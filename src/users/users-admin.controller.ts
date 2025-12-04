import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear usuario (Solo SuperAdmin)',
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
}


