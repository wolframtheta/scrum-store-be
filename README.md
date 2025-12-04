# Scrum Store Backend

Backend para la plataforma de gestión de grupos de consumo Scrum Store.

## Stack Tecnológico

- **Framework**: NestJS 11
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM
- **Authentication**: JWT + Refresh Tokens
- **Storage**: AWS S3
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL 15+
- AWS Account (para S3)

### Installation

```bash
# Instalar dependencias
pnpm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales (ver sección Environment Variables abajo)
```

**Importante**: El archivo `.env` es necesario para que la aplicación funcione. Asegúrate de crearlo copiando `.env.example` y ajustando los valores según tu entorno.

### Database Setup

**Opción 1: Usando Docker (Recomendado)**

```bash
# Levanta PostgreSQL con Docker (crea automáticamente la base de datos)
docker-compose up -d

# Verifica que esté corriendo
docker-compose ps
```

**Opción 2: PostgreSQL Local**

```bash
# Crea la base de datos manualmente
createdb scrum_store
# o
psql -U postgres -c "CREATE DATABASE scrum_store;"
```

**Nota**: TypeORM con `DATABASE_SYNCHRONIZE=true` creará automáticamente todas las tablas y columnas basándose en las entidades al arrancar la aplicación. **Solo usar en desarrollo**.

### Environment Variables

El proyecto usa el archivo `.env` para la configuración. Todas las variables están gestionadas por `ConfigService` de NestJS.

#### Variables obligatorias:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `DATABASE_HOST` | Host de PostgreSQL | `localhost` |
| `DATABASE_PORT` | Puerto de PostgreSQL | `5432` |
| `DATABASE_USER` | Usuario de PostgreSQL | `postgres` |
| `DATABASE_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `DATABASE_NAME` | Nombre de la base de datos | `scrum_store` |
| `JWT_SECRET` | Secret para JWT (¡cámbialo en producción!) | `tu-secret-seguro` |
| `REFRESH_TOKEN_SECRET` | Secret para refresh tokens | `otro-secret-seguro` |

#### Variables opcionales:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `API_PREFIX` | Prefijo de la API | `api/v1` |
| `JWT_EXPIRES_IN` | Expiración del access token | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Expiración del refresh token | `7d` |
| `DATABASE_SYNCHRONIZE` | Auto-crear tablas (solo dev) | `false` |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | `http://localhost:4200` |
| `THROTTLE_TTL` | Tiempo de rate limiting (segundos) | `60` |
| `THROTTLE_LIMIT` | Límite de requests por TTL | `10` |

**⚠️ Importante para Producción:**
- Cambia todos los secrets (JWT_SECRET, REFRESH_TOKEN_SECRET)
- Establece `DATABASE_SYNCHRONIZE=false`
- Usa variables de entorno seguras (no hardcodeadas)
- Configura `NODE_ENV=production`

## Running the app

```bash
# Development
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

## API Documentation

Una vez la aplicación esté corriendo, la documentación Swagger estará disponible en:

```
http://localhost:3000/api/docs
```

## Project Structure

```
src/
├── config/          # Archivos de configuración
├── auth/            # Módulo de autenticación
├── users/           # Módulo de usuarios
├── consumer-groups/ # Módulo de grupos de consumo
├── articles/        # Módulo de artículos/catálogo
├── sales/           # Módulo de ventas
├── messages/        # Módulo de mensajes/muro
├── storage/         # Módulo de almacenamiento S3
├── common/          # Guards, decorators, interceptors
├── app.module.ts
└── main.ts
```

## Development

```bash
# Linting
pnpm run lint

# Testing
pnpm run test

# E2E Testing
pnpm run test:e2e
```

## License

UNLICENSED
