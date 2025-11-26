#!/usr/bin/env node

/**
 * SOLUCIÓN INMEDIATA - Problemas de Conexión Supabase
 * Este script te guía paso a paso para solucionar el problema
 */

console.log('🔧 SOLUCIÓN INMEDIATA - Problemas de Conexión Supabase\n');
console.log('📋 DIAGNÓSTICO:\n');
console.log('❌ No se puede conectar a: db.orgmacllkzakzubhpdvb.supabase.co:5432');
console.log('❌ No se encuentra la tabla: public.users');
console.log('💡 Causa: Proyecto inactivo o red no configurada\n');

console.log('🎯 SOLUCIÓN PASO A PASO:\n');

// PASO 1: Verificar proyecto
console.log('📋 PASO 1: Verificar que el proyecto Supabase esté ACTIVO');
console.log('─────────────────────────────────────────────────────────');
console.log('1. Ve a: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
console.log('2. Mira en la parte superior derecha');
console.log('3. Si dice "Paused", haz clic en "Restore"');
console.log('4. Espera 2-3 minutos hasta que diga "Active"');
console.log('5. Refresca la página\n');

// PASO 2: Configurar red
console.log('🔐 PASO 2: Configurar Network Settings (CRÍTICO)');
console.log('─────────────────────────────────────────────────');
console.log('1. En el Dashboard, ve a: Settings → Network');
console.log('2. Busca "IPv4 CIDR Allowlist"');
console.log('3. Añade tu IP real (NO 0.0.0.0/0)');
console.log('   - Para encontrar tu IP: https://whatismyipaddress.com/');
console.log('   - Formato correcto: TU_IP/32');
console.log('   - Ejemplo: 190.45.123.78/32');
console.log('4. Haz clic en "Save"');
console.log('5. Espera 30 segundos\n');

// PASO 3: Probar con pooling
console.log('🧪 PASO 3: Probar conexión con Pooling (RECOMENDADO)');
console.log('───────────────────────────────────────────────────────');
console.log('Después de completar los pasos 1 y 2, ejecuta:\n');
console.log('cd app');
console.log('export DATABASE_URL="postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres"');
console.log('npm run db:push\n');

// PASO 4: Si funciona, continuar
console.log('✅ PASO 4: Si el Paso 3 funciona, continúa');
console.log('─────────────────────────────────────────────');
console.log('cd app');
console.log('node scripts/create-admin.js');
console.log('npm run build');
console.log('npm run start\n');

// Alternativa
console.log('🆘 SOLUCIÓN ALTERNATIVA (Si Supabase no funciona)');
console.log('──────────────────────────────────────────────────');
console.log('Usa SQLite localmente mientras resuelves Supabase:');
console.log('');
console.log('1. Edita app/prisma/schema.prisma:');
console.log('   provider = "sqlite"');
console.log('   url = "file:./dev.db"');
console.log('');
console.log('2. Cambia Float a Decimal en Invoice e InvoiceLineItem');
console.log('');
console.log('3. Ejecuta:');
console.log('   cd app && npm run db:push && node scripts/create-admin.js && npm run dev');
console.log('\n📞 ¿Necesitas ayuda? Contacta soporte Supabase');