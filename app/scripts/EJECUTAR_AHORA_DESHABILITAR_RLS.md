# 🚨 INSTRUCCIONES URGENTES: Deshabilitar Row Level Security

## PROBLEMA IDENTIFICADO:
Row Level Security (RLS) está habilitada en la tabla `api_configurations` y bloquea la inserción de datos.

## SOLUCIÓN RÁPIDA:

### PASO 1: Acceder a Supabase Dashboard
1. Ve a **https://supabase.com/dashboard**
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto "verificador-app"

### PASO 2: Deshabilitar RLS en api_configurations
1. En el menú lateral, haz clic en **"Table Editor"**
2. Busca la tabla **"api_configurations"**
3. Haz clic en **"Edit Table"** (botón en la parte superior derecha)
4. **Desmarca** la opción **"Enable Row Level Security"**
5. Haz clic en **"Save"**

### PASO 3: Verificar el cambio
Ejecuta este SQL en **SQL Editor** para confirmar:
```sql
SELECT 
    table_name,
    is_rls_enabled
FROM information_schema.tables
WHERE table_name = 'api_configurations';
```
→ Debería mostrar `is_rls_enabled = false`

### PASO 4: Probar el endpoint
En tu terminal, ejecuta:
```bash
cd app && curl -s http://localhost:3000/api/providers
```
→ Debería devolver JSON con proveedores en lugar de error 401

---

## 🎯 RESULTADO ESPERADO:

Una vez deshabilitada RLS, el endpoint `/api/providers` funcionará correctamente y creará automáticamente el proveedor chutes.ai si no existe.

**No necesitas reiniciar el servidor** - los cambios en Supabase son instantáneos.

---

## 📋 SI PREFIERES USAR SQL DIRECTO:

Ve a **SQL Editor** y ejecuta:
```sql
ALTER TABLE api_configurations DISABLE ROW LEVEL SECURITY;
```

¡Listo! El sistema funcionará inmediatamente.