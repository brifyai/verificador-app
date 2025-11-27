const { supabaseDirect } = require('../lib/supabase-direct');

async function diagnoseAuthFlow() {
  console.log('🔍 DIAGNÓSTICO DE FLUJO DE AUTENTICACIÓN\n');
  
  try {
    // 1. Verificar usuario admin existe
    console.log('1. Verificando usuario admin en Supabase...');
    const users = await supabaseDirect.getUsers({ email: 'admin@verificador.com' });
    
    if (users.length === 0) {
      console.log('❌ Usuario admin no encontrado');
      console.log('💡 Solución: Ejecuta node scripts/setup-admin.js');
      return;
    }
    
    const adminUser = users[0];
    console.log('✅ Usuario admin encontrado:');
    console.log(`   - ID: ${adminUser.id}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Activo: ${adminUser.active}`);
    console.log(`   - Rol: ${adminUser.role}`);
    
    // 2. Verificar endpoints de auth
    console.log('\n2. Verificando endpoints de autenticación...');
    
    const endpoints = [
      { path: '/api/auth/me', method: 'GET' },
      { path: '/api/auth/login-direct', method: 'POST' },
      { path: '/api/auth/logout', method: 'POST' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const baseUrl = 'http://localhost:3000';
        const url = `${baseUrl}${endpoint.path}`;
        
        const options = {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        };
        
        // Para login-direct, agregar body
        if (endpoint.path === '/api/auth/login-direct') {
          options.body = JSON.stringify({
            email: 'admin@verificador.com',
            password: 'admin123'
          });
        }
        
        const response = await fetch(url, options);
        console.log(`   ✅ ${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
        
        // Para login-direct, mostrar si setea cookie
        if (endpoint.path === '/api/auth/login-direct' && response.status === 200) {
          const cookies = response.headers.get('set-cookie');
          if (cookies && cookies.includes('auth-token')) {
            console.log('      🍪 Cookie auth-token seteada correctamente');
          } else {
            console.log('      ⚠️  Cookie auth-token NO encontrada en respuesta');
          }
        }
        
      } catch (error) {
        console.log(`   ❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
      }
    }
    
    // 3. Verificar tabla de sesiones (si existe)
    console.log('\n3. Verificando tabla de sesiones...');
    try {
      const sessions = await supabaseDirect.request('sessions?select=*&limit=5');
      console.log(`   ✅ Tabla sessions accesible - ${sessions.length} registros encontrados`);
    } catch (error) {
      console.log(`   ℹ️  Tabla sessions no existe o no es accesible (esto es normal)`);
    }
    
    // 4. Verificar cookies en el navegador
    console.log('\n4. INSTRUCCIONES PARA VERIFICAR COOKIES:');
    console.log('   1. Abre Chrome DevTools (F12)');
    console.log('   2. Ve a la pestaña "Application"');
    console.log('   3. En la sección "Storage", selecciona "Cookies"');
    console.log('   4. Verifica que exista una cookie llamada "auth-token"');
    console.log('   5. El valor debe ser el user_id del admin');
    console.log(`   6. User ID esperado: ${adminUser.id}`);
    
    // 5. Verificar localStorage
    console.log('\n5. INSTRUCCIONES PARA VERIFICAR LOCALSTORAGE:');
    console.log('   1. Abre Chrome DevTools (F12)');
    console.log('   2. Ve a la pestaña "Application"');
    console.log('   3. En la sección "Storage", selecciona "Local Storage"');
    console.log('   4. Verifica que exista una clave llamada "auth-token"');
    console.log('   5. El valor debe coincidir con la cookie');
    
    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    console.log('\n💡 SI EL LOGIN FALLA DESPUÉS DE VER ESTO:');
    console.log('   1. Limpia cookies y localStorage');
    console.log('   2. Reinicia el servidor: npm run dev');
    console.log('   3. Intenta login nuevamente');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

diagnoseAuthFlow();