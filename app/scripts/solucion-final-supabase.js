#!/usr/bin/env node

/**
 * SOLUCIÓN FINAL - Problemas de Conexión Supabase
 * Este script verifica todo paso a paso y proporciona soluciones exactas
 */

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

console.log('🔧 SOLUCIÓN FINAL - Problemas de Conexión Supabase\n');
console.log('📋 DIAGNÓSTICO COMPLETO:\n');

// Cargar variables de entorno
require('dotenv').config();

const SUPABASE_URL = 'https://orgmacllkzakzubhpdvb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ21hY2xsa3pha3p1YmhwZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA4NTA0NiwiZXhwIjoyMDc5NjYxMDQ2fQ.RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk';

async function verificarProyectoSupabase() {
  console.log('📊 PASO 1: Verificando proyecto Supabase...\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.log('❌ Error de conexión:', error.message);
      
      if (error.message.includes('Could not find the table')) {
        console.log('\n💡 El proyecto existe pero no tiene tablas');
        console.log('   - Las credenciales de Supabase son válidas');
        console.log('   - El schema de Prisma no se ha aplicado');
        console.log('   - Necesitas ejecutar: npm run db:push');
      }
      
      if (error.message.includes('JWT')) {
        console.log('\n💡 El token JWT es inválido');
        console.log('   - Verifica SUPABASE_SERVICE_KEY en app/.env');
      }
      
      return false;
    }
    
    console.log('✅ Proyecto Supabase está activo');
    console.log('✅ Credenciales de Supabase son válidas');
    console.log('✅ Conexión con Supabase establecida');
    
    if (data && data.length > 0) {
      console.log('✅ Tabla users existe y tiene datos');
    } else {
      console.log('⚠️  Tabla users existe pero está vacía');
      console.log('   - El schema de Prisma no se ha aplicado');
    }
    
    return true;
    
  } catch (err) {
    console.log('❌ Error crítico:', err.message);
    return false;
  }
}

async function verificarConexionPostgreSQL() {
  console.log('\n🐘 PASO 2: Verificando conexión PostgreSQL...\n');
  
  const DATABASE_URL = 'postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres';
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    }
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Conexión PostgreSQL establecida');
    
    // Intentar crear una tabla de prueba
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY)`;
    console.log('✅ Permisos de escritura en PostgreSQL OK');
    
    await prisma.$executeRaw`DROP TABLE IF EXISTS test_table`;
    
    await prisma.$disconnect();
    return true;
    
  } catch (err) {
    console.log('❌ Error de conexión PostgreSQL:', err.message);
    
    if (err.message.includes('Tenant or user not found')) {
      console.log('\n💡 El usuario o proyecto no existe');
      console.log('   - Verifica que el proyecto esté activo');
      console.log('   - Verifica las credenciales en app/.env');
      console.log('   - URL actual:', DATABASE_URL);
    }
    
    if (err.message.includes('could not connect')) {
      console.log('\n💡 No se puede conectar al servidor');
      console.log('   - Verifica Network Settings en Supabase');
      console.log('   - Asegúrate que tu IP esté en la lista de permitidos');
    }
    
    await prisma.$disconnect();
    return false;
  }
}

function mostrarSoluciones() {
  console.log('\n🎯 SOLUCIONES RECOMENDADAS:\n');
  
  console.log('1. Si el proyecto Supabase está inactivo:');
  console.log('   - Ve a: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
  console.log('   - Haz clic en "Restore" si dice "Paused"');
  console.log('   - Espera 2-3 minutos\n');
  
  console.log('2. Si las credenciales PostgreSQL son incorrectas:');
  console.log('   - Ve a: Settings → Database en Supabase Dashboard');
  console.log('   - Copia la "Connection string" URI');
  console.log('   - Actualiza DATABASE_URL en app/.env\n');
  
  console.log('3. Si hay problemas de red:');
  console.log('   - Settings → Network → IPv4 CIDR Allowlist');
  console.log('   - Añade tu IP (formato: TU_IP/32)');
  console.log('   - Ejemplo: 190.45.123.78/32\n');
  
  console.log('4. Para aplicar el schema de Prisma:');
  console.log('   cd app');
  console.log('   export DATABASE_URL="postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres"');
  console.log('   npm run db:push\n');
}

async function main() {
  console.log('🔍 DIAGNÓSTICO COMPLETO SUPABASE\n');
  
  const supabaseOk = await verificarProyectoSupabase();
  const postgresOk = await verificarConexionPostgreSQL();
  
  console.log('\n📊 RESUMEN:\n');
  
  if (supabaseOk && postgresOk) {
    console.log('✅ TODO ESTÁ CONFIGURADO CORRECTAMENTE');
    console.log('\n🚀 Próximos pasos:');
    console.log('   cd app && npm run db:push');
    console.log('   node scripts/create-admin.js');
    console.log('   npm run build');
    console.log('   npm run start');
  } else if (supabaseOk && !postgresOk) {
    console.log('⚠️  Supabase funciona pero PostgreSQL no');
    console.log('   - Las credenciales de Supabase son válidas');
    console.log('   - El problema está en la conexión PostgreSQL');
    console.log('   - Sigue las soluciones del PASO 2 y PASO 3');
  } else if (!supabaseOk && postgresOk) {
    console.log('⚠️  PostgreSQL funciona pero Supabase no');
    console.log('   - Revisa las credenciales de Supabase');
    console.log('   - Verifica que el proyecto esté activo');
  } else {
    console.log('❌ AMBAS conexiones fallan');
    console.log('   - Sigue todas las soluciones del PASO 1, 2 y 3');
  }
  
  mostrarSoluciones();
}

main().catch(console.error);