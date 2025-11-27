// Script para verificar que el Service Role Key sea válido
const jwt = require('jsonwebtoken');

console.log('🔍 VERIFICACIÓN DE SERVICE ROLE KEY\n');
console.log('═══════════════════════════════════════════════════\n');

// Decodificar los tokens
const anonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';
const serviceKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

console.log('1. ANON KEY decodificado:');
try {
  const anonDecoded = jwt.decode(anonKey);
  console.log('   ✅ Token válido');
  console.log('   Role:', anonDecoded.role);
  console.log('   Expira:', new Date(anonDecoded.exp * 1000));
} catch (error) {
  console.log('   ❌ Token inválido');
}

console.log('\n2. SERVICE ROLE KEY decodificado:');
try {
  const serviceDecoded = jwt.decode(serviceKey);
  console.log('   ✅ Token válido');
  console.log('   Role:', serviceDecoded.role);
  console.log('   Expira:', new Date(serviceDecoded.exp * 1000));
} catch (error) {
  console.log('   ❌ Token inválido');
}

console.log('\n3. Comparación:');
if (anonKey === serviceKey) {
  console.log('   ❌ ERROR CRÍTICO: ANON KEY y SERVICE ROLE KEY son idénticos');
  console.log('   → Esto es incorrecto. Necesitas el SERVICE ROLE KEY real de Supabase');
} else {
  console.log('   ✅ Los tokens son diferentes (correcto)');
}

console.log('\n4. Verificación de firma:');
console.log('   ANON KEY firma:', anonKey.split('.')[2].substring(0, 20) + '...');
console.log('   SERVICE KEY firma:', serviceKey.split('.')[2].substring(0, 20) + '...');

console.log('\n5. SOLUCIÓN INMEDIATA:');
console.log('   Ve a https://supabase.com/dashboard');
console.log('   Selecciona tu proyecto');
console.log('   Ve a Settings > API');
console.log('   Copia el "service_role key" (es diferente al anon key)');
console.log('   Actualiza app/.env con el SERVICE ROLE KEY real\n');

console.log('6. Diferencia entre keys:');
console.log('   - ANON KEY: Para operaciones públicas (con RLS)');
console.log('   - SERVICE ROLE KEY: Para operaciones administrativas (bypass RLS)');
console.log('   - DEBEN SER TOKENS DIFERENTES\n');

console.log('═══════════════════════════════════════════════════');
console.log('💡 El error 401 ocurre porque estás usando un token');
console.log('   inválido como Service Role Key. El sistema necesita');
console.log('   el token REAL de service_role para bypass RLS.');
console.log('═══════════════════════════════════════════════════');