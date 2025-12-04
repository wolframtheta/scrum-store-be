# Tareas del Backend - Scrum Store BE

## Fase 1: Setup Inicial y Configuración

### 1.1 Configuración del Proyecto
- [x] Instalar NestJS CLI
- [ ] Instalar dependencias principales:
  - TypeORM + PostgreSQL driver (pg)
  - @nestjs/jwt, @nestjs/passport, passport-jwt
  - bcrypt, class-validator, class-transformer
  - @nestjs/swagger
  - AWS SDK v3 (@aws-sdk/client-s3)
  - @nestjs/config
  - helmet, compression, cors
- [ ] Configurar `.env` con variables:
  - DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
  - JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN
  - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
  - PORT, NODE_ENV, API_PREFIX, CORS_ORIGINS

### 1.2 Archivos de Configuración ⚠️ IMPORTANTE
- [ ] Crear directorio `src/config/`
- [ ] Crear `config/app.config.ts` (puerto, entorno, CORS, throttle)
- [ ] Crear `config/database.config.ts` (configuración TypeORM)
- [ ] Crear `config/jwt.config.ts` (secrets y expires de JWT)
- [ ] Crear `config/storage.config.ts` (configuración AWS S3)
- [ ] Configurar ConfigModule en AppModule:
  - isGlobal: true
  - envFilePath según NODE_ENV
  - load: array con todos los archivos de config

### 1.3 Configuración de Base de Datos
- [ ] Configurar TypeORM con ConfigService (no usar process.env directamente)
- [ ] Configurar conexión a PostgreSQL
- [ ] Configurar migraciones automáticas (solo desarrollo)
- [ ] Crear script de inicialización de DB con tablas y índices

---

## Fase 2: Módulo de Usuarios ⭐ PRIORIDAD 1

### 2.1 Entidades
- [ ] Crear entidad `User` con todos los campos
- [ ] Configurar relaciones con otras entidades
- [ ] Implementar hooks (@BeforeInsert para hashear password)

### 2.2 DTOs
- [ ] CreateUserDto (validaciones con class-validator)
- [ ] UpdateUserDto
- [ ] UserResponseDto (excluir password)

### 2.3 Servicios
- [ ] UsersService:
  - create(createUserDto)
  - findByEmail(email)
  - findAll()
  - update(email, updateUserDto)
  - hashPassword(password)
  - comparePassword(password, hash)

### 2.4 Controladores
- [ ] GET /users/me - Obtener perfil del usuario autenticado
- [ ] PATCH /users/me - Actualizar perfil
- [ ] POST /users/me/profile-image - Subir imagen de perfil

---

## Fase 3: Módulo de Autenticación ⭐ PRIORIDAD 1

### 3.1 Estrategias y Guards
- [ ] Implementar JwtStrategy
- [ ] Implementar RefreshTokenStrategy
- [ ] Crear JwtAuthGuard
- [ ] Crear RolesGuard
- [ ] Crear decoradores personalizados (@CurrentUser, @Roles)

### 3.2 Entidades
- [ ] Crear entidad `RefreshToken`

### 3.3 DTOs
- [ ] LoginDto
- [ ] RegisterDto
- [ ] RefreshTokenDto
- [ ] AuthResponseDto

### 3.4 Servicios
- [ ] AuthService:
  - register(registerDto)
  - login(loginDto)
  - validateUser(email, password)
  - generateTokens(user)
  - refreshToken(refreshToken)
  - revokeRefreshToken(token)

### 3.5 Controladores
- [ ] POST /auth/register
- [ ] POST /auth/login
- [ ] POST /auth/refresh
- [ ] POST /auth/logout

---

## Fase 4: Módulo de Grupos de Consumo ⭐ PRIORIDAD 2

### 4.1 Entidades
- [ ] Crear entidad `ConsumerGroup`
- [ ] Crear entidad `UserConsumerGroup` (tabla relación)
- [ ] Configurar relaciones Many-to-Many con tabla intermedia

### 4.2 DTOs
- [ ] CreateConsumerGroupDto
- [ ] UpdateConsumerGroupDto
- [ ] ConsumerGroupResponseDto
- [ ] OpeningScheduleDto
- [ ] JoinGroupDto
- [ ] UpdateMemberRoleDto

### 4.3 Servicios
- [ ] ConsumerGroupsService:
  - create(createDto, managerEmail)
  - findAll()
  - findById(id)
  - findByUser(userEmail)
  - update(id, updateDto)
  - delete(id)
  - addMember(groupId, userEmail, roles)
  - removeMember(groupId, userEmail)
  - updateMemberRole(groupId, userEmail, roles)
  - setDefaultGroup(userEmail, groupId)
  - isOpen(groupId) - Calcular si está abierto según horario
  - getMembers(groupId)

