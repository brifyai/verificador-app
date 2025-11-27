// GUÍA RÁPIDA: Cómo obtener el Service Role Key REAL de Supabase
console.log('🎯 SOLUCIÓN INMEDIATA: Obtener Service Role Key Real\n');
console.log('═══════════════════════════════════════════════════\n');

console.log('❌ PROBLEMA IDENTIFICADO:');
console.log('   Tu Service Role Key es idéntico al Anon Key');
console.log('   → Esto es INCORRECTO y causa error 401\n');

console.log('\n✅ SOLUCIÓN EN 3 PASOS:\n');

console.log('PASO 1: Acceder a Supabase Dashboard');
console.log('   → https://supabase.com/dashboard');
console.log('   → Inicia sesión con tu cuenta\n');

console.log('PASO 2: Seleccionar Proyecto');
console.log('   → Busca "verificador-app"');
console.log('   → Haz clic en el proyecto\n');

console.log('PASO 3: Obtener Service Role Key');
console.log('   → Ve a "Settings" (en el menú lateral)');
console.log('   → Haz clic en "API"');
console.log('   → Desplázate hasta "service_role key"');
console.log('   → Haz clic en el botón "Reveal" (mostrar)');
console.log('   → Copia el token completo\n');

console.log('\n🔑 DIFERENCIA ENTRE KEYS:\n');
console.log('Anon Key (ya lo tienes):');
console.log('→ eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
console.log('→ Usado para operaciones públicas (con RLS)\n');
console.log('Service Role Key (necesitas esto):');
console.log('→ eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.XXXXXXXXXXXXXXXXXXXX');
console.log('→ Usado para operaciones administrativas (bypass RLS)');
console.log('→ DEBE SER DIFERENTE al Anon Key\n');

console.log('\n📝 ACTUALIZAR ARCHIVO .env:\n');
console.log('1. Abre app/.env');
console.log('2. Reemplaza la línea:');
console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw');
console.log('3. Con el Service Role Key REAL que copiaste de Supabase\n');

console.log('\n🔄 REINICIAR SERVIDOR:\n');
console.log('cd app && npm run dev\n');

console.log('\n✅ VERIFICACIÓN:\n');
console.log('Después de actualizar, ejecuta:');
console.log('cd app && node -r dotenv/config scripts/test-supabase-direct.js');
console.log('→ Debería mostrar "✅ Conexión exitosa" sin errores 401\n');

console.log('\n═══════════════════════════════════════════════════');
console.log('💡 El Service Role Key es CRÍTICO para bypass RLS');
console.log('   Sin él, no puedes acceder a tablas con RLS habilitada');
console.log('   como api_configurations. ¡DEBE SER DIFERENTE al Anon Key!');
console.log('═══════════════════════════════════════════════════\n');