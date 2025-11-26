#!/usr/bin/env node

/**
 * Script de configuración y diagnóstico de Supabase
 * Este script ayuda a verificar la conectividad con Supabase
 */

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Configuración de Supabase para OndaVerificada\n');

// Cargar variables de entorno
require('dotenv').config();

// Credenciales de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://orgmacllkzakzubhpdvb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ21hY2xsa3pha3p1YmhwZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA4NTA0NiwiZXhwIjoyMDc5NjYxMDQ2fQ.RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk';
const DATABASE_URL = process.env.DATABASE_URL;

console.log('📊 Verificando configuración...\n');

// 1. Verificar variables de entorno
console.log('1. Variables de entorno:');
console.log('   ✅ SUPABASE_URL:', SUPABASE_URL);
console.log('   ✅ SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'Configurada' : '❌ No encontrada');
console.log('   ✅ DATABASE_URL:', DATABASE_URL ? 'Configurada' : '❌ No encontrada');

// 2. Probar conexión con Supabase API
async function testSupabaseConnection() {
  console.log('\n2. Probando conexión con Supabase API...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.log('   ❌ Error de conexión:', error.message);
      return false;
    }
    
    console.log('   ✅ Conexión con Supabase API exitosa');
    return true;
  } catch (err) {
    console.log('   ❌ Error crítico:', err.message);
    return false;
  }
}

// 3. Probar conexión con PostgreSQL
async function testDatabaseConnection() {
  console.log('\n3. Probando conexión con PostgreSQL...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL
        }
      }
    });
    
    await prisma.$connect();
    console.log('   ✅ Conexión con PostgreSQL exitosa');
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.log('   ❌ Error de conexión:', err.message);
    console.log('\n   💡 Soluciones posibles:');
    console.log('      - Verifica que el proyecto Supabase esté activo');
    console.log('      - Revisa Network Settings en Supabase Dashboard');
    console.log('      - Asegúrate que tu IP esté en la lista de permitidos');
    console.log('      - Prueba con la URL de pooling: aws-0-us-west-1.pooler.supabase.com:6543');
    return false;
  }
}

// 4. Generar comandos de configuración
function generateSetupCommands() {
  console.log('\n4. Comandos de configuración recomendados:\n');
  
  console.log('   # Opción A: Conexión directa (desarrollo)');
  console.log('   export DATABASE_URL="postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@db.orgmacllkzakzubhpdvb.supabase.co:5432/postgres"');
  console.log('');
  
  console.log('   # Opción B: Conexión con pooling (producción recomendado)');
  console.log('   export DATABASE_URL="postgresql://postgres.orgmacllkzakzubhpdvb:RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk@aws-0-us-west-1.pooler.supabase.com:6543/postgres"');
  console.log('');
  
  console.log('   # Probar conexión');
  console.log('   npm run db:push');
  console.log('');
  
  console.log('   # Crear usuario administrador');
  console.log('   node scripts/create-admin.js');
}

// Ejecutar pruebas
async function runDiagnostics() {
  const apiConnected = await testSupabaseConnection();
  const dbConnected = await testDatabaseConnection();
  
  console.log('\n📈 Resumen de diagnóstico:');
  console.log('   - Supabase API:', apiConnected ? '✅ Conectado' : '❌ No conectado');
  console.log('   - PostgreSQL DB:', dbConnected ? '✅ Conectado' : '❌ No conectado');
  
  if (!dbConnected) {
    console.log('\n⚠️  No se puede conectar a la base de datos');
    console.log('   Por favor, revisa:');
    console.log('   1. Que tu proyecto Supabase esté activo');
    console.log('   2. Que tu IP esté permitida en Network Settings');
    console.log('   3. Que las credenciales sean correctas');
  }
  
  generateSetupCommands();
}

// Ejecutar
runDiagnostics().catch(console.error);