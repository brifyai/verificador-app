// Desactivar RLS usando SQL directo con service role
require('dotenv').config({ path: '../.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function disableRLSWithSQL() {
  console.log('🔓 Desactivando Row Level Security en tabla users via SQL...');
  console.log('═══════════════════════════════════════════════════════════════');
  
  try {
    // Ejecutar SQL para desactivar RLS
    const sql = 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;';
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ 
        sql: sql
      })
    });

    if (response.ok) {
      console.log('✅ RLS desactivado exitosamente en tabla users');
      console.log('   Ahora puedes crear usuarios con Supabase Direct');
    } else {
      const error = await response.text();
      console.log('⚠️  No se pudo desactivar RLS via SQL');
      console.log('   Error:', error);
      console.log('');
      console.log('🔧 SOLUCIÓN MANUAL:');
      console.log('   1. Ve a Supabase Dashboard → SQL Editor');
      console.log('   2. Ejecuta: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
      console.log('   3. O ve a Authentication → Policies y desactiva RLS');
    }

  } catch (error) {
    console.log('⚠️  No se pudo desactivar RLS via SQL');
    console.log('   Error:', error.message);
    console.log('');
    console.log('🔧 SOLUCIÓN MANUAL:');
    console.log('   1. Ve a Supabase Dashboard → SQL Editor');
    console.log('   2. Ejecuta: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
    console.log('   3. O ve a Authentication → Policies y desactiva RLS');
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  disableRLSWithSQL().catch(console.error);
}

module.exports = { disableRLSWithSQL };