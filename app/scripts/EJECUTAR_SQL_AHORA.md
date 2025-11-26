# 🚀 EJECUTAR SQL EN SUPABASE - 2 MINUTOS

## **PASO 1: Abrir SQL Editor de Supabase**

1. **Abre tu navegador** y ve a:
   ```
   http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io
   ```

2. **Inicia sesión** en Supabase con tus credenciales

3. **Selecciona tu proyecto** (debería estar en la lista)

4. **En el menú izquierdo**, haz clic en **"SQL Editor"** (ícono de `>`)

5. **Haz clic en "New query"** (botón azul arriba a la derecha)

---

## **PASO 2: Ejecutar el Script SQL**

1. **Abre el archivo SQL** en tu computador:
   ```bash
   # En una nueva terminal
   cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app
   open scripts/create-all-supabase-tables-complete.sql
   ```

2. **Copia TODO el contenido** del archivo:
   - Selecciona todo (Cmd+A o Ctrl+A)
   - Copia (Cmd+C o Ctrl+C)

3. **Pégalo en el SQL Editor** de Supabase:
   - Haz clic en el área de texto grande
   - Pega (Cmd+V o Ctrl+V)

4. **Haz clic en "Run"** (botón verde en la esquina inferior derecha)

5. **Espera 10-30 segundos** mientras se ejecuta

---

## **PASO 3: Verificar que Funcionó**

**Ejecuta estas consultas en el SQL Editor:**

```sql
-- Ver todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Deberías ver 18 tablas, incluyendo:
-- ✅ audios (para /api/audios/*)
-- ✅ billing_profiles (para /api/billing/*)
-- ✅ payment_methods (para /api/payment-methods)
-- ✅ phrase_variants, reports, notifications, etc.
```

---

## **PASO 4: Reiniciar el Servidor**

1. **Ve a la terminal** donde está corriendo Next.js
2. **Presiona Ctrl+C** para detener el servidor
3. **Ejecuta:**
   ```bash
   npm run dev
   ```

4. **¡Listo!** Los errores deberían desaparecer

---

## **📋 TABLAS CRÍTICAS QUE SE CREARÁN**

| Tabla | Para qué endpoints | Estado |
|-------|-------------------|--------|
| **audios** | `/api/audios/stats`, `/api/audios/list`, etc. | ⭐ CRÍTICA |
| **billing_profiles** | `/api/billing/profiles`, `/api/billing/invoices` | ⭐ CRÍTICA |
| **payment_methods** | `/api/payment-methods` | ⭐ CRÍTICA |
| **phrase_variants** | Detección de frases | ✅ Nueva |
| **reports** | `/api/reportes` | ✅ Nueva |
| **notifications** | Sistema de notificaciones | ✅ Nueva |
| **cache** | Optimización | ✅ Nueva |
| **system_logs** | Logging | ✅ Nueva |
| **invoice_line_items** | Facturación | ✅ Nueva |

---

## **🎯 VERIFICACIÓN RÁPIDA**

Después de reiniciar, estos endpoints deberían funcionar sin errores:

- ✅ `GET /api/audios/stats` (tabla `audios`)
- ✅ `GET /api/billing/profiles` (tabla `billing_profiles`)
- ✅ `GET /api/payment-methods` (tabla `payment_methods`)
- ✅ `GET /api/dashboard/stats-direct` (ya funciona)

---

## **⏱️ TIEMPO TOTAL: 2 MINUTOS**

1. Abrir SQL Editor: 30 segundos
2. Copiar y pegar SQL: 30 segundos
3. Ejecutar: 10-30 segundos
4. Reiniciar servidor: 30 segundos

**¡Total: 2 minutos!**

---

## **🆘 SI TIENES PROBLEMAS**

Si el SQL Editor no funciona, alternativa:

1. **Descarga Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase  # macOS
   # o visita: https://github.com/supabase/cli
   ```

2. **Ejecuta desde terminal:**
   ```bash
   cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app
   supabase login
   supabase link --project-ref u4g0k80skos0s0gww8wks800
   supabase db sql < scripts/create-all-supabase-tables-complete.sql
   ```

---

**¡Ejecuta el SQL AHORA y los errores desaparecerán! 🚀**