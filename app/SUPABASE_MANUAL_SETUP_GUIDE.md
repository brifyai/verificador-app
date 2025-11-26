# 🚀 Guía Completa de Configuración Manual de Supabase

## 📋 Información de Conexión Proporcionada

```
URL: http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io
Anon Key: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw
Usuario: postgres.mSSVhBSoCuGVaFu6
Password: vENh83ti9D68nVV3aL4NMAtBv9aa7XZc
```

## 🔧 Pasos para Configurar Supabase Manualmente

### Paso 1: Acceder al Dashboard de Supabase

1. **Abre tu navegador** y ve a:
   ```
   http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io
   ```

2. **Inicia sesión** con tus credenciales de administrador

### Paso 2: Configurar Base de Datos

1. **Ve a la sección "Database"** en el menú lateral
2. **Haz clic en "Table Editor"**
3. **Crea las siguientes tablas** una por una:

#### Tabla: `users`
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'USER',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabla: `radios`
```sql
CREATE TABLE radios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  region TEXT,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  priority INTEGER DEFAULT 1,
  cost_per_hour DECIMAL(10,2) DEFAULT 0.0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verification_status TEXT,
  last_verified_at TIMESTAMP WITH TIME ZONE
);
```

#### Tabla: `phrases`
```sql
CREATE TABLE phrases (
  id TEXT PRIMARY KEY,
  phrase TEXT NOT NULL,
  brand TEXT NOT NULL,
  campaign TEXT,
  category TEXT DEFAULT 'PRODUCT',
  description TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.85,
  priority INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabla: `monitoring_sessions`
```sql
CREATE TABLE monitoring_sessions (
  id TEXT PRIMARY KEY,
  radio_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  capture_interval INTEGER DEFAULT 30,
  capture_duration INTEGER DEFAULT 10,
  total_captures INTEGER DEFAULT 0,
  total_detections INTEGER DEFAULT 0,
  last_capture_at TIMESTAMP WITH TIME ZONE,
  last_detection_at TIMESTAMP WITH TIME ZONE,
  recording_start_hour INTEGER DEFAULT 5,
  recording_end_hour INTEGER DEFAULT 2,
  configuration JSONB,
  metadata JSONB,
  FOREIGN KEY (radio_id) REFERENCES radios(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Tabla: `captures`
```sql
CREATE TABLE captures (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  audio_path TEXT,
  duration DECIMAL(10,2) NOT NULL,
  file_size BIGINT,
  format TEXT,
  bitrate INTEGER,
  sample_rate INTEGER,
  status TEXT DEFAULT 'PROCESSING',
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  transcription_text TEXT,
  confidence DECIMAL(3,2),
  provider TEXT,
  processing_time DECIMAL(10,2),
  cost DECIMAL(10,2) DEFAULT 0.0,
  metadata JSONB,
  FOREIGN KEY (session_id) REFERENCES monitoring_sessions(id)
);
```

#### Tabla: `detections`
```sql
CREATE TABLE detections (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  capture_id TEXT NOT NULL,
  radio_id TEXT NOT NULL,
  phrase_id TEXT NOT NULL,
  detected_text TEXT NOT NULL,
  original_text TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  similarity DECIMAL(3,2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audio_timestamp DECIMAL(10,2),
  verified BOOLEAN DEFAULT false,
  false_positive BOOLEAN DEFAULT false,
  cost DECIMAL(10,2) DEFAULT 0.0,
  metadata JSONB,
  FOREIGN KEY (session_id) REFERENCES monitoring_sessions(id),
  FOREIGN KEY (capture_id) REFERENCES captures(id),
  FOREIGN KEY (radio_id) REFERENCES radios(id),
  FOREIGN KEY (phrase_id) REFERENCES phrases(id)
);
```

### Paso 3: Configurar Permisos (RLS - Row Level Security)

1. **Ve a "Authentication"** → "Policies"
2. **Desactiva RLS** temporalmente para desarrollo:
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE radios DISABLE ROW LEVEL SECURITY;
   ALTER TABLE phrases DISABLE ROW LEVEL SECURITY;
   ALTER TABLE monitoring_sessions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE captures DISABLE ROW LEVEL SECURITY;
   ALTER TABLE detections DISABLE ROW LEVEL SECURITY;
   ```

### Paso 4: Insertar Datos de Prueba

#### Radios de Ejemplo:
```sql
INSERT INTO radios (id, name, stream_url, platform, region, status) VALUES
('radio-1', 'Bio-Bio Santiago', 'http://stream1.url', 'HTTP_STREAM', 'Metropolitana', 'ACTIVE'),
('radio-2', 'Cooperativa', 'http://stream2.url', 'HTTP_STREAM', 'Metropolitana', 'ACTIVE'),
('radio-3', 'ADN Chile', 'http://stream3.url', 'HTTP_STREAM', 'Metropolitana', 'ACTIVE');
```

#### Frases de Ejemplo:
```sql
INSERT INTO phrases (id, phrase, brand, category, active) VALUES
('phrase-1', 'En Falabella tienes todo', 'Falabella', 'PRODUCT', true),
('phrase-2', 'París, te lo mereces', 'París', 'PRODUCT', true),
('phrase-3', 'Líder, el precio es primero', 'Líder', 'PRODUCT', true);
```

### Paso 5: Verificar Conexión desde la Aplicación

1. **Ejecuta este script** para verificar:
   ```bash
   cd app && node scripts/test-supabase-connection-new.js
   ```

2. **Si la conexión funciona**, ejecuta las migraciones de Prisma:
   ```bash
   cd app && npx prisma migrate dev --name init
   ```

### Paso 6: Configurar Variables de Entorno

Asegúrate que tu archivo `.env` contenga:
```env
NEXT_PUBLIC_SUPABASE_URL=http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw
DATABASE_URL=postgresql://postgres.mSSVhBSoCuGVaFu6:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## 🚨 Solución de Problemas Comunes

### Error: "Tenant or user not found"
- **Causa**: Credenciales incorrectas de base de datos
- **Solución**: Verifica el usuario y password en el dashboard de Supabase

### Error: "Connection refused"
- **Causa**: Host o puerto incorrectos
- **Solución**: Usa el connection string del dashboard de Supabase

### Error: "Table doesn't exist"
- **Causa**: Las tablas no se crearon correctamente
- **Solución**: Verifica en el Table Editor que todas las tablas existan

## 📞 Ayuda Adicional

Si tienes problemas:
1. **Verifica el dashboard de Supabase** para ver los logs de errores
2. **Ejecuta el script de prueba** para diagnosticar problemas de conexión
3. **Revisa las variables de entorno** para asegurar que sean correctas

## ✅ Checklist Final

- [ ] Dashboard de Supabase accesible
- [ ] Todas las tablas creadas
- [ ] Permisos configurados
- [ ] Datos de prueba insertados
- [ ] Conexión verificada desde aplicación
- [ ] Variables de entorno configuradas
- [ ] Aplicación funcionando con Supabase

---

**Una vez completados estos pasos, tu aplicación estará completamente integrada con Supabase.**