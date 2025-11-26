# 🚨 SOLUCIÓN INMEDIATA - Problema de Conexión Supabase

## 📋 DIAGNÓSTICO COMPLETO

**Problema**: No se puede conectar a Supabase
**Causa**: Proyecto inactivo o configuración de red incorrecta

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Activar Proyecto Supabase (CRÍTICO)
```bash
# Ve a: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb
# Si dice "Paused", haz clic en "Restore"
# Espera 2-3 minutos
```

### PASO 2: Configurar Network Access
```bash
# En Supabase Dashboard:
# Settings → Network → IPv4 CIDR Allowlist
# Añade: 0.0.0.0/0 (para pruebas)
# Guarda y espera 30 segundos
```

### PASO 3: Probar Conexión con Pooling (RECOMENDADO)
```bash
cd app
export DATABASE_URL="postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
npm run db:push
```

### PASO 4: Si el Paso 3 Funciona
```bash
# Crear usuario administrador
node scripts/create-admin.js

# Build para producción
npm run build

# Iniciar servidor
npm run start
```

## 🆘 SOLUCIÓN ALTERNATIVA (Si Supabase no funciona)

Usa SQLite localmente:

```bash
# 1. Editar prisma/schema.prisma
# Cambiar:
#   provider = "sqlite"
#   url = "file:./dev.db"

# 2. Cambiar tipos Decimal a Float
# En Invoice y InvoiceLineItem:
#   Float en lugar de Decimal @db.Decimal(10, 2)

# 3. Actualizar consultas SQL
# En app/api/dashboard/stats/route.ts:
#   EXTRACT(HOUR FROM timestamp) -> CAST(strftime('%H', timestamp) AS INTEGER)

# 4. Ejecutar
npm run db:push
node scripts/create-admin.js
npm run dev
```

## 📞 CONTACTO DE SOPORTE

Si nada funciona:
1. **Supabase Support**: https://supabase.com/dashboard/support
2. **Comunidad**: https://supabase.com/community
3. **Discord**: https://discord.supabase.com

## 🎯 ESTADO ACTUAL

- ✅ Variables de entorno configuradas
- ✅ Schema de Prisma listo
- ✅ Scripts de diagnóstico creados
- ❌ Conexión a Supabase pendiente

**Próximo paso**: Ejecutar los comandos del PASO 3 después de activar el proyecto Supabase.