import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { readFileSync } from 'fs';
import { AppModule } from './app.module';

// Leer versión del package.json
const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
const appVersion = packageJson.version;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const configService = app.get(ConfigService);
  
  // Serve static files (images)
  app.useStaticAssets(join(process.cwd(), 'images'), {
    prefix: '/images/',
  });
  
  // Security
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be loaded from different origins
  }));
  
  // CORS
  
  app.enableCors({
    origin: true, // En dev permite todos los origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  });
  
  // Compression
  app.use(compression());
  
  // Global prefix
  const apiPrefix = configService.get('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix);
  
  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Class serializer interceptor for DTOs with @Exclude/@Expose
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Scrum Store API')
    .setDescription('API REST para la gestión de grupos de consumo - Scrum Store')
    .setVersion(appVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduce tu JWT token',
        in: 'header',
      },
      'JWT-auth', // Este nombre se usará en @ApiBearerAuth('JWT-auth')
    )
    .addTag('auth', 'Autenticación y autorización')
    .addTag('users', 'Gestión de usuarios')
    .addTag('consumer-groups', 'Gestión de grupos de consumo')
    .addTag('articles', 'Gestión de artículos/catálogo')
    .addTag('sales', 'Gestión de ventas y pedidos')
    .addTag('notices', 'Avisos del grupo')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Scrum Store API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });
  
  const port = configService.get('app.port');
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/docs`);
  console.log(`🖼️  Images served at: http://localhost:${port}/images`);
}

bootstrap();
