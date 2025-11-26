#!/usr/bin/env node

/**
 * Verificación de credenciales y obtención de URL correcta de Supabase
 * Este script verifica las credenciales y obtiene la URL correcta desde Supabase
 */

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 VERIFICACIÓN DE CREDENCIALES Y URL SUPABASE\n');

const SUPABASE_URL = 'https://orgmacllkzakzubhpdvb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ21hY2xsa3pha3p1YmhwZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA4NTA0NiwiZXhwIjoyMDc5NjYxMDQ2fQ.RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk';

async function verificarCredenciales() {
  console.log('📊 PASO 1: Verificando credenciales Supabase...\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.log('❌ Error de conexión:', error.message);
      
      if (error.message.includes('Could not find the table')) {
        console.log('\n💡 PROYECTO ENCONTRADO pero sin tablas');
        console.log('   ✅ SUPABASE_URL es correcta');
        console.log('   ✅ SUPABASE_SERVICE_KEY es válida');
        console.log('   ⚠️  El schema de Prisma no se ha aplicado');
        console.log('\n   🎯 SOLUCIÓN:');
        console.log('   - El proyecto existe y las credenciales son válidas');
        console.log('   - Solo falta aplicar el schema de Prisma');
        console.log('   - Ejecuta: cd app && npm run db:push');
      }
      
      return false;
    }
    
    console.log('✅ Credenciales válidas');
    console.log('✅ Proyecto Supabase está activo');
    console.log('✅ Conexión establecida exitosamente');
    return true;
    
  } catch (err) {
    console.log('❌ Error crítico:', err.message);
    console.log('\n💡 El proyecto no existe o no está activo');
    console.log('   - Verifica que el proyecto esté en: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
    console.log('   - Asegúrate que diga "Active" (no "Paused")');
    return false;
  }
}

async function obtenerUrlCorrecta() {
  console.log('\n🔗 PASO 2: Obteniendo URL correcta de PostgreSQL...\n');
  
  console.log('💡 Para obtener la URL correcta:');
  console.log('   1. Ve a: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb/settings/database');
  console.log('   2. Busca "Connection string"');
  console.log('   3. Selecciona "URI"');
  console.log('   4. Copia la URL completa\n');
  
  console.log('📝 URL actual en app/.env:');
  console.log('   DATABASE_URL=postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres\n');
  
  console.log('💡 Si la URL anterior no funciona, prueba con la directa:');
  console.log('   DATABASE_URL=postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@db.orgmacllkzakzubhpdvb.supabase.co:5432/postgres\n');
  
  console.log('🎯 Después de obtener la URL correcta:');
  console.log('   1. Actualiza app/.env');
  console.log('   2. Ejecuta: cd app && npm run db:push');
  console.log('   3. Ejecuta: node scripts/create-admin.js');
}

async function probarConexionDirecta() {
  console.log('\n🧪 PASO 3: Probando conexión directa con Prisma...\n');
  
  const { PrismaClient } = require('@prisma/client');
  
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
    
    // Intentar crear tabla de prueba
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY)`;
    console.log('✅ Permisos de escritura OK');
    
    await prisma.$executeRaw`DROP TABLE IF EXISTS test_connection`;
    
    await prisma.$disconnect();
    console.log('\n🎉 Conexión exitosa');
    console.log('   - Credenciales válidas');
    console.log('   - Permisos correctos');
    console.log('   - Listo para aplicar schema');
    
    return true;
    
  } catch (err) {
    console.log('❌ Error de conexión:', err.message);
    
    if (err.message.includes('Tenant or user not found')) {
      console.log('\n💡 El usuario o proyecto no existe');
      console.log('   - El proyecto puede estar inactivo');
      console.log('   - Las credenciales pueden ser incorrectas');
      console.log('   - Verifica en: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
    }
    
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  console.log('🎯 VERIFICACIÓN COMPLETA DE CREDENCIALES SUPABASE\n');
  
  const credencialesValidas = await verificarCredenciales();
  
  if (credencialesValidas) {
    console.log('\n✅ CREDENCIALES VÁLIDAS');
    console.log('   - Supabase API funciona correctamente');
    console.log('   - El proyecto existe y está activo');
    console.log('   - Solo falta aplicar el schema de Prisma');
    
    await obtenerUrlCorrecta();
    
    const conexionOk = await probarConexionDirecta();
    
    if (conexionOk) {
      console.log('\n🚀 TODO LISTO PARA PRODUCCIÓN');
      console.log('   Ejecuta: cd app && npm run db:push && node scripts/create-admin.js');
    }
  } else {
    console.log('\n❌ CREDENCIALES INVÁLIDAS');
    console.log('   - El proyecto no existe o no está activo');
    console.log('   - Ve a: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
    console.log('   - Verifica que el proyecto esté "Active"');
  }
}

main().catch(console.error);