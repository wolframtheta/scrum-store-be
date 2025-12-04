import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret-key',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
}));

