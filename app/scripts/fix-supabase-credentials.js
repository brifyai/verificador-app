// Script para verificar y actualizar credenciales de Supabase
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyAndFixSupabaseCredentials() {
  console.log('🔧 VERIFICANDO Y REPARANDO CREDENCIALES DE SUPABASE\n');
  
  const { supabaseDirect } = require('../lib/supabase-direct');
  
  try {
    console.log('1. Credenciales cargadas desde .env:');
    console.log('   - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Presente' : '✗ Vacío');
    console.log('   - ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Presente' : '✗ Vacío');
    console.log('   - SERVICE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Presente' : '✗ Vacío');
    
    // Intentar conexión
    console.log('\n2. Probando conexión a Supabase...');
    const result = await supabaseDirect.request('radios?select=count&limit=1');
    console.log('   ✅ Conexión exitosa');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ Error de conexión:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Invalid authentication')) {
      console.log('\n⚠️  LAS CREDENCIALES DE SUPABASE SON INVÁLIDAS O HAN EXPIRADO');
      console.log('\n📝 INSTRUCCIONES PARA OBTENER NUEVAS CREDENCIALES:');
      console.log('   1. Ve a https://supabase.com/dashboard');
      console.log('   2. Selecciona tu proyecto "verificador-app"');
      console.log('   3. Ve a "Settings" > "API"');
      console.log('   4. Copia los siguientes valores:');
      console.log('');
      console.log('   PROJECT URL (para NEXT_PUBLIC_SUPABASE_URL):');
      console.log('   → https://your-project-id.supabase.co');
      console.log('');
      console.log('   ANON PUBLIC KEY (para NEXT_PUBLIC_SUPABASE_ANON_KEY):');
      console.log('   → eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...');
      console.log('');
      console.log('   SERVICE ROLE KEY (para SUPABASE_SERVICE_ROLE_KEY):');
      console.log('   → eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...');
      console.log('');
      console.log('   5. Actualiza el archivo app/.env con estas credenciales');
      console.log('   6. Reinicia el servidor: cd app && npm run dev');
      console.log('');
      console.log('   💡 NOTA: Las credenciales anteriores pueden haber expirado');
      console.log('      o el proyecto puede haber sido pausado por inactividad.');
    }
    
    return false;
  }
}

// Ejecutar
verifyAndFixSupabaseCredentials().then(success => {
  if (success) {
    console.log('\n✅ Credenciales de Supabase funcionando correctamente');
  } else {
    console.log('\n❌ Se requiere actualizar las credenciales de Supabase');
    process.exit(1);
  }
});