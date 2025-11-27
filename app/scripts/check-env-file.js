// Script para verificar el archivo .env directamente
const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DIRECTA DEL ARCHIVO .env\n');

const envPath = path.join(__dirname, '../.env');

// Verificar si el archivo existe
if (!fs.existsSync(envPath)) {
  console.log('❌ ERROR: El archivo app/.env NO EXISTE');
  console.log('\n📝 SOLUCIÓN:');
  console.log('   Crea el archivo app/.env con el siguiente contenido:\n');
  console.log('NEXT_PUBLIC_SUPABASE_URL=http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
  process.exit(1);
}

// Leer contenido raw
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('✅ Archivo app/.env encontrado\n');
console.log('Contenido actual:');
console.log('═══════════════════════════════════════════════════\n');
console.log(envContent);
console.log('═══════════════════════════════════════════════════\n');

// Verificar si tiene contenido
if (envContent.trim() === '') {
  console.log('❌ ERROR: El archivo app/.env está VACÍO');
  console.log('\n📝 SOLUCIÓN:');
  console.log('   Agrega el siguiente contenido:\n');
  console.log('NEXT_PUBLIC_SUPABASE_URL=http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
  process.exit(1);
}

// Verificar si las credenciales están presentes
const hasUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=');
const hasAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=');

console.log('2. Credenciales encontradas:');
console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? '✅' : '❌'}`);
console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasAnonKey ? '✅' : '❌'}`);
console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${hasServiceKey ? '✅' : '❌'}`);

if (!hasUrl || !hasAnonKey || !hasServiceKey) {
  console.log('\n❌ ERROR: Faltan credenciales en el archivo');
  console.log('\n📝 SOLUCIÓN:');
  console.log('   Asegúrate de que app/.env contenga:\n');
  console.log('NEXT_PUBLIC_SUPABASE_URL=http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
  process.exit(1);
}

console.log('\n3. Verificación de formato:');
const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
lines.forEach(line => {
  if (line.includes('SUPABASE')) {
    const parts = line.split('=');
    if (parts.length === 2) {
      console.log(`   ✅ ${parts[0]} = ${parts[1].substring(0, 30)}...`);
    } else {
      console.log(`   ❌ Formato inválido: ${line}`);
    }
  }
});

console.log('\n✅ El archivo .env parece estar correctamente configurado');
console.log('\n🔄 Si aún tienes errores 401, las credenciales pueden haber expirado.');
console.log('   Ve a https://supabase.com/dashboard, selecciona tu proyecto,');
console.log('   ve a Settings > API y copia las credenciales frescas.');