#!/usr/bin/env node

/**
 * Verificación simple de Supabase usando el cliente oficial
 */

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 VERIFICACIÓN SIMPLE SUPABASE\n');

const SUPABASE_URL = 'https://orgmacllkzakzubhpdvb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ21hY2xsa3pha3p1YmhwZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA4NTA0NiwiZXhwIjoyMDc5NjYxMDQ2fQ.RLTle8zj61038FFckHb7TpxErzG9k1leKGgso_iYiTk';

async function testConnection() {
  try {
    console.log('1. Conectando a Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('2. Probando consulta...');
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
      
      if (error.message.includes('JWT')) {
        console.log('\n💡 El token JWT es inválido');
        console.log('   - Verifica SUPABASE_SERVICE_KEY en app/.env');
      }
      
      if (error.message.includes('Tenant')) {
        console.log('\n💡 El proyecto no existe o no está activo');
        console.log('   - Verifica que el proyecto esté en: https://supabase.com/dashboard/project/orgmacllkzakzubhpdvb');
        console.log('   - Asegúrate que diga "Active" (no "Paused")');
      }
      
      return false;
    }
    
    console.log('✅ Conexión exitosa');
    console.log('✅ Credenciales válidas');
    
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

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Las credenciales de Supabase son válidas');
    console.log('   El problema está en la conexión PostgreSQL, no en Supabase');
    console.log('\n   Próximo paso:');
    console.log('   cd app && npm run db:push');
  } else {
    console.log('\n❌ Las credenciales tienen problemas');
    console.log('   Revisa el mensaje de error arriba');
  }
}).catch(console.error);