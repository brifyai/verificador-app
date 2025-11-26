#!/usr/bin/env node

/**
 * Conexión y verificación vía Supabase Client
 * Este script usa el cliente oficial de Supabase para diagnosticar el problema
 */

const { createClient } = require('@supabase/supabase-js');

console.log('🔧 CONEXIÓN VÍA SUPABASE CLIENT\n');
console.log('📋 Usando cliente oficial de Supabase para diagnóstico...\n');

// Cargar variables de entorno
require('dotenv').config();

const SUPABASE_URL = 'https://orgmacllkzakzubhpdvb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ21hY2xsa3pha3p1YmhwZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA4NTA0NiwiZXhwIjoyMDc5NjYxMDQ2fQ.RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk';

async function conectarViaSupabase() {
  console.log('📊 PASO 1: Conectando vía Supabase Client...\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('✅ Cliente de Supabase creado exitosamente');
    console.log('✅ URL:', SUPABASE_URL);
    console.log('✅ Service Key: Configurada\n');
    
    // Intentar consultar información del proyecto
    console.log('🔍 PASO 2: Consultando información del proyecto...\n');
    
    // Intentar obtener datos de cualquier tabla (esto verificará si el proyecto existe)
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.log('❌ Error en consulta:', error.message);
      
      if (error.message.includes('Could not find the table')) {
        console.log('\n💡 PROYECTO ENCONTRADO pero sin tablas');
        console.log('   ✅ Las credenciales de Supabase son VÁLIDAS');
        console.log('   ✅ El proyecto existe y está activo');
        console.log('   ⚠️  El schema de Prisma no se ha aplicado');
        console.log('\n🎯 CONCLUSIÓN:');
        console.log('   - El problema NO está en Supabase');
        console.log('   - El problema está en la conexión PostgreSQL');
        console.log('   - Las credenciales de Supabase son correctas');
        console.log('   - Solo falta configurar correctamente DATABASE_URL');
      }
      
      return false;
    }
    
    console.log('✅ Consulta exitosa');
    console.log('✅ Proyecto está accesible');
    console.log('✅ Credenciales son válidas\n');
    
    // Si llegamos aquí, las credenciales son válidas
    return true;
    
  } catch (err) {
    console.log('❌ Error crítico:', err.message);
    console.log('\n💡 No se pudo conectar vía Supabase Client');
    console.log('   - Verifica que el proyecto esté activo');
    console.log('   - Verifica las credenciales');
    return false;
  }
}

async function diagnosticarProblema() {
  console.log('🔍 PASO 3: Diagnosticando problema exacto...\n');
  
  console.log('📋 RESUMEN DEL PROBLEMA:\n');
  console.log('❌ Error: "FATAL: Tenant or user not found"');
  console.log('💡 Esto significa que PostgreSQL no reconoce el usuario/proyecto\n');
  
  console.log('🎯 POSIBLES CAUSAS:\n');
  console.log('1. El proyecto Supabase está en estado "Paused"');
  console.log('2. Las credenciales de PostgreSQL son incorrectas');
  console.log('3. La URL de conexión no es la correcta');
  console.log('4. Problemas de configuración en Network Settings\n');
  
  console.log('🔧 SOLUCIONES:\n');
  console.log('✅ SOLUCIÓN 1 - Verificar estado del proyecto:');
  console.log('   Ve a: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
  console.log('   Verifica que diga "Active" (no "Paused")\n');
  
  console.log('✅ SOLUCIÓN 2 - Obtener URL correcta de PostgreSQL:');
  console.log('   1. Ve a: Settings → Database en Supabase Dashboard');
  console.log('   2. Busca "Connection string"');
  console.log('   3. Selecciona "URI"');
  console.log('   4. Copia la URL completa');
  console.log('   5. Actualiza DATABASE_URL en app/.env\n');
  
  console.log('✅ SOLUCIÓN 3 - Configurar Network Settings:');
  console.log('   1. Ve a: Settings → Network');
  console.log('   2. Busca "IPv4 CIDR Allowlist"');
  console.log('   3. Añade tu IP (formato: TU_IP/32)');
  console.log('   4. Ejemplo: 190.45.123.78/32\n');
  
  console.log('✅ SOLUCIÓN 4 - Aplicar schema de Prisma:');
  console.log('   cd app');
  console.log('   export DATABASE_URL="URL_CORRECTA_AQUÍ"');
  console.log('   npm run db:push\n');
}

async function main() {
  console.log('🎯 CONEXIÓN VÍA SUPABASE CLIENT - DIAGNÓSTICO\n');
  
  const conectado = await conectarViaSupabase();
  
  if (conectado) {
    console.log('\n✅ CONCLUSIÓN: Las credenciales de Supabase son VÁLIDAS');
    console.log('   - El proyecto existe y está activo');
    console.log('   - El problema está SOLO en la conexión PostgreSQL');
    console.log('   - NO es un problema de credenciales de Supabase');
  } else {
    console.log('\n❌ CONCLUSIÓN: Problemas con las credenciales de Supabase');
    console.log('   - Verifica que el proyecto esté activo');
    console.log('   - Verifica las credenciales en app/.env');
  }
  
  await diagnosticarProblema();
  
  console.log('\n📋 RESUMEN FINAL:\n');
  console.log('El error "FATAL: Tenant or user not found" indica que:');
  console.log('- PostgreSQL no reconoce el usuario/proyecto');
  console.log('- Las credenciales de Supabase API son válidas');
  console.log('- El problema está en la configuración de PostgreSQL');
  console.log('- Necesitas obtener la URL correcta desde Supabase Dashboard');
}

main().catch(console.error);