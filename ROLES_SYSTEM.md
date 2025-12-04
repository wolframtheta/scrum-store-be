# Sistema de Roles - Scrum Store

## Roles disponibles

El sistema cuenta con 3 roles principales. **Un usuario puede tener múltiples roles simultáneamente.**

### 1. **SuperAdmin** (`super_admin`)
- Acceso completo al sistema
- Puede crear usuarios con cualquier rol
- Puede modificar roles de usuarios
- Acceso a todas las funcionalidades administrativas

### 2. **Admin** (`admin`)
- Puede gestionar grupos de consumo (como manager)
- Puede gestionar catálogo y ventas
- Acceso al backoffice
- NO puede crear otros admins o superadmins (a menos que también tenga SuperAdmin)

### 3. **Client** (`client`)
- Usuario estándar
- Puede unirse a grupos de consumo
- Puede realizar compras
- Acceso a la aplicación móvil

## Roles múltiples

Un usuario puede tener varios roles simultáneamente. Por ejemplo:
- `[UserRole.CLIENT, UserRole.ADMIN]` - Puede usar la app móvil Y gestionar en el backoffice
- `[UserRole.SUPER_ADMIN, UserRole.CLIENT]` - SuperAdmin que también usa la app móvil
- `[UserRole.CLIENT]` - Solo usuario normal

## Asignación de roles

### Registro público (`POST /auth/register`)
- **Siempre** crea usuarios con `roles: [CLIENT]`
- No se puede especificar roles en el registro público por seguridad
- Endpoint sin autenticación

### Creación administrativa (`POST /users`)
- Solo accesible para `SuperAdmin`
- Puede especificar array de roles en el `CreateUserDto`
- Requiere autenticación con JWT
- Protegido con `@Roles(UserRole.SUPER_ADMIN)` y `RolesGuard`

## Uso de Guards de Roles

### RolesGuard
Verifica que el usuario autenticado tenga **AL MENOS UNO** de los roles requeridos.

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  // Solo SuperAdmin
  @Post('critical-action')
  @Roles(UserRole.SUPER_ADMIN)
  async criticalAction() {
    // Usuario debe tener SuperAdmin en su array de roles
  }

  // SuperAdmin O Admin
  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getDashboard() {
    // Usuario debe tener al menos uno de estos roles
  }

  // Cualquier usuario autenticado
  @Get('public-info')
  async getPublicInfo() {
    // Sin decorador @Roles(), cualquier usuario autenticado puede acceder
  }
}
```

## Flujo de autenticación con roles

1. Usuario se autentica (`POST /auth/login`)
2. Backend verifica credenciales y genera JWT
3. JWT incluye en el payload: `{ email, roles: [] }`
4. `JwtStrategy` valida token y añade usuario a request
5. `RolesGuard` verifica si usuario tiene AL MENOS uno de los roles requeridos
6. Si no tiene ningún rol requerido → `403 Forbidden`

## JWT Payload

El token JWT incluye:
```typescript
{
  email: string;
  sub: string;
  roles: UserRole[];
  iat: number;
  exp: number;
}
```

El objeto `req.user` disponible en controllers incluye:
```typescript
{
  email: string;
  name: string;
  surname: string;
  roles: UserRole[];
}
```

## Creación del primer SuperAdmin

Para crear el primer SuperAdmin del sistema, usar directamente la base de datos:

```sql
INSERT INTO users (email, name, surname, password, roles, created_at, updated_at)
VALUES (
  'admin@scrumstore.com',
  'Super',
  'Admin',
  '$2b$10$...', -- Hash de bcrypt
  ARRAY['super_admin']::user_role_enum[],
  NOW(),
  NOW()
);
```

## Validación de permisos

Los roles se validan a nivel de:
1. **Guard de rutas**: `RolesGuard` + decorador `@Roles()`
2. **JWT Strategy**: Incluye array de roles en `req.user`
3. **Base de datos**: Columna `roles` con array de enum

## Ejemplos de combinaciones de roles

```typescript
// Usuario normal
{ roles: [UserRole.CLIENT] }

// Admin que también es cliente
{ roles: [UserRole.CLIENT, UserRole.ADMIN] }

// SuperAdmin con todos los permisos
{ roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT] }

// Solo admin (sin acceso a app móvil)
{ roles: [UserRole.ADMIN] }
```

## Buenas prácticas

1. Nunca confiar en los roles del cliente - siempre validar en backend
2. Usar `RolesGuard` junto con `JwtAuthGuard`, nunca solo
3. El orden importa: primero `JwtAuthGuard`, luego `RolesGuard`
4. Los roles son acumulativos - más roles = más permisos
5. Para cambiar roles de usuario, crear endpoint protegido con `SuperAdmin`
6. Validar roles en el backend para operaciones sensibles, no solo en guards

