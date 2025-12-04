# Esquema de Base de Datos

## Tablas

### users (Usuarios)

```sql
CREATE TABLE users (
  email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  profile_image VARCHAR(500),              -- URL S3
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

**Campos:**
- `email`: Email único del usuario (PK)
- `name`: Nombre
- `surname`: Apellidos
- `phone`: Teléfono
- `profile_image`: URL de imagen en S3 (opcional)
- `password_hash`: Hash bcrypt del password
- `created_at`: Fecha de creación
- `updated_at`: Fecha de actualización

---

### consumer_groups (Grupos de Consumo)

```sql
CREATE TABLE consumer_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,      -- Email del grupo
  name VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(255) NOT NULL,
  address TEXT,
  image VARCHAR(500),                       -- URL S3
  opening_schedule JSONB,                   -- {monday: {open: "09:00", close: "18:00"}, ...}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_consumer_groups_city ON consumer_groups(city);
CREATE INDEX idx_consumer_groups_email ON consumer_groups(email);
```

**opening_schedule JSON structure:**
```json
{
  "monday": {"open": "09:00", "close": "18:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
  "thursday": {"open": "09:00", "close": "18:00", "closed": false},
  "friday": {"open": "09:00", "close": "18:00", "closed": false},
  "saturday": {"open": "10:00", "close": "14:00", "closed": false},
  "sunday": {"closed": true}
}
```

---

### user_consumer_groups (Relación Usuarios - Grupos)

```sql
CREATE TABLE user_consumer_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  consumer_group_id UUID NOT NULL REFERENCES consumer_groups(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  is_client BOOLEAN DEFAULT TRUE,
  is_manager BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_email, consumer_group_id)
);

CREATE INDEX idx_ucg_user ON user_consumer_groups(user_email);
CREATE INDEX idx_ucg_group ON user_consumer_groups(consumer_group_id);
CREATE INDEX idx_ucg_default ON user_consumer_groups(user_email, is_default);

-- Constraint: Solo un grupo por defecto por usuario
CREATE UNIQUE INDEX idx_ucg_one_default 
  ON user_consumer_groups(user_email) 
  WHERE is_default = TRUE;
```

**Roles:**
- `is_client`: Usuario puede comprar
- `is_manager`: Usuario puede gestionar el grupo

---

### articles (Artículos/Productos)

```sql
CREATE TYPE unit_type AS ENUM ('weight', 'volume');
CREATE TYPE unit_measure AS ENUM ('g', 'kg', 'ml', 'l');

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),                       -- URL S3
  unit_type unit_type NOT NULL,
  unit_measure unit_measure NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,   -- Precio por unidad de medida
  city VARCHAR(255),
  producer VARCHAR(255),                    -- Empresa/Pagès
  consumer_group_id UUID NOT NULL REFERENCES consumer_groups(id) ON DELETE CASCADE,
  in_showcase BOOLEAN DEFAULT FALSE,        -- Si está en el aparador
  max_quantity DECIMAL(10,2),               -- Cantidad máxima disponible
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_articles_group ON articles(consumer_group_id);
CREATE INDEX idx_articles_showcase ON articles(consumer_group_id, in_showcase);
```

---

### article_price_history (Histórico de Precios)

```sql
CREATE TABLE article_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  price_per_unit DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_article ON article_price_history(article_id, changed_at);
```

---

### sales (Ventas)

```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL REFERENCES users(email),
  consumer_group_id UUID NOT NULL REFERENCES consumer_groups(id),
  total_price DECIMAL(10,2) NOT NULL,
  total_paid DECIMAL(10,2) DEFAULT 0,
  is_fully_paid BOOLEAN DEFAULT FALSE,
  sale_date TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_user ON sales(user_email);
CREATE INDEX idx_sales_group ON sales(consumer_group_id);
CREATE INDEX idx_sales_paid ON sales(consumer_group_id, is_fully_paid);
```

---

### sale_items (Detalle de Ventas)

```sql
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,        -- Precio en momento de venta
  total_price DECIMAL(10,2) NOT NULL,       -- quantity * unit_price
  amount_paid DECIMAL(10,2) DEFAULT 0,      -- Cantidad pagada de este item
  is_fully_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_article ON sale_items(article_id);
```

---

### messages (Mensajes del Muro)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_group_id UUID NOT NULL REFERENCES consumer_groups(id) ON DELETE CASCADE,
  sender_email VARCHAR(255) NOT NULL REFERENCES users(email),
  text_content TEXT NOT NULL,
  image VARCHAR(500),                       -- URL S3 (opcional)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_group ON messages(consumer_group_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_email);
```

---

### refresh_tokens (Tokens de Refresco)

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_email);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

---

## Relaciones

```
users 1---N user_consumer_groups N---1 consumer_groups
users 1---N sales
users 1---N messages
consumer_groups 1---N articles
consumer_groups 1---N sales
consumer_groups 1---N messages
articles 1---N article_price_history
articles 1---N sale_items
sales 1---N sale_items
```

## Índices para Rendimiento

- Búsquedas por email de usuario
- Filtrado de artículos por grupo y showcase
- Ventas por usuario y grupo
- Mensajes ordenados por fecha descendente
- Histórico de precios por artículo

## Triggers Recomendados

1. **Actualizar `updated_at`**: Trigger automático en cada UPDATE
2. **Histórico de precios**: Trigger al cambiar precio de artículo
3. **Cálculo de pagos**: Trigger para actualizar `is_fully_paid` en sales
4. **Validar grupo por defecto**: Trigger para asegurar solo un default por usuario

