# API Endpoints Documentation

Base URL: `/api/v1`

## Autenticación

### POST /auth/register
Registro de nuevo usuario.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "Joan",
  "surname": "Garcia",
  "phone": "612345678"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "email": "user@example.com",
    "name": "Joan",
    "surname": "Garcia",
    "phone": "612345678"
  }
}
```

---

### POST /auth/login
Login de usuario.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "email": "user@example.com",
    "name": "Joan",
    "surname": "Garcia"
  }
}
```

---

### POST /auth/refresh
Refrescar access token.

**Body:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

---

### POST /auth/logout
Cerrar sesión (invalidar refresh token).

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

## Usuarios

### GET /users/me
Obtener perfil del usuario autenticado.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "email": "user@example.com",
  "name": "Joan",
  "surname": "Garcia",
  "phone": "612345678",
  "profile_image": "https://s3.../profile.jpg"
}
```

---

### PATCH /users/me
Actualizar perfil del usuario.

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "name": "Joan",
  "surname": "Garcia Martinez",
  "phone": "612345679"
}
```

**Response:** `200 OK`

---

### POST /users/me/profile-image
Subir imagen de perfil.

**Headers:** 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Body:** FormData con campo `image`

**Response:** `200 OK`
```json
{
  "profile_image": "https://s3.amazonaws.com/bucket/users/xxx.jpg"
}
```

---

## Grupos de Consumo

### GET /consumer-groups
Obtener todos los grupos del usuario autenticado.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Grup de Consum Barcelona",
    "description": "...",
    "city": "Barcelona",
    "address": "Carrer...",
    "image": "https://s3.../group.jpg",
    "opening_schedule": {...},
    "user_role": {
      "is_client": true,
      "is_manager": false,
      "is_default": true
    }
  }
]
```

---

### GET /consumer-groups/:id
Obtener detalle de un grupo de consumo.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### POST /consumer-groups
Crear nuevo grupo de consumo (requiere ser gestor).

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "email": "grup@example.com",
  "name": "Grup de Consum BCN",
  "description": "Grup de consum ecològic",
  "city": "Barcelona",
  "address": "Carrer Example 123",
  "opening_schedule": {
    "monday": {"open": "09:00", "close": "18:00", "closed": false}
  }
}
```

**Response:** `201 Created`

---

### PATCH /consumer-groups/:id
Actualizar grupo de consumo (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### POST /consumer-groups/:id/join
Unirse a un grupo de consumo (mediante invitación).

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "invitation_token": "token_or_email"
}
```

**Response:** `200 OK`

---

### DELETE /consumer-groups/:id/leave
Abandonar un grupo de consumo.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### PATCH /consumer-groups/:id/set-default
Marcar grupo como predeterminado.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### GET /consumer-groups/:id/members
Obtener miembros del grupo.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
[
  {
    "email": "user@example.com",
    "name": "Joan",
    "surname": "Garcia",
    "profile_image": "...",
    "is_client": true,
    "is_manager": false,
    "joined_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### PATCH /consumer-groups/:id/members/:email/role
Actualizar rol de un miembro (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "is_client": true,
  "is_manager": false
}
```

**Response:** `200 OK`

---

### DELETE /consumer-groups/:id/members/:email
Eliminar miembro del grupo (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### GET /consumer-groups/:id/is-open
Verificar si el grupo está abierto en este momento.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "is_open": true,
  "current_schedule": {
    "open": "09:00",
    "close": "18:00"
  }
}
```

---

## Artículos

### GET /articles
Obtener artículos del grupo de consumo.

**Headers:** `Authorization: Bearer <access_token>`

**Query Params:**
- `consumer_group_id` (required): UUID del grupo
- `in_showcase` (optional): true/false - Filtrar por aparador
- `search` (optional): Búsqueda por nombre

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Tomàquets ecològics",
    "description": "Tomàquets de la terra",
    "image": "https://s3.../tomatoes.jpg",
    "unit_type": "weight",
    "unit_measure": "kg",
    "price_per_unit": 3.50,
    "city": "Girona",
    "producer": "Mas Can Boix",
    "in_showcase": true,
    "max_quantity": 50.0,
    "ordered_quantity": 12.5
  }
]
```

---

### GET /articles/:id
Obtener detalle de un artículo.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### GET /articles/:id/price-history
Obtener histórico de precios.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
[
  {
    "price_per_unit": 3.50,
    "changed_at": "2024-01-15T10:00:00Z"
  },
  {
    "price_per_unit": 3.20,
    "changed_at": "2024-01-01T10:00:00Z"
  }
]
```

---

### POST /articles
Crear artículo (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "consumer_group_id": "uuid",
  "name": "Tomàquets ecològics",
  "description": "Tomàquets de la terra",
  "unit_type": "weight",
  "unit_measure": "kg",
  "price_per_unit": 3.50,
  "city": "Girona",
  "producer": "Mas Can Boix",
  "in_showcase": true,
  "max_quantity": 50.0
}
```

**Response:** `201 Created`

---

