import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Create user - Force CLIENT role for public registration
    const user = await this.usersService.create({
      ...registerDto,
      roles: undefined, // Siempre será [CLIENT] por defecto en la entidad
    });

    // Generate tokens
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Validate user credentials
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }


    // Generate tokens
    const userResponse = new UserResponseDto(user);
    return this.generateTokens(userResponse);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async generateTokens(user: UserResponseDto): Promise<AuthResponseDto> {
    const payload = { email: user.email, sub: user.email };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshTokenSecret'),
      expiresIn: this.configService.get('jwt.refreshTokenExpiresIn'),
    });

    // Store refresh token
    await this.storeRefreshToken(user.email, refreshToken);

    return new AuthResponseDto({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
      user,
    });
  }

  async refreshToken(token: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.refreshTokenSecret'),
      });

      // Check if token exists and is not revoked
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token, revoked: false },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Get user
      const user = await this.usersService.findByEmailOrFail(payload.email);
      const userResponse = new UserResponseDto(user);

      // Revoke old token
      await this.revokeRefreshToken(token);

      // Generate new tokens
      return this.generateTokens(userResponse);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<void> {
    await this.revokeRefreshToken(token);
  }

  private async storeRefreshToken(userEmail: string, token: string): Promise<void> {
    const expiresIn = this.configService.get('jwt.refreshTokenExpiresIn');
    const expirationDate = new Date();

    // Parse expiration (e.g., '7d' to 7 days)
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];

      switch (unit) {
        case 's':
          expirationDate.setSeconds(expirationDate.getSeconds() + value);
          break;
        case 'm':
          expirationDate.setMinutes(expirationDate.getMinutes() + value);
          break;
        case 'h':
          expirationDate.setHours(expirationDate.getHours() + value);
          break;
        case 'd':
          expirationDate.setDate(expirationDate.getDate() + value);
          break;
      }
    }

    const refreshToken = this.refreshTokenRepository.create({
      userEmail,
      token,
      expiresAt: expirationDate,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  private async revokeRefreshToken(token: string): Promise<void> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    if (storedToken) {
      storedToken.revoked = true;
      await this.refreshTokenRepository.save(storedToken);
    }
  }

  async revokeAllUserTokens(userEmail: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userEmail, revoked: false },
      { revoked: true },
    );
  }
}

