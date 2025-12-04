# Arquitectura del Backend - Scrum Store

## Visión General

Backend NestJS con PostgreSQL que proporciona una API RESTful para gestionar grupos de consumo, catálogo de productos, usuarios y ventas.

## Stack Tecnológico

- **Framework**: NestJS 11.x
- **Base de datos**: PostgreSQL con TypeORM
- **Autenticación**: JWT con Refresh Tokens
- **Storage**: AWS S3 (imágenes)
- **Validación**: class-validator + class-transformer
- **Documentación API**: Swagger/OpenAPI

## Estructura de Módulos

```
src/
├── config/                  # Archivos de configuración centralizados
├── auth/                    # Autenticación y autorización
├── users/                   # Gestión de usuarios
├── consumer-groups/         # Grupos de consumo
├── articles/                # Catálogo de artículos
├── sales/                   # Relación de ventas
├── messages/                # Muro de publicaciones
├── user-groups/             # Relación usuarios-grupos
├── storage/                 # Servicio S3
├── common/                  # Utilidades compartidas
└── database/                # Migraciones y seeders
```

## Principios de Diseño

1. **Domain-Driven Design**: Cada módulo representa un dominio del negocio
2. **SOLID Principles**: Aplicados en servicios y controladores
3. **Repository Pattern**: Capa de acceso a datos abstracta
4. **DTO Pattern**: Validación y transformación de datos
5. **Guards & Interceptors**: Seguridad y transformación de respuestas
6. **Configuration Files**: Uso de archivos de configuración centralizados con @nestjs/config

## Gestión de Configuración

### ⚠️ IMPORTANTE: NO usar `process.env` directamente

Todo debe gestionarse a través de **ConfigModule** y **ConfigService**:

- Crear archivos de configuración en `src/config/` usando `registerAs()`
- Cada módulo (app, database, jwt, storage) tiene su propio archivo
- ConfigModule configurado como global
- Soporte para múltiples entornos (`.env.development`, `.env.production`)
- Acceso type-safe a través de ConfigService

**Archivos de configuración requeridos:**
- `app.config.ts` - Puerto, entorno, CORS, API prefix
- `database.config.ts` - Conexión TypeORM
- `jwt.config.ts` - Secrets y tiempos de expiración
- `storage.config.ts` - Credenciales y bucket de AWS S3

## Seguridad

- **JWT Access Token**: 15 minutos de validez
- **Refresh Token**: 7 días, almacenado en DB, revocable
- **RBAC**: Roles de Client y Gestor por grupo
- **Rate Limiting**: Throttler configurado
- **CORS**: Origins configurados
- **Helmet**: Headers de seguridad
- **Password Hashing**: bcrypt con salt rounds

## Flujo de Autenticación

1. Login: email + password → Access Token + Refresh Token
2. Todas las requests usan header: `Authorization: Bearer <token>`
3. Token expirado → Refresh automático con Refresh Token
4. Logout → Invalidar Refresh Token en DB

## Arquitectura por Capas

### Controller Layer
- Maneja HTTP requests/responses
- Validación de DTOs con class-validator
- Documentación Swagger

### Service Layer
- Lógica de negocio
- Transacciones de base de datos
- Interacción con repositorios

### Repository Layer (TypeORM)
- Acceso a datos
- Queries y relaciones
- Entidades con decoradores TypeORM

### Guards & Interceptors
- Guards: AuthGuard, RolesGuard, IsMemberGuard
- Interceptors: Logging, Transform, Error handling

## Base de Datos

Ver `database-schema.md` para el esquema completo con todas las tablas, relaciones e índices.

## API Endpoints

Ver `api-endpoints.md` para documentación detallada de todos los endpoints REST.

## Documentación API

Swagger configurado en `/api/docs`:
- Descripción de todos los endpoints
- Esquemas de request/response
- Autenticación Bearer
- Try-it-out funcional
