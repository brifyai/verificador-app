// Script para verificar y actualizar credenciales de Supabase
const fs = require('fs');
const path = require('path');

async function verifySupabaseCredentials() {
  console.log('🔍 VERIFICANDO CREDENCIALES DE SUPABASE\n');
  
  // Leer archivo .env actual
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('1. Credenciales actuales:');
  console.log('   - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('   - ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Presente' : '✗ Vacío');
  console.log('   - SERVICE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Presente' : '✗ Vacío');
  
  // Verificar conexión
  try {
    const { supabaseDirect } = require('../lib/supabase-direct');
    const result = await supabaseDirect.request('radios?select=count&limit=1');
    console.log('\n✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.log('\n❌ Error de conexión:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Invalid authentication')) {
      console.log('\n⚠️  Las credenciales parecen ser inválidas o han expirado.');
      console.log('\n📝 INSTRUCCIONES PARA OBTENER NUEVAS CREDENCIALES:');
      console.log('   1. Ve a https://supabase.com/dashboard');
      console.log('   2. Selecciona tu proyecto "verificador-app"');
      console.log('   3. Ve a "Settings" > "API"');
      console.log('   4. Copia:');
      console.log('      - Project URL (para NEXT_PUBLIC_SUPABASE_URL)');
      console.log('      - Anon public key (para NEXT_PUBLIC_SUPABASE_ANON_KEY)');
      console.log('      - Service role key (para SUPABASE_SERVICE_ROLE_KEY)');
      console.log('\n   5. Actualiza el archivo .env con las nuevas credenciales');
      console.log('\n   6. Reinicia el servidor: npm run dev');
    }
    
    return false;
  }
}

verifySupabaseCredentials();