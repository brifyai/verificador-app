require('dotenv').config();

async function testConnectionConfig(url, description) {
  console.log(`\n🔍 Probando: ${description}`);
  console.log(`URL: ${url.replace(/:([^:@]+)@/, ':***@')}`);
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa');
    
    // Probar consulta simple
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('📊 Versión de PostgreSQL:', result[0].version);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    await prisma.$disconnect();
    return false;
  }
}

async function findCorrectConnection() {
  console.log('🔧 Buscando configuración correcta de Supabase...');
  console.log('================================================');
  
  const configs = [
    {
      url: `postgresql://postgres.mSSVhBSoCuGVaFu6:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      description: 'Configuración original (pooler)'
    },
    {
      url: `postgresql://postgres.mSSVhBSoCuGVaFu6:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
      description: 'Configuración con puerto 5432 (pooler)'
    },
    {
      url: `postgresql://postgres:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      description: 'Sin prefijo en usuario (pooler)'
    },
    {
      url: `postgresql://postgres.mSSVhBSoCuGVaFu6:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.direct.supabase.com:5432/postgres`,
      description: 'Conexión directa (direct)'
    },
    {
      url: `postgresql://postgres:vENh83ti9D68nVV3aL4NMAtBv9aa7XZc@aws-0-us-east-1.direct.supabase.com:5432/postgres`,
      description: 'Conexión directa sin prefijo (direct)'
    }
  ];
  
  for (const config of configs) {
    const success = await testConnectionConfig(config.url, config.description);
    if (success) {
      console.log('\n🎉 ¡CONFIGURACIÓN ENCONTRADA!');
      console.log('✅ URL correcta:', config.url.replace(/:([^:@]+)@/, ':***@'));
      console.log('\n📝 Actualiza tu .env con:');
      console.log(`DATABASE_URL=${config.url}`);
      
      // Actualizar el archivo .env automáticamente
      const fs = require('fs');
      let envContent = fs.readFileSync('.env', 'utf8');
      
      // Reemplazar la línea DATABASE_URL
      const newEnvContent = envContent.replace(
        /^DATABASE_URL=.*$/m,
        `DATABASE_URL=${config.url}`
      );
      
      fs.writeFileSync('.env', newEnvContent);
      console.log('✅ Archivo .env actualizado automáticamente');
      
      return config.url;
    }
  }
  
  console.log('\n❌ No se encontró una configuración válida');
  console.log('\n💡 Verifica manualmente:');
  console.log('1. El usuario y password en el dashboard de Supabase');
  console.log('2. El host correcto (pooler vs direct)');
  console.log('3. El puerto correcto');
  console.log('4. Que la base de datos exista');
  
  return null;
}

findCorrectConnection();