### 4.4 Controladores
- [ ] GET /consumer-groups - Listar grupos del usuario
- [ ] GET /consumer-groups/:id - Detalle de grupo
- [ ] POST /consumer-groups - Crear grupo
- [ ] PATCH /consumer-groups/:id - Actualizar grupo (solo gestores)
- [ ] DELETE /consumer-groups/:id - Eliminar grupo (solo gestores)
- [ ] POST /consumer-groups/:id/join - Unirse a grupo
- [ ] DELETE /consumer-groups/:id/leave - Abandonar grupo
- [ ] PATCH /consumer-groups/:id/set-default - Marcar como predeterminado
- [ ] GET /consumer-groups/:id/members - Listar miembros
- [ ] PATCH /consumer-groups/:id/members/:email/role - Actualizar rol (solo gestores)
- [ ] DELETE /consumer-groups/:id/members/:email - Eliminar miembro (solo gestores)
- [ ] GET /consumer-groups/:id/is-open - Verificar si está abierto
- [ ] POST /consumer-groups/:id/image - Subir imagen del grupo

---

## Fase 5: Módulo de Artículos/Catálogo ⭐ PRIORIDAD 3

### 5.1 Entidades
- [ ] Crear entidad `Article`
- [ ] Crear entidad `ArticlePriceHistory`
- [ ] Configurar relaciones con ConsumerGroup

### 5.2 DTOs
- [ ] CreateArticleDto
- [ ] UpdateArticleDto
- [ ] ArticleResponseDto
- [ ] ArticleWithOrderedQuantityDto
- [ ] PriceHistoryDto
- [ ] ToggleShowcaseDto

### 5.3 Servicios
- [ ] ArticlesService:
  - create(createDto)
  - findAll(filters: { groupId, inShowcase?, search? })
  - findById(id)
  - update(id, updateDto)
  - delete(id)
  - toggleShowcase(id, inShowcase)
  - getPriceHistory(id)
  - savePriceHistory(articleId, newPrice) - Trigger al cambiar precio
  - getOrderedQuantity(articleId) - Calcular cantidad pedida en ventas activas

### 5.4 Controladores
- [ ] GET /articles - Listar artículos con filtros
- [ ] GET /articles/:id - Detalle de artículo
- [ ] GET /articles/:id/price-history - Histórico de precios
- [ ] POST /articles - Crear artículo (solo gestores)
- [ ] PATCH /articles/:id - Actualizar artículo (solo gestores)
- [ ] DELETE /articles/:id - Eliminar artículo (solo gestores)
- [ ] PATCH /articles/:id/toggle-showcase - Agregar/quitar del aparador (solo gestores)
- [ ] POST /articles/:id/image - Subir imagen
- [ ] DELETE /articles/:id/image - Eliminar imagen

---

## Fase 6: Módulo de Ventas ⭐ PRIORIDAD 3

### 6.1 Entidades
- [ ] Crear entidad `Sale`
- [ ] Crear entidad `SaleItem`
- [ ] Configurar relaciones con User, ConsumerGroup, Article

### 6.2 DTOs
- [ ] CreateSaleDto
- [ ] SaleItemDto
- [ ] SaleResponseDto
- [ ] SaleDetailDto
- [ ] PaymentDto
- [ ] PaymentItemDto

### 6.3 Servicios
- [ ] SalesService:
  - create(createDto, userEmail) - Crear pedido
  - findAll(filters: { userEmail?, groupId?, isFullyPaid? })
  - findById(id)
  - findByUser(userEmail)
  - findByGroup(groupId, filters?)
  - registerPayment(saleId, paymentDto) - Registrar pago parcial
  - markAsFullyPaid(saleId) - Marcar como pagado
  - calculateTotals(saleId) - Recalcular totales y estado
  - getUserDebt(userEmail, groupId) - Calcular deuda del usuario

### 6.4 Controladores
- [ ] POST /sales - Crear venta (tramitar pedido)
- [ ] GET /sales - Listar ventas del usuario
- [ ] GET /sales/:id - Detalle de venta
- [ ] GET /sales/by-group/:groupId - Listar ventas del grupo (solo gestores)
- [ ] PATCH /sales/:id/payment - Registrar pago (solo gestores)
- [ ] PATCH /sales/:id/pay-full - Marcar como pagado completamente (solo gestores)

---

## Fase 7: Módulo de Storage (AWS S3) 🔧 TRANSVERSAL

### 7.1 Configuración
- [ ] Configurar AWS SDK v3 con credenciales
- [ ] Crear StorageModule

### 7.2 Servicios
- [ ] StorageService:
  - uploadFile(file, folder) - Subir archivo a S3
  - deleteFile(url) - Eliminar archivo de S3
  - getSignedUrl(key) - Obtener URL firmada temporal
  - generateUniqueKey(originalName, folder) - Generar key único

### 7.3 Utilidades
- [ ] Crear Interceptor para validar tipos de archivo
- [ ] Crear Pipe para validar tamaño de archivo
- [ ] Implementar configuración de CORS en bucket S3

