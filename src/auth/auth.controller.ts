import { Controller, Post, Body, UseGuards, Get, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Registrar un nuevo usuario',
    description: 'Crea una nueva cuenta de usuario en el sistema. Retorna tokens JWT para autenticación inmediata.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario registrado exitosamente. Retorna access token y refresh token.', 
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos - Verifica que todos los campos requeridos estén presentes y sean válidos' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario con email y contraseña. Retorna tokens JWT (access y refresh).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso. Retorna access token (válido 15min) y refresh token (válido 7 días).', 
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas - Email o contraseña incorrectos' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Renovar access token',
    description: 'Genera un nuevo access token usando un refresh token válido. El refresh token también se renueva.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token renovado exitosamente. Retorna nuevos access y refresh tokens.', 
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido, expirado o revocado' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Cerrar sesión',
    description: 'Revoca el refresh token del usuario, invalidando su sesión. El access token seguirá siendo válido hasta que expire.'
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente. El refresh token ha sido revocado.' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido o expirado' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtener usuario autenticado',
    description: 'Retorna la información básica del usuario extraída del JWT token'
  })
  @ApiResponse({ status: 200, description: 'Información del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido o expirado' })
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  @Post('reset-password')
  @ApiOperation({ 
    summary: 'Restablecer contraseña',
    description: 'Permite a un usuario restablecer su contraseña proporcionando email y nueva contraseña'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraseña restablecida exitosamente', 
    schema: { type: 'object', properties: { message: { type: 'string' } } }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos - Las contraseñas no coinciden o son inválidas' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    // Validar que las contraseñas coincidan
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    await this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.password);
    return { message: 'Password reset successfully' };
  }
}

