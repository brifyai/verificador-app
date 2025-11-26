require('dotenv').config();

async function diagnoseAuthFlow() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE FLUJO DE AUTENTICACIÓN');
  console.log('==================================================');
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bcrypt = require('bcryptjs');
  
  console.log('\n📋 1. VERIFICANDO CONFIGURACIÓN');
  console.log('================================');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Supabase API Key:', SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ No configurado');
  
  console.log('\n🔐 2. VERIFICANDO USUARIO EN SUPABASE');
  console.log('======================================');
  
  try {
    // Obtener usuario directamente
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.admin@verificador.com`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!userResponse.ok) {
      console.log('❌ Error obteniendo usuario:', await userResponse.text());
      return;
    }
    
    const users = await userResponse.json();
    console.log('Usuarios encontrados:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }
    
    const user = users[0];
    console.log('📋 Usuario encontrado:');
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - Name:', user.name);
    console.log('   - Role:', user.role);
    console.log('   - Active:', user.active);
    console.log('   - Password (hash):', user.password.substring(0, 20) + '...');
    
    console.log('\n🔑 3. VERIFICANDO CONTRASEÑA');
    console.log('============================');
    
    // Verificar contraseña
    const password = 'admin123';
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Contraseña "admin123" válida:', isValid ? '✅ SÍ' : '❌ NO');
    
    if (!isValid) {
      console.log('⚠️ La contraseña no coincide. Generando nuevo hash...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('Nuevo hash generado:', newHash.substring(0, 20) + '...');
      
      // Actualizar contraseña
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ password: newHash })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Contraseña actualizada en la base de datos');
      } else {
        console.log('❌ Error actualizando contraseña:', await updateResponse.text());
      }
    }
    
    console.log('\n🌐 4. PROBANDO ENDPOINT DE AUTH');
    console.log('================================');
    
    // Probar endpoint de auth
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('CSRF Token obtenido:', csrfData.csrfToken ? '✅ SÍ' : '❌ NO');
    
    console.log('\n🚀 5. PROBANDO LOGIN COMPLETO');
    console.log('==============================');
    
    // Probar login completo
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@verificador.com',
        password: 'admin123',
        callbackUrl: 'http://localhost:3000/dashboard',
        csrfToken: csrfData.csrfToken,
        json: 'true'
      })
    });
    
    console.log('Respuesta del login:', loginResponse.status, loginResponse.statusText);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Datos del login:', loginData);
      
      if (loginData.url) {
        console.log('✅ Login exitoso - URL de redirección:', loginData.url);
      }
    } else {
      console.log('❌ Login falló:', await loginResponse.text());
    }
    
    console.log('\n📊 6. VERIFICANDO SESIÓN');
    console.log('=======================');
    
    // Verificar sesión después del login
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      credentials: 'include'
    });
    
    const sessionData = await sessionResponse.json();
    console.log('Sesión activa:', sessionData.user ? '✅ SÍ' : '❌ NO');
    
    if (sessionData.user) {
      console.log('Usuario en sesión:', sessionData.user.email);
    }
    
    console.log('\n🎯 DIAGNÓSTICO COMPLETO');
    console.log('======================');
    console.log('✅ Supabase URL:', SUPABASE_URL ? 'Configurado' : 'No configurado');
    console.log('✅ Supabase Key:', SUPABASE_ANON_KEY ? 'Configurado' : 'No configurado');
    console.log('✅ Usuario existe:', users.length > 0 ? 'Sí' : 'No');
    console.log('✅ Contraseña válida:', isValid ? 'Sí' : 'No (corregida)');
    console.log('✅ CSRF Token:', csrfData.csrfToken ? 'Obtenido' : 'No obtenido');
    console.log('✅ Login endpoint:', loginResponse.ok ? 'Respondiendo' : 'Error');
    console.log('✅ Sesión:', sessionData.user ? 'Establecida' : 'No establecida');
    
    console.log('\n🎉 RESULTADO FINAL');
    console.log('==================');
    
    if (isValid && loginResponse.ok && sessionData.user) {
      console.log('✅ TODO ESTÁ FUNCIONANDO CORRECTAMENTE');
      console.log('🚀 La aplicación está lista para usar');
      console.log('📧 Credenciales: admin@verificador.com / admin123');
      console.log('🌐 URL: http://localhost:3000/auth/signin');
    } else {
      console.log('❌ HAY PROBLEMAS EN EL FLUJO');
      console.log('🔧 Revisa los puntos marcados arriba');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

diagnoseAuthFlow();