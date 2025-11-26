require('dotenv').config();

console.log('🔍 GUÍA PARA OBTENER CREDENCIALES CORRECTAS DE SUPABASE');
console.log('======================================================');

console.log('\n📋 PASO 1: Acceder al Dashboard de Supabase');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('1. Abre esta URL en tu navegador');
console.log('2. Inicia sesión con tus credenciales de administrador');

console.log('\n🗃️ PASO 2: Obtener Credenciales de Base de Datos');
console.log('1. En el menú lateral, haz clic en "Settings"');
console.log('2. Luego en "Database"');
console.log('3. Busca la sección "Connection string"');
console.log('4. Copia el "Connection string" para PostgreSQL');
console.log('5. Reemplaza [YOUR-PASSWORD] con tu contraseña real');

console.log('\n📝 PASO 3: Formato Esperado del DATABASE_URL');
console.log('El formato debe ser:');
console.log('postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres');

console.log('\n🔧 PASO 4: Ejemplos Comunes de Hosts');
console.log('• db.[PROJECT-REF].supabase.co (directo)');
console.log('• aws-0-[REGION].pooler.supabase.com:6543 (pooler)');
console.log('• aws-0-[REGION].direct.supabase.com:5432 (direct)');

console.log('\n🚀 PASO 5: Probar Diferentes Configuraciones');
console.log('Voy a probar algunas configuraciones comunes...');

const { PrismaClient } = require('@prisma/client');

const testConfigs = [
  {
    name: 'Configuración actual (pooler puerto 6543)',
    url: process.env.DATABASE_URL
  },
  {
    name: 'Configuración pooler puerto 5432',
    url: `postgresql://postgres.mSSVhBSoCuGVaFu6:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
  },
  {
    name: 'Configuración directa puerto 5432',
    url: `postgresql://postgres.mSSVhBSoCuGVaFu6:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.direct.supabase.com:5432/postgres`
  },
  {
    name: 'Configuración sin prefijo (pooler)',
    url: `postgresql://postgres:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: 'Configuración sin prefijo (direct)',
    url: `postgresql://postgres:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.direct.supabase.com:5432/postgres`
  }
];

async function testConfig(config, index) {
  console.log(`\n🔍 Probando configuración ${index + 1}: ${config.name}`);
  console.log(`URL: ${config.url.replace(/:([^:@]+)@/, ':***@')}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.url
      }
    }
  });
  
  try {
    await prisma.$connect();
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    
    // Probar consulta simple
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('📊 Versión PostgreSQL:', result[0].version.substring(0, 50) + '...');
    
    // Verificar tablas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('📋 Tablas encontradas:', tables.length);
    
    await prisma.$disconnect();
    
    console.log('\n🎉 ¡CONFIGURACIÓN CORRECTA ENCONTRADA!');
    console.log('✅ URL correcta:', config.url.replace(/:([^:@]+)@/, ':***@'));
    
    // Actualizar .env automáticamente
    const fs = require('fs');
    let envContent = fs.readFileSync('.env', 'utf8');
    
    const newEnvContent = envContent.replace(
      /^DATABASE_URL=.*$/m,
      `DATABASE_URL=${config.url}`
    );
    
    fs.writeFileSync('.env', newEnvContent);
    console.log('✅ Archivo .env actualizado automáticamente');
    
    return true;
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    await prisma.$disconnect();
    return false;
  }
}

async function testAllConfigs() {
  for (let i = 0; i < testConfigs.length; i++) {
    const success = await testConfig(testConfigs[i], i);
    if (success) {
      console.log('\n🏁 PRUEBAS DETENIDAS - CONFIGURACIÓN ENCONTRADA');
      return;
    }
  }
  
  console.log('\n❌ NO SE ENCONTRÓ UNA CONFIGURACIÓN VÁLIDA');
  console.log('\n💡 ACCIONES RECOMENDADAS:');
  console.log('1. Verifica tus credenciales en el dashboard de Supabase');
  console.log('2. Asegúrate que el proyecto esté activo');
  console.log('3. Revisa que la base de datos esté configurada');
  console.log('4. Confirma que el usuario postgres tenga los permisos correctos');
  
  console.log('\n📖 Si necesitas ayuda adicional:');
  console.log('• Contacta a soporte de Supabase');
  console.log('• Revisa la documentación oficial');
  console.log('• Verifica el estado del proyecto en el dashboard');
}

testAllConfigs();