import { Controller, Get, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ 
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Retorna la información completa del perfil del usuario que está autenticado' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil del usuario obtenido exitosamente', 
    type: UserResponseDto 
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido o expirado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getProfile(@Request() req): Promise<UserResponseDto> {
    const user = await this.usersService.findByEmailOrFail(req.user.email);
    return new UserResponseDto(user);
  }

  @Patch('me')
  @ApiOperation({ 
    summary: 'Actualizar perfil del usuario autenticado',
    description: 'Permite actualizar la información del perfil del usuario (nombre, apellidos, teléfono, contraseña)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil actualizado exitosamente', 
    type: UserResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido o expirado' })
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(req.user.email, updateUserDto);
  }
}

