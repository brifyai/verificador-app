// Desactivar Row Level Security en tabla users
require('dotenv').config({ path: '../.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function disableRLS() {
  console.log('🔓 Desactivando Row Level Security en tabla users...');
  console.log('═══════════════════════════════════════════════════');
  
  try {
    // Usar service_role key para desactivar RLS
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/disable_rls_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      console.log('✅ RLS desactivado exitosamente en tabla users');
      console.log('   Ahora puedes crear usuarios con Supabase Direct');
    } else {
      const error = await response.text();
      console.log('⚠️  No se pudo desactivar RLS via RPC');
      console.log('   Error:', error);
      console.log('');
      console.log('🔧 SOLUCIÓN ALTERNATIVA:');
      console.log('   Ve a Supabase Dashboard → Authentication → Policies');
      console.log('   Y desactiva RLS manualmente para la tabla users');
    }

  } catch (error) {
    console.log('⚠️  No se pudo desactivar RLS via RPC');
    console.log('   Error:', error.message);
    console.log('');
    console.log('🔧 SOLUCIÓN ALTERNATIVA:');
    console.log('   Ve a Supabase Dashboard → Authentication → Policies');
    console.log('   Y desactiva RLS manualmente para la tabla users');
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  disableRLS().catch(console.error);
}

module.exports = { disableRLS };