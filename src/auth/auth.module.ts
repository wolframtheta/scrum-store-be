import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}), // Configuration will be done in the service
    TypeOrmModule.forFeature([RefreshToken]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}