### PATCH /articles/:id
Actualizar artículo (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### DELETE /articles/:id
Eliminar artículo (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### POST /articles/:id/image
Subir imagen de artículo (solo gestores).

**Headers:** 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Body:** FormData con campo `image`

**Response:** `200 OK`

---

### DELETE /articles/:id/image
Eliminar imagen de artículo (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### PATCH /articles/:id/toggle-showcase
Agregar/quitar artículo del aparador (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "in_showcase": true
}
```

**Response:** `200 OK`

---

## Ventas

### POST /sales
Crear nueva venta (tramitar pedido).

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "consumer_group_id": "uuid",
  "items": [
    {
      "article_id": "uuid",
      "quantity": 2.5
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "total_price": 8.75,
  "total_paid": 0,
  "is_fully_paid": false,
  "sale_date": "2024-01-15T10:30:00Z",
  "items": [...]
}
```

---

### GET /sales
Obtener ventas del usuario autenticado.

**Headers:** `Authorization: Bearer <access_token>`

**Query Params:**
- `consumer_group_id` (optional): Filtrar por grupo

**Response:** `200 OK`

---

### GET /sales/:id
Obtener detalle de una venta.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "user": {
    "email": "user@example.com",
    "name": "Joan",
    "surname": "Garcia"
  },
  "consumer_group_id": "uuid",
  "total_price": 8.75,
  "total_paid": 0,
  "is_fully_paid": false,
  "sale_date": "2024-01-15T10:30:00Z",
  "items": [
    {
      "article": {
        "id": "uuid",
        "name": "Tomàquets ecològics"
      },
      "quantity": 2.5,
      "unit_price": 3.50,
      "total_price": 8.75,
      "amount_paid": 0,
      "is_fully_paid": false
    }
  ]
}
```

---

### GET /sales/by-group/:groupId
Obtener todas las ventas de un grupo (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Query Params:**
- `is_fully_paid` (optional): true/false - Filtrar por estado de pago

**Response:** `200 OK`

---

### PATCH /sales/:id/payment
Registrar pago (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "items": [
    {
      "item_id": "uuid",
      "amount_paid": 8.75
    }
  ]
}
```

**Response:** `200 OK`

---

### PATCH /sales/:id/pay-full
Marcar venta como pagada completamente (solo gestores).

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---


## Avisos (Notices)

Tots els endpoints d'avisos requereixen autenticació.

### GET /notices/group/:groupId
Obtenir avisos d'un grup (amb paginació).

**Headers:** `Authorization: Bearer <access_token>`

**Query Params:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Avisos por página (default: 20)

**Response:** `200 OK`
```json
{
  "notices": [
    {
      "id": "uuid",
      "content": "Recordeu que demà tanquem més tard!",
      "imageUrl": "https://s3.../notice.jpg",
      "author": {
        "email": "gestor@example.com",
        "firstName": "Joan",
        "lastName": "Garcia",
        "profileImageUrl": "..."
      },
      "groupId": "uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "pages": 1
}
```

---

### POST /notices
Crear avís (només gestors).

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "groupId": "uuid",
  "content": "Recordeu que demà tanquem més tard!"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "content": "Recordeu que demà tanquem més tard!",
  "author": {
    "email": "gestor@example.com",
    "firstName": "Joan",
    "lastName": "Garcia",
    "profileImageUrl": "..."
  },
  "groupId": "uuid",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `403 Forbidden`: Si l'usuari no és gestor del grup

---

### GET /notices/:id
Obtenir un avís per ID.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

**Errors:**
- `404 Not Found`: Avís no trobat
- `403 Forbidden`: L'usuari no és membre del grup

---

### PATCH /notices/:id
Actualitzar avís (només el creador).

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "content": "Contingut actualitzat"
}
```

**Response:** `200 OK`

**Errors:**
- `403 Forbidden`: Si l'usuari no és el creador de l'avís
- `404 Not Found`: Avís no trobat

---

### POST /notices/:id/image
Agregar o actualitzar imatge d'un avís (només el creador).

**Headers:** 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Body:** FormData amb camp `image`

**Response:** `200 OK`

**Errors:**
- `403 Forbidden`: Si l'usuari no és el creador de l'avís
- `404 Not Found`: Avís no trobat

---

### DELETE /notices/:id
Eliminar avís (creador o gestor del grup).

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

**Errors:**
- `403 Forbidden`: Si l'usuari no és el creador ni gestor
- `404 Not Found`: Avís no trobat

---

## Storage

### POST /storage/upload
Subir archivo genérico a S3.

**Headers:** 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Body:** FormData con campo `file` y `folder`

**Response:** `200 OK`
```json
{
  "url": "https://s3.amazonaws.com/bucket/folder/file.jpg"
}
```

---

## Códigos de Estado

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: Sin permisos
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (ej: email duplicado)
- `500 Internal Server Error`: Error del servidor

---

## Autenticación de Endpoints

Todos los endpoints excepto `/auth/register` y `/auth/login` requieren el header:
```
Authorization: Bearer <access_token>
```

## Guards de Permisos

- **IsManager**: Solo gestores del grupo pueden acceder
- **IsClient**: Solo clientes del grupo pueden acceder
- **IsMember**: Usuario debe pertenecer al grupo
- **IsOwner**: Solo el propietario del recurso puede acceder

