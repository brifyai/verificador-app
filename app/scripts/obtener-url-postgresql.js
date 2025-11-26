#!/usr/bin/env node

/**
 * Obtener URL correcta de PostgreSQL desde Supabase
 * Este script proporciona las instrucciones exactas para obtener la URL
 */

console.log('🔧 OBTENER URL CORRECTA DE POSTGRESQL\n');
console.log('📋 INSTRUCCIONES PASO A PASO:\n');

console.log('🎯 PASO 1: Acceder a Supabase Dashboard');
console.log('─────────────────────────────────────────');
console.log('1. Ve a: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
console.log('2. Inicia sesión con tus credenciales');
console.log('3. Verifica que el proyecto esté "Active" (no "Paused")\n');

console.log('🎯 PASO 2: Obtener URL de PostgreSQL');
console.log('─────────────────────────────────────');
console.log('1. En el Dashboard, haz clic en "Settings" (en el sidebar izquierdo)');
console.log('2. Selecciona "Database" del menú');
console.log('3. Desplázate hasta "Connection string"');
console.log('4. Haz clic en el botón "URI"');
console.log('5. Copia la URL completa que aparece');
console.log('');
console.log('💡 La URL debe tener un formato similar a:');
console.log('postgresql://postgres.orgmacllkzakzubhpdvb:TU_PASSWORD@db.orgmacllkzakzubhpdvb.supabase.co:5432/postgres');
console.log('');

console.log('🎯 PASO 3: Actualizar archivo .env');
console.log('────────────────────────────────────');
console.log('1. Abre el archivo: app/.env');
console.log('2. Localiza la línea: DATABASE_URL=...');
console.log('3. Reemplaza con la URL que copiaste');
console.log('4. Guarda el archivo\n');

console.log('🎯 PASO 4: Probar conexión');
console.log('───────────────────────────');
console.log('Ejecuta los siguientes comandos:\n');
console.log('cd app');
console.log('export DATABASE_URL="LA_URL_QUE_COPIASTE"');
console.log('npm run db:push\n');

console.log('🎯 PASO 5: Si funciona, continuar');
console.log('───────────────────────────────────');
console.log('Si el comando anterior funciona, ejecuta:\n');
console.log('node scripts/create-admin.js');
console.log('npm run build');
console.log('npm run start\n');

console.log('📋 INFORMACIÓN IMPORTANTE:\n');
console.log('✅ Las credenciales de Supabase que tienes son VÁLIDAS');
console.log('✅ El proyecto existe y está activo');
console.log('❌ La URL de PostgreSQL actual es INCORRECTA');
console.log('💡 Necesitas obtener la URL correcta desde Supabase Dashboard');
console.log('\n🎯 La solución es obtener la URL correcta y actualizar app/.env');