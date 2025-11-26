#!/usr/bin/env node

/**
 * Script para solucionar problemas de conexión con Supabase
 * Paso a paso para configurar correctamente
 */

console.log('🔧 SOLUCIÓN DE CONEXIÓN SUPABASE - PASO A PASO\n');
console.log('Problema detectado: No se puede conectar a Supabase');
console.log('Causa: Configuración de red o proyecto inactivo\n');

// Paso 1: Verificar proyecto Supabase
console.log('📋 PASO 1: Verificar que el proyecto Supabase esté activo');
console.log('─────────────────────────────────────────────────────');
console.log('1. Ve a: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
console.log('2. Verifica que el proyecto no esté "Paused"');
console.log('3. Si está pausado, haz clic en "Restore"');
console.log('4. Espera 2-3 minutos a que se active\n');

// Paso 2: Configurar Network Settings
console.log('🔐 PASO 2: Configurar Network Settings en Supabase');
console.log('───────────────────────────────────────────────────');
console.log('1. En el Dashboard de tu proyecto, ve a: Settings → Network');
console.log('2. Busca "IPv4 CIDR Allowlist"');
console.log('3. Añade tu IP actual (o usa 0.0.0.0/0 para pruebas)');
console.log('4. Haz clic en "Save"');
console.log('');
console.log('💡 Para encontrar tu IP, visita: https://whatismyipaddress.com/');
console.log('📝 Tu IP actual es la que necesitas añadir\n');

// Paso 3: Obtener URL de conexión correcta
console.log('🔗 PASO 3: Obtener URL de conexión correcta de Supabase');
console.log('───────────────────────────────────────────────────────');
console.log('1. Ve a: Settings → Database');
console.log('2. Busca "Connection string"');
console.log('3. Selecciona "URI"');
console.log('4. Copia la URL completa');
console.log('');
console.log('URL de conexión directa (desarrollo):');
console.log('postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@db.orgmacllkzakzubhpdvb.supabase.co:5432/postgres');
console.log('');
console.log('URL de conexión con pooling (producción):');
console.log('postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres\n');

// Paso 4: Probar conexión
console.log('🧪 PASO 4: Probar conexión');
console.log('─────────────────────────────');
console.log('Después de completar los pasos 1-3, ejecuta:');
console.log('');
console.log('Opción A - Con pooling (recomendado):');
console.log('  export DATABASE_URL="postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres"');
console.log('  cd app && npm run db:push');
console.log('');
console.log('Opción B - Conexión directa:');
console.log('  export DATABASE_URL="postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@db.orgmacllkzakzubhpdvb.supabase.co:5432/postgres"');
console.log('  cd app && npm run db:push\n');

// Paso 5: Si todo falla
console.log('🆘 PASO 5: Si todo lo anterior falla');
console.log('─────────────────────────────────────');
console.log('1. Ve a: https://supabase.com/dashboard/support');
console.log('2. Crea un ticket con el error exacto');
console.log('3. Menciona que estás usando Prisma con Node.js');
console.log('4. Incluye el mensaje de error completo');
console.log('');
console.log('Mientras tanto, puedes usar SQLite local:');
console.log('  1. Edita app/prisma/schema.prisma');
console.log('  2. Cambia a: provider = "sqlite"');
console.log('  3. url = "file:./dev.db"');
console.log('  4. Cambia Float a Decimal en Invoice e InvoiceLineItem');
console.log('  5. Ejecuta: npm run db:push && node scripts/create-admin.js\n');

console.log('📞 ¿Necesitas ayuda adicional?');
console.log('   - Documentación: https://supabase.com/docs');
console.log('   - Prisma + Supabase: https://supabase.com/partners/integrations/prisma');