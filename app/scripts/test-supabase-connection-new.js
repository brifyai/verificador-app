const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔍 Probando conexión con Supabase...');
  console.log('=====================================');
  
  // Mostrar variables de entorno (ocultando passwords)
  console.log('📋 Variables de entorno:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@'));
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🔌 Intentando conectar a la base de datos...');
    
    // Intentar conexión simple
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Intentar consulta simple
    console.log('\n📊 Ejecutando consulta de prueba...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Consulta de prueba exitosa:', result);
    
    // Verificar si existen tablas
    console.log('\n🗂️ Verificando tablas existentes...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('Tablas encontradas:', tables.map(t => t.table_name));
    
    console.log('\n🎉 ¡Conexión y verificación completadas con éxito!');
    
  } catch (error) {
    console.error('\n❌ Error en la conexión:');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    
    if (error.message.includes('Tenant or user not found')) {
      console.log('\n💡 Solución sugerida:');
      console.log('1. Verifica que el usuario y password sean correctos');
      console.log('2. Confirma que el host y puerto sean los correctos');
      console.log('3. Asegúrate de que la base de datos exista');
      console.log('4. Verifica los permisos del usuario');
    }
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Solución sugerida:');
      console.log('1. Verifica el password del usuario');
      console.log('2. Confirma que el usuario exista');
    }
    
    if (error.message.includes('connection refused')) {
      console.log('\n💡 Solución sugerida:');
      console.log('1. Verifica el host y puerto');
      console.log('2. Confirma que el servidor esté activo');
    }
    
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexión cerrada');
  }
}

testSupabaseConnection();