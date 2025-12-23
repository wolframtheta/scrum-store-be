# Showcase API - Order Periods

## Nueva arquitectura del Aparador

El aparador ahora está basado en **períodos de pedido abiertos** en lugar de un flag estático `inShowcase`.

## Endpoints

### 1. Obtener artículos del aparador (períodos abiertos)

```
GET /consumer-groups/:consumerGroupId/supply-schedules/showcase
```

**Autenticación**: Requerida (JWT + Member)

**Respuesta**:
```json
[
  {
    "periodId": "uuid",
    "periodName": "Pedido Verduras Semanales",
    "deliveryDate": "2024-12-23T00:00:00Z",
    "startDate": "2024-12-19T00:00:00Z",
    "endDate": "2024-12-21T18:00:00Z",
    "status": "open",
    "articles": [
      {
        "id": "period-article-uuid",
        "articleId": "article-uuid",
        "product": "Tomate",
        "variety": "Raf",
        "category": "Verduras",
        "pricePerUnit": 2.50,
        "unitMeasure": "kg",
        "image": "https://...",
        "producerName": "Huerto Ecológico",
        "isAvailable": true,
        "isEco": true,
        "isSeasonal": false,
        "description": "Tomates raf de temporada",
        "city": "Valencia"
      }
    ]
  }
]
```

### 2. Crear pedido con período

```
POST /consumer-groups/:consumerGroupId/orders
```

**Body**:
```json
{
  "consumerGroupId": "uuid",
  "orderPeriodId": "uuid",  // NUEVO: asocia el pedido al período
  "items": [
    {
      "articleId": "article-uuid",
      "quantity": 2.5,
      "pricePerUnit": 2.50
    }
  ]
}
```

## Flujo de trabajo

### Manager:
1. Crea `SupplySchedule` con periodicidad
2. Abre `OrderPeriod` → automáticamente hace snapshot de precios
3. Los artículos aparecen en el aparador

### Usuario:
1. Ve períodos abiertos en el aparador
2. Añade artículos al carrito (pueden ser de diferentes períodos)
3. Al confirmar, se crea `Order` vinculado al `orderPeriodId`

## Ventajas

✅ Precios estables durante la ventana
✅ Múltiples proveedores simultáneos
✅ Countdown automático (cierre de ventana)
✅ Historial completo de qué se pidió y cuándo
✅ No requiere mantenimiento manual del flag `inShowcase`

## Deprecación

El campo `inShowcase` en artículos queda obsoleto. Ahora el aparador se determina por:
- Períodos con `status: 'open'`
- `endDate` mayor que fecha actual