---

## Fase 8: Módulo de Mensajes/Muro ⭐ PRIORIDAD 4

### 8.1 Entidades
- [ ] Crear entidad `Message`
- [ ] Configurar relaciones con User y ConsumerGroup

### 8.2 DTOs
- [ ] CreateMessageDto
- [ ] UpdateMessageDto
- [ ] MessageResponseDto
- [ ] MessageWithSenderDto

### 8.3 Servicios
- [ ] MessagesService:
  - create(createDto, senderEmail)
  - findByGroup(groupId, pagination)
  - findById(id)
  - update(id, updateDto)
  - delete(id)
  - canDelete(messageId, userEmail, groupId) - Verificar permisos

### 8.4 Controladores
- [ ] GET /messages/:groupId - Listar mensajes del grupo con paginación
- [ ] POST /messages - Crear mensaje
- [ ] POST /messages/:id/image - Agregar imagen a mensaje
- [ ] DELETE /messages/:id - Eliminar mensaje (autor o gestor)

---

## Fase 9: Seguridad y Middleware 🔒

### 9.1 Guards y Decoradores
- [ ] IsManagerGuard - Verificar que el usuario es gestor del grupo
- [ ] IsClientGuard - Verificar que el usuario es cliente del grupo
- [ ] IsMemberGuard - Verificar que el usuario pertenece al grupo
- [ ] IsOwnerGuard - Verificar que el usuario es dueño del recurso
- [ ] @CurrentUser decorator - Extraer usuario del request
- [ ] @UserGroups decorator - Extraer grupos del usuario

### 9.2 Middleware y Filtros
- [ ] Implementar GlobalExceptionFilter
- [ ] Implementar ValidationPipe global
- [ ] Configurar Helmet para seguridad HTTP
- [ ] Configurar CORS para mobile app y backoffice
- [ ] Implementar Rate Limiting con @nestjs/throttler
- [ ] Logger personalizado con Winston o Pino

### 9.3 Interceptors
- [ ] TransformResponseInterceptor - Normalizar respuestas
- [ ] LoggingInterceptor - Log de requests y responses

---

## Fase 10: Documentación y Testing 📚

### 10.1 Swagger/OpenAPI
- [ ] Configurar @nestjs/swagger
- [ ] Documentar todos los endpoints con decoradores
- [ ] Generar esquemas de DTOs
- [ ] Agregar ejemplos de requests y responses
- [ ] Configurar autenticación Bearer en Swagger UI

### 10.2 Scripts y Utilidades
- [ ] Script de seed para datos de prueba
- [ ] Script de migración de datos
- [ ] Documentación de deployment
- [ ] Archivo docker-compose.yml para desarrollo local

---

## Fase 11: Optimizaciones y Features Avanzadas 🚀

### 11.1 Performance
- [ ] Implementar caching con @nestjs/cache-manager (Redis)
- [ ] Optimizar queries N+1 con eager loading
- [ ] Implementar paginación consistente en todos los listados
- [ ] Agregar índices adicionales en DB según análisis de queries

### 11.2 Features Adicionales
- [ ] Sistema de invitaciones por email
- [ ] Generar token de invitación único por grupo
- [ ] Notificaciones por email (opcional)
- [ ] Export de ventas a CSV/Excel (solo gestores)
- [ ] Estadísticas del grupo (ventas totales, artículos más vendidos)
- [ ] Dashboard de métricas para gestores

---

## Orden de Implementación Recomendado

1. **Setup + Database** (Fase 1)
2. **Users + Auth** (Fases 2-3) ⭐
3. **Storage S3** (Fase 7) - Necesario para siguientes fases
4. **Consumer Groups** (Fase 4) ⭐
5. **Articles** (Fase 5) ⭐
6. **Sales** (Fase 6) ⭐
7. **Messages** (Fase 8) ⭐
8. **Security** (Fase 9)
9. **Documentation** (Fase 10)
10. **Optimizations** (Fase 11)

---

## Dependencias Entre Módulos

```
Auth ← Users
ConsumerGroups ← Users
Articles ← ConsumerGroups
Sales ← Users + ConsumerGroups + Articles
Messages ← Users + ConsumerGroups
Storage ← (todos los que usan imágenes)
```

---

## Notas Importantes

- ⚠️ **USAR ARCHIVOS DE CONFIGURACIÓN**: Nunca usar `process.env` directamente en el código. Siempre usar ConfigService para acceder a la configuración.
- Todos los endpoints de gestores deben validar con `IsManagerGuard`
- Implementar soft-delete en entidades críticas
- Usar transacciones para operaciones que afectan múltiples tablas (ej: crear venta)
- Validar pertenencia a grupo antes de cualquier operación
- Sanitizar inputs para prevenir XSS
- Implementar rate limiting especialmente en endpoints de autenticación

