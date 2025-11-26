#!/usr/bin/env node

/**
 * Script para probar la conexión con PocketBase y encontrar el endpoint correcto
 */

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const ADMIN_EMAIL = 'camiloalegriabarra@gmail.com';
const ADMIN_PASSWORD = 'Aintelligence2025$';

async function testConnection() {
  console.log('🔍 Probando conexión con PocketBase...\n');
  console.log(`URL: ${POCKETBASE_URL}`);
  console.log(`Email: ${ADMIN_EMAIL}\n`);

  // Probar diferentes endpoints de autenticación
  const endpoints = [
    '/api/admins/auth-with-password',
    '/api/admins/auth-via-email',
    '/api/collections/_superusers/auth-with-password',
    '/api/collections/users/auth-with-password'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Probando endpoint: ${endpoint}`);
      const response = await fetch(`${POCKETBASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        })
      });

      console.log(`   Status: ${response.status}`);
      console.log(`   Status Text: ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ ÉXITO! Respuesta:', JSON.stringify(data, null, 2));
        return { endpoint, token: data.token };
      } else {
        const error = await response.text();
        console.log(`   ❌ Error: ${error.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
    console.log('');
  }

  console.log('🔍 Probando acceso a la UI...');
  try {
    const uiResponse = await fetch(`${POCKETBASE_URL}/_/`);
    console.log(`   UI Status: ${uiResponse.status}`);
    if (uiResponse.ok) {
      console.log('   ✅ UI accesible');
    }
  } catch (error) {
    console.log(`   ❌ Error accediendo a UI: ${error.message}`);
  }

  console.log('\n❌ No se encontró un endpoint de autenticación válido');
  console.log('\n💡 Sugerencias:');
  console.log('1. Verifica que la URL sea correcta: https://pocket.brifyai.com');
  console.log('2. Asegúrate que PocketBase esté corriendo correctamente');
  console.log('3. Verifica las credenciales de administrador');
  console.log('4. Intenta acceder manualmente a la UI para confirmar que funciona');
}

testConnection();