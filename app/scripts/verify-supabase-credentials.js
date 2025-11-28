#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('🔍 VERIFICACIÓN DE CREDENCIALES DE SUPABASE');
console.log('===========================================\n');

// 1. Verificar archivo .env
console.log('1️⃣ Verificando archivo .env...');
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('   ❌ Archivo .env no encontrado');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
console.log('   ✅ Archivo .env encontrado');

// Extraer variables
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1];
const supabaseServiceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1];

console.log('\n2️⃣ Variables de entorno encontradas:');
console.log(`   📊 NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || '❌ No encontrada'}`);
console.log(`   🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : '❌ No encontrada'}`);
console.log(`   🔐 SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? supabaseServiceRoleKey.substring(0, 30) + '...' : '❌ No encontrada'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Faltan variables de entorno necesarias');
  process.exit(1);
}

// 3. Probar conexión con ANON KEY
console.log('\n3️⃣ Probando conexión con ANON KEY...');
async function testConnection() {
  try {
    const response = await axios.get(
      `${supabaseUrl}/rest/v1/radios?select=count&limit=1`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    );
    
    console.log(`   ✅ Conexión exitosa! ${response.data[0]?.count || 0} radios encontradas`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
      console.log(`   📄 Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 4. Probar conexión con SERVICE KEY
console.log('\n4️⃣ Probando conexión con SERVICE KEY...');
async function testServiceKeyConnection() {
  if (!supabaseServiceKey) {
    console.log('   ⚠️ SERVICE KEY no configurada, saltando prueba');
    return false;
  }

  try {
    const response = await axios.get(
      `${supabaseUrl}/rest/v1/radios?select=count&limit=1`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    );
    
    console.log(`   ✅ Conexión con SERVICE KEY exitosa! ${response.data[0]?.count || 0} radios encontradas`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error de conexión con SERVICE KEY: ${error.message}`);
    return false;
  }
}

// Ejecutar pruebas
(async () => {
  const anonSuccess = await testConnection();
  const serviceSuccess = await testServiceKeyConnection();
  
  console.log('\n📋 RESUMEN:');
  console.log(`   ANON KEY: ${anonSuccess ? '✅ Funcional' : '❌ No funcional'}`);
  console.log(`   SERVICE KEY: ${serviceSuccess ? '✅ Funcional' : '⚠️ No probada o fallida'}`);
  
  if (anonSuccess) {
    console.log('\n🎉 Las credenciales de Supabase están correctamente configuradas!');
    console.log('\n💡 Para crear radios sin autenticación web, usa:');
    console.log('   node create-radio-direct.js');
  } else {
    console.log('\n❌ Las credenciales de Supabase no funcionan. Revisa:');
    console.log('   1. Que el proyecto Supabase esté activo');
    console.log('   2. Que las URLs y keys sean correctas');
    console.log('   3. Que RLS (Row Level Security) esté configurado correctamente');
  }
  
  process.exit(anonSuccess ? 0 : 1);
})();