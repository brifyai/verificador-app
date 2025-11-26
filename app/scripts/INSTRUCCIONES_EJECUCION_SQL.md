# 📋 INSTRUCCIONES PARA CREAR TODAS LAS TABLAS EN SUPABASE

## **MÉTODO RECOMENDADO: SQL Editor de Supabase**

### **PASO 1: Acceder al SQL Editor**

1. Ve a tu proyecto de Supabase en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
4. Haz clic en **"New query"** o abre el editor SQL

### **PASO 2: Ejecutar el Script SQL**

1. Copia todo el contenido del archivo:
   ```
   app/scripts/create-all-supabase-tables-complete.sql
   ```

2. Pégalo en el SQL Editor de Supabase

3. Haz clic en **"Run"** (botón verde en la esquina inferior derecha)

4. Espera a que se ejecute (puede tomar 10-30 segundos)

### **PASO 3: Verificar la Creación**

Ejecuta estas consultas de verificación en el SQL Editor:

```sql
-- Verificar todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Contar tablas
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

**Deberías ver 18 tablas en total.**

### **PASO 4: Verificar Tablas Específicas Importantes**

```sql
-- Verificar tabla audios (para endpoints /api/audios/*)
SELECT * FROM audios LIMIT 1;

-- Verificar tablas de facturación
SELECT * FROM billing_profiles LIMIT 1;
SELECT * FROM payment_methods LIMIT 1;
SELECT * FROM invoices LIMIT 1;

-- Verificar tablas nuevas
SELECT * FROM phrase_variants LIMIT 1;
SELECT * FROM reports LIMIT 1;
SELECT * FROM notifications LIMIT 1;
```

## **📋 LISTA COMPLETA DE TABLAS A CREAR**

### **Tablas Principales (Ya existen pero se verifican):**
- ✅ users
- ✅ radios
- ✅ phrases
- ✅ monitoring_sessions
- ✅ captures
- ✅ detections
- ✅ api_configurations
- ✅ jobs
- ✅ billing_profiles
- ✅ invoices
- ✅ subscriptions
- ✅ payment_methods

### **Tablas NUEVAS que faltan crear:**

1. **audios** - Para endpoints `/api/audios/*`
2. **phrase_variants** - Variantes de frases para mejor detección
3. **radio_pricing_rules** - Reglas de precios por radio
4. **reports** - Reportes generados por usuarios
5. **notifications** - Sistema de notificaciones
6. **cache** - Cache para optimización
7. **system_logs** - Logs del sistema
8. **invoice_line_items** - Líneas de detalle de facturas

## **🎯 TABLA CRÍTICA: audios**

La tabla **audios** es especialmente importante porque los endpoints `/api/audios/stats`, `/api/audios/list`, `/api/audios/download` y `/api/audios/upload` la están usando.

**Estructura de la tabla audios:**
```sql
CREATE TABLE audios (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    capture_id TEXT,
    user_id TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    duration REAL,
    format TEXT,
    bitrate INTEGER,
    sample_rate INTEGER,
    status TEXT DEFAULT 'UPLOADED',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## **⚠️ SOLUCIÓN ALTERNATIVA: Usar Supabase CLI**

Si prefieres usar la línea de comandos:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link a tu proyecto
supabase link --project-ref YOUR_PROJECT_ID

# Ejecutar SQL
supabase db sql < scripts/create-all-supabase-tables-complete.sql
```

## **✅ VERIFICACIÓN FINAL**

Después de ejecutar el script, verifica que todas las tablas existen:

```sql
-- Deberías ver 18 tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Resultado esperado:**
- users
- radios
- phrases
- phrase_variants
- monitoring_sessions
- captures
- audios
- detections
- api_configurations
- radio_pricing_rules
- reports
- jobs
- notifications
- cache
- system_logs
- billing_profiles
- invoices
- invoice_line_items
- subscriptions
- payment_methods

---

## **🚀 PRÓXIMO PASO**

Una vez creadas todas las tablas, **reinicia el servidor Next.js** y los errores desaparecerán:

```bash
# En la terminal
cd app && npm run dev
```

¡Listo! 🎉