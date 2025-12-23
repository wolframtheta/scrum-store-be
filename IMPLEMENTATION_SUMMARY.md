# Resumen de Implementación - Sistema de Períodos de Pedido

## ✅ Implementado en Backend

### 1. Entidades creadas

#### `SupplySchedule`
- Configura la periodicidad de pedidos (semanal, mensual, custom, etc.)
- Define qué artículos están disponibles
- Duración de la ventana de pedido

#### `OrderPeriod`
- Ventanas de pedido concretas basadas en un schedule
- Estados: `open`, `closed`, `processing`, `delivered`
- Fechas de inicio, fin y entrega

#### `OrderPeriodArticle`
- **Snapshot de precios** para cada período
- Lista de artículos disponibles con precio fijado
- Flag de disponibilidad por artículo

### 2. Endpoints implementados

#### Supply Schedules (Managers only)
```
POST   /consumer-groups/:id/supply-schedules
GET    /consumer-groups/:id/supply-schedules
GET    /consumer-groups/:id/supply-schedules/:scheduleId
PUT    /consumer-groups/:id/supply-schedules/:scheduleId
DELETE /consumer-groups/:id/supply-schedules/:scheduleId
```

#### Order Periods (Managers only para create/update/delete)
```
POST   /consumer-groups/:id/supply-schedules/:scheduleId/periods
GET    /consumer-groups/:id/supply-schedules/periods/all
GET    /consumer-groups/:id/supply-schedules/periods/open
GET    /consumer-groups/:id/supply-schedules/periods/:periodId
PUT    /consumer-groups/:id/supply-schedules/periods/:periodId
DELETE /consumer-groups/:id/supply-schedules/periods/:periodId
```

#### Showcase (Todos los miembros)
```
GET    /consumer-groups/:id/supply-schedules/showcase
```
**Retorna**: Períodos abiertos con sus artículos y precios fijados

### 3. Modificaciones en Orders

- Añadido campo `orderPeriodId` (opcional) en `Order`
- DTO actualizado para aceptar `orderPeriodId` al crear pedido
- Respuesta incluye el período asociado

### 4. DTOs creados

- `CreateSupplyScheduleDto` / `UpdateSupplyScheduleDto`
- `SupplyScheduleResponseDto`
- `CreateOrderPeriodDto` / `UpdateOrderPeriodDto`
- `OrderPeriodResponseDto`
- `ShowcasePeriodDto` / `ShowcaseArticleItemDto`

## 🔄 Flujo de trabajo completo

### Manager:
1. **Crear Schedule**:
   ```json
   POST /consumer-groups/:id/supply-schedules
   {
     "name": "Pedido Verduras Semanales",
     "recurrenceType": "weekly",
     "articleIds": ["uuid1", "uuid2"],
     "orderWindowDays": 3
   }
   ```

2. **Abrir Período** (hace snapshot automático de precios):
   ```json
   POST /consumer-groups/:id/supply-schedules/:scheduleId/periods
   {
     "startDate": "2024-12-19T00:00:00Z",
     "endDate": "2024-12-21T18:00:00Z",
     "deliveryDate": "2024-12-23T00:00:00Z"
   }
   ```

3. **Cerrar Período**:
   ```json
   PUT /consumer-groups/:id/supply-schedules/periods/:periodId
   {
     "status": "closed"
   }
   ```

### Usuario:
1. **Ver aparador** (períodos abiertos):
   ```
   GET /consumer-groups/:id/supply-schedules/showcase
   ```

2. **Crear pedido** vinculado a período:
   ```json
   POST /consumer-groups/:id/orders
   {
     "consumerGroupId": "uuid",
     "orderPeriodId": "uuid",
     "items": [...]
   }
   ```

## 🎯 Ventajas del sistema

1. **Precios estables**: Una vez abierto el período, los precios no cambian
2. **Múltiples proveedores**: Varios períodos pueden estar abiertos simultáneamente
3. **Trazabilidad completa**: Historial de qué se pidió, cuándo y a qué precio
4. **Automatizable**: Fácil crear cron jobs para abrir períodos según recurrencia
5. **Sin mantenimiento manual**: No hace falta toggle `inShowcase` manualmente

## 📋 Próximos pasos sugeridos

### Frontend (pendiente):
1. Modificar `ShowcaseService` para llamar al nuevo endpoint
2. Actualizar `ShowcasePage` para mostrar períodos con countdown
3. Modificar `CartService` para incluir `orderPeriodId` al crear pedido
4. Crear vista de gestión de schedules (backoffice)
5. Crear vista de gestión de períodos (backoffice)

### Backoffice (pendiente):
1. CRUD de Supply Schedules
2. Gestión de Order Periods (abrir/cerrar/editar)
3. Dashboard con períodos activos
4. Reportes por período

### Opcional:
- Cron job para abrir períodos automáticamente según recurrencia
- Notificaciones cuando se abre/cierra un período
- Estadísticas de pedidos por período
