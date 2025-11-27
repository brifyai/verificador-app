// Script para verificar credenciales exactas en .env
const fs = require('fs');
const path = require('path');

// Leer archivo .env directamente
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('🔍 VERIFICACIÓN EXACTA DE CREDENCIALES EN .env\n');
console.log('Contenido actual de app/.env:');
console.log('═══════════════════════════════════════════════════\n');
console.log(envContent);
console.log('═══════════════════════════════════════════════════\n');

// Parsear variables
const envLines = envContent.split('\n');
const envVars = {};

envLines.forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

console.log('1. Variables de Supabase encontradas:');
console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗'}`);
console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗'}`);
console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${envVars.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗'}`);

console.log('\n2. Valores actuales:');
console.log(`   URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`   ANON KEY: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50)}...`);
console.log(`   SERVICE KEY: ${envVars.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50)}...`);

console.log('\n3. Verificación de formato:');
console.log(`   URL termina en .co: ${envVars.NEXT_PUBLIC_SUPABASE_URL?.endsWith('.co') ? '✓' : '✗ (puede ser un dominio custom)'}`);
console.log(`   ANON KEY tiene 3 partes: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY?.split('.').length === 3 ? '✓' : '✗'}`);
console.log(`   SERVICE KEY tiene 3 partes: ${envVars.SUPABASE_SERVICE_ROLE_KEY?.split('.').length === 3 ? '✓' : '✗'}`);

console.log('\n4. Credenciales que deberías tener (según tu mensaje):');
console.log('   URL: http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io');
console.log('   ANON KEY: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
console.log('   SERVICE KEY: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');

console.log('\n5. Comparación:');
const expectedUrl = 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const expectedAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';
const expectedServiceKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

console.log(`   URL coincide: ${envVars.NEXT_PUBLIC_SUPABASE_URL === expectedUrl ? '✅ SÍ' : '❌ NO'}`);
console.log(`   ANON KEY coincide: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === expectedAnonKey ? '✅ SÍ' : '❌ NO'}`);
console.log(`   SERVICE KEY coincide: ${envVars.SUPABASE_SERVICE_ROLE_KEY === expectedServiceKey ? '✅ SÍ' : '❌ NO'}`);

console.log('\n6. Recomendación:');
if (envVars.NEXT_PUBLIC_SUPABASE_URL !== expectedUrl || 
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY !== expectedAnonKey || 
    envVars.SUPABASE_SERVICE_ROLE_KEY !== expectedServiceKey) {
  console.log('   ❌ Las credenciales en .env NO coinciden con las que me proporcionaste.');
  console.log('   📝 ACTUALIZA el archivo app/.env con las credenciales exactas que me diste.');
} else {
  console.log('   ✅ Las credenciales en .env son correctas.');
  console.log('   ⚠️  El problema es que estas credenciales son INVÁLIDAS para el proyecto actual.');
  console.log('   🔄 Ve a https://supabase.com/dashboard, selecciona tu proyecto,');
  console.log('      ve a Settings > API y copia las credenciales FRESCHAS.');
}

console.log('\n7. Para actualizar .env:');
console.log('   Abre app/.env y reemplaza las líneas de Supabase con:');
console.log('');
console.log('   NEXT_PUBLIC_SUPABASE_URL=http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');