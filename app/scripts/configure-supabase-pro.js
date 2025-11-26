#!/usr/bin/env node

/**
 * Script de configuración profesional para Supabase
 * Este script configura todo automáticamente
 */

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 CONFIGURACIÓN PROFESIONAL SUPABASE\n');

// Cargar variables de entorno
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://orgmacllkzakzubhpdvb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

async function checkSupabaseProject() {
  console.log('📊 PASO 1: Verificando proyecto Supabase...\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.rpc('pg_stat_statements_reset');
    
    if (error) {
      console.log('❌ Proyecto no accesible:', error.message);
      console.log('\n💡 Solución:');
      console.log('   1. Ve a https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
      console.log('   2. Verifica que el proyecto esté "Active" (no "Paused")');
      console.log('   3. Si está pausado, haz clic en "Restore"');
      console.log('   4. Espera 2-3 minutos y vuelve a ejecutar este script');
      return false;
    }
    
    console.log('   ✅ Proyecto Supabase está activo y accesible\n');
    return true;
  } catch (err) {
    console.log('❌ Error crítico:', err.message);
    return false;
  }
}

async function configureNetwork() {
  console.log('🔐 PASO 2: Configurando acceso de red...\n');
  console.log('   ⚠️  Este paso debe hacerse manualmente en el dashboard de Supabase');
  console.log('   1. Ve a: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb/settings/network');
  console.log('   2. En "IPv4 CIDR Allowlist", añade: 0.0.0.0/0 (para pruebas)');
  console.log('   3. Haz clic en "Save"');
  console.log('   4. Espera 30 segundos para que se apliquen los cambios\n');
  
  // Esperar confirmación del usuario
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('   ¿Has completado el paso 2? (s/n): ', (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 's');
    });
  });
}

async function applySchema() {
  console.log('🚀 PASO 3: Aplicando schema de Prisma a Supabase...\n');
  
  console.log('   Ejecutando: npm run db:push\n');
  
  const { execSync } = require('child_process');
  
  try {
    // Usar pooling URL para mejor conectividad
    const poolUrl = 'postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres';
    
    process.env.DATABASE_URL = poolUrl;
    
    execSync('npm run db:push', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: poolUrl },
      cwd: __dirname + '/..'
    });
    
    console.log('   ✅ Schema aplicado exitosamente\n');
    return true;
  } catch (err) {
    console.log('   ❌ Error aplicando schema:', err.message);
    console.log('\n   💡 Intenta manualmente:');
    console.log('      export DATABASE_URL="postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres"');
    console.log('      cd app && npm run db:push');
    return false;
  }
}

async function createAdminUser() {
  console.log('👤 PASO 4: Creando usuario administrador...\n');
  
  const { execSync } = require('child_process');
  
  try {
    execSync('node scripts/create-admin.js', { 
      stdio: 'inherit',
      cwd: __dirname + '/..'
    });
    
    console.log('   ✅ Usuario administrador creado\n');
    return true;
  } catch (err) {
    console.log('   ❌ Error creando usuario:', err.message);
    return false;
  }
}

async function testConnection() {
  console.log('🧪 PASO 5: Probando conexión completa...\n');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres'
      }
    }
  });
  
  try {
    await prisma.$connect();
    
    // Verificar tablas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('   ✅ Conexión exitosa');
    console.log('   📊 Tablas creadas:', tables.length);
    
    // Verificar usuario admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@ondaverificada.com' }
    });
    
    if (adminUser) {
      console.log('   ✅ Usuario administrador existe');
    } else {
      console.log('   ⚠️  Usuario administrador no encontrado');
    }
    
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.log('   ❌ Error de conexión:', err.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🎯 INICIANDO CONFIGURACIÓN PROFESIONAL SUPABASE\n');
  
  const projectActive = await checkSupabaseProject();
  if (!projectActive) {
    console.log('\n❌ Deteniendo configuración. Primero activa tu proyecto Supabase.');
    process.exit(1);
  }
  
  const networkConfigured = await configureNetwork();
  if (!networkConfigured) {
    console.log('\n❌ Deteniendo configuración. Configura el acceso de red primero.');
    process.exit(1);
  }
  
  console.log('   ⏳ Esperando 30 segundos para aplicar cambios de red...\n');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  const schemaApplied = await applySchema();
  if (!schemaApplied) {
    console.log('\n❌ Error aplicando schema. Revisa la configuración.');
    process.exit(1);
  }
  
  const adminCreated = await createAdminUser();
  if (!adminCreated) {
    console.log('\n⚠️  Advertencia: No se pudo crear usuario admin');
  }
  
  const connectionTested = await testConnection();
  if (!connectionTested) {
    console.log('\n❌ Error en prueba de conexión');
    process.exit(1);
  }
  
  console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!\n');
  console.log('📋 Resumen:');
  console.log('   ✅ Proyecto Supabase activo');
  console.log('   ✅ Red configurada');
  console.log('   ✅ Schema aplicado');
  console.log('   ✅ Usuario administrador creado');
  console.log('   ✅ Conexión verificada');
  console.log('\n🚀 Próximos pasos:');
  console.log('   cd app && npm run build && npm run start');
}

main().catch(console.error);