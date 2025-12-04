import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: any) {
    // Obtener email del payload (soportar múltiples formatos)
    const email = payload.email || payload.sub;
    
    if (!email) {
      throw new UnauthorizedException('Invalid token: no email found');
    }

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { 
      id: user.id,
      email: user.email, 
      name: user.name, 
      surname: user.surname,
      roles: user.roles 
    };
  }
}

