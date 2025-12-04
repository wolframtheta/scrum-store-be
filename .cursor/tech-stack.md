# Tech Stack & Configuration - Backend

## Tecnologías Principales

### Framework & Runtime
- **NestJS**: v11.x - Framework backend progresivo
- **Node.js**: v20+ - Runtime JavaScript
- **TypeScript**: v5.7+ - Tipado estático

### Base de Datos
- **PostgreSQL**: v15+
- **TypeORM**: ORM
- **pg**: Driver PostgreSQL

### Autenticación & Seguridad
- **@nestjs/jwt** + **passport-jwt**: JWT tokens
- **bcrypt**: Hash de passwords
- **helmet**: Headers de seguridad
- **@nestjs/throttler**: Rate limiting

### Storage
- **AWS S3**: @aws-sdk/client-s3 para imágenes

### Validación & Transformación
- **class-validator**: Validación de DTOs
- **class-transformer**: Transformación de objetos

### Documentación
- **@nestjs/swagger**: OpenAPI/Swagger

### Utilidades
- **@nestjs/config**: Gestión de configuración
- **compression**: Compresión HTTP
- **winston** o **pino**: Logging

---

## Variables de Entorno

Crear archivo `.env.development` y `.env.production` con:

### Application
- `NODE_ENV` - development | production | test
- `PORT` - Puerto del servidor (default: 3000)
- `API_PREFIX` - Prefijo API (default: api/v1)

### Database
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`
- `DATABASE_PASSWORD`, `DATABASE_NAME`
- `DATABASE_SYNCHRONIZE` - true solo en development
- `DATABASE_LOGGING` - true en development

### JWT
- `JWT_SECRET` - Secret para access token
- `JWT_EXPIRES_IN` - Tiempo expiración (15m)
- `REFRESH_TOKEN_SECRET` - Secret para refresh token
- `REFRESH_TOKEN_EXPIRES_IN` - Tiempo expiración (7d)

### AWS S3
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`

### CORS
- `CORS_ORIGINS` - Origins permitidos (separados por coma)

### Rate Limiting
- `THROTTLE_TTL` - Tiempo ventana (segundos)
- `THROTTLE_LIMIT` - Límite de requests

---

## Configuración con @nestjs/config

### ⚠️ REGLA: NO usar `process.env` directamente

**Estructura requerida:**
- Crear directorio `src/config/`
- Un archivo por módulo usando `registerAs()`
- ConfigModule global en AppModule
- Acceder siempre vía ConfigService

**Archivos a crear:**

1. **app.config.ts**
   - Puerto, entorno, CORS, throttle

2. **database.config.ts**
   - Configuración completa de TypeORM
   - Host, puerto, credenciales, opciones

3. **jwt.config.ts**
   - Secrets y tiempos de expiración
   - Para access y refresh tokens

4. **storage.config.ts**
   - Credenciales AWS
   - Bucket y región
   - Folders por tipo de archivo

### Configuración en AppModule
- ConfigModule.forRoot con isGlobal: true
- Cargar todos los archivos de config con load: [...]
- Especificar envFilePath según NODE_ENV

### Uso en servicios
- Inyectar ConfigService
- Acceder con configService.get('namespace.key')
- Type-safe usando interfaces

---

## Configuración TypeORM

Configurar TypeORM usando ConfigService:
- TypeOrmModule.forRootAsync
- Factory que usa ConfigService
- No hardcodear valores de conexión

**Configuración debe incluir:**
- Tipo de DB (postgres)
- Credenciales de conexión
- Ruta de entities (auto-discovery)
- Opciones de migraciones
- Logging según entorno

---

## Configuración AWS S3

Crear cliente S3 en StorageService:
- Usar ConfigService para credenciales
- Región configurable
- Bucket configurable
- Estructura de folders definida

**Folders recomendados:**
- users/profiles - Avatares
- groups - Imágenes de grupos
- articles - Imágenes de productos
- messages - Imágenes de mensajes

---

## Configuración JWT

Configurar JwtModule usando ConfigService:
- Secret dinámico
- Tiempo de expiración configurable
- Diferentes configs para access/refresh

**AuthModule debe:**
- Registrar JwtModule.registerAsync
- Configurar Passport strategies
- Implementar guards personalizados

---

## Main.ts

Configurar aplicación usando ConfigService:
- Obtener instancia con app.get(ConfigService)
- Puerto desde configuración
- CORS origins desde configuración
- API prefix desde configuración
- Configurar Swagger docs
- Helmet y compression
- ValidationPipe global
- Mostrar URL y entorno al iniciar

---

## Docker Compose (Desarrollo)

Crear docker-compose.yml con:
- Servicio PostgreSQL
- Volúmenes para persistencia
- Puertos mapeados
- Variables de entorno

Opcionalmente Redis para caching.

---

## Scripts NPM

Configurar en package.json:
- `start:dev` - Desarrollo con watch
- `start:debug` - Debug mode
- `start:prod` - Producción
- `build` - Compilar
- `lint` - ESLint
- `format` - Prettier
- `migration:generate/run/revert` - Migraciones

---

## Convenciones de Código

### Nomenclatura
- **Entidades**: PascalCase singular (User, Article)
- **DTOs**: PascalCase + sufijo (CreateUserDto)
- **Servicios**: PascalCase + Service
- **Controladores**: PascalCase + Controller

### Estructura de módulo
```
module/
├── dto/
├── entities/
├── guards/
├── module.controller.ts
├── module.service.ts
└── module.module.ts
```

### Decoradores Swagger
- @ApiTags en controladores
- @ApiOperation en endpoints
- @ApiResponse para respuestas
- @ApiBearerAuth en rutas protegidas
- @ApiProperty en DTOs

---

## Logging

Usar Logger de NestJS:
- Instanciar en cada clase
- Log de operaciones importantes
- Errores con contexto
- No loguear información sensible

---

## Seguridad

### Implementar
- Helmet para headers HTTP
- CORS con origins específicos
- Rate limiting con Throttler
- Validación estricta de DTOs
- Sanitización de inputs
- Hash de passwords con bcrypt

### NO hacer
- Exponer información sensible en errores
- Loguear passwords o tokens
- Permitir CORS de cualquier origin
- Usar process.env directamente
