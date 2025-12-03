#!/usr/bin/env node

/**
 * LIMPIAR CACHÉ DE GRABACIONES
 * Identifica y limpia cualquier caché que esté mostrando grabaciones antiguas
 */

const axios = require('axios');
const colors = require('colors');

// Configuración
const VPS_URL = 'http://213.199.39.147:5000';
const SUPABASE_URL = 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';
const LOCAL_API_BASE = 'http://localhost:3000';

// Función para verificar endpoint del VPS
async function checkVPSEndpoints() {
  console.log(colors.cyan.bold('\n🔍 VERIFICANDO ENDPOINTS DEL VPS\n'));
  
  const endpoints = [
    '/api/recordings',
    '/recordings',
    '/api/recordings/list',
    '/list',
    '/files',
    '/api/files'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(colors.bold(`Probando: ${VPS_URL}${endpoint}`));
      
      const response = await axios.get(`${VPS_URL}${endpoint}`, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 200) {
        const data = response.data;
        const count = Array.isArray(data) ? data.length : (data.recordings?.length || data.count || 0);
        console.log(colors.green(`   ✅ Respuesta: ${count} grabaciones`));
        
        if (count > 0) {
          console.log(colors.yellow(`   ⚠️ ENDPOINT CON DATOS: ${endpoint}`));
          console.log(`   📄 Primeros elementos:`, JSON.stringify(data.recordings?.slice(0, 2) || data.slice(0, 2), null, 2));
        }
      } else {
        console.log(colors.red(`   ❌ Código: ${response.status}`));
      }
    } catch (error) {
      console.log(colors.red(`   🚫 Error: ${error.message}`));
    }
    console.log('');
  }
}

// Función para verificar endpoints locales
async function checkLocalEndpoints() {
  console.log(colors.cyan.bold('\n🏠 VERIFICANDO ENDPOINTS LOCALES\n'));
  
  const endpoints = [
    '/api/recordings-from-supabase',
    '/api/vps-recording',
    '/api/recording-vps-fixed',
    '/grabaciones'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(colors.bold(`Probando: ${LOCAL_API_BASE}${endpoint}`));
      
      const response = await axios.get(`${LOCAL_API_BASE}${endpoint}`, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.status === 200) {
        const data = response.data;
        const count = Array.isArray(data) ? data.length : (data.recordings?.length || data.count || 0);
        console.log(colors.green(`   ✅ Respuesta: ${count} grabaciones`));
        
        if (count > 0) {
          console.log(colors.yellow(`   ⚠️ ENDPOINT CON DATOS: ${endpoint}`));
          console.log(`   📄 Estructura:`, Object.keys(data));
          if (data.recordings) {
            console.log(`   📋 Primeras grabaciones:`, data.recordings.slice(0, 2));
          }
        }
      } else {
        console.log(colors.red(`   ❌ Código: ${response.status}`));
      }
    } catch (error) {
      console.log(colors.red(`   🚫 Error: ${error.message}`));
    }
    console.log('');
  }
}

// Función para limpiar caché forcing nuevas requests
async function clearCache() {
  console.log(colors.cyan.bold('\n🧹 LIMPIANDO CACHÉ\n'));
  
  const timestamp = Date.now();
  const endpoints = [
    '/api/recordings-from-supabase',
    '/api/vps-recording',
    '/api/recording-vps-fixed'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(colors.bold(`Limpiando: ${endpoint}`));
      
      // Forzar nueva request con timestamp
      const response = await axios.get(`${LOCAL_API_BASE}${endpoint}?_cache_bust=${timestamp}`, {
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const data = response.data;
      const count = Array.isArray(data) ? data.length : (data.recordings?.length || data.count || 0);
      console.log(colors.green(`   ✅ Sin caché: ${count} grabaciones`));
      
    } catch (error) {
      console.log(colors.red(`   ❌ Error: ${error.message}`));
    }
  }
}

// Función para mostrar estado final
async function showFinalStatus() {
  console.log(colors.cyan.bold('\n📊 ESTADO FINAL DEL SISTEMA\n'));
  
  // Verificar VPS
  try {
    const vpsResponse = await axios.get(`${VPS_URL}/api/recordings`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    console.log(`🖥️ VPS: ${vpsResponse.data.count || 0} grabaciones`);
  } catch (error) {
    console.log(`🖥️ VPS: Error - ${error.message}`);
  }
  
  // Verificar base de datos
  try {
    const dbResponse = await axios.get(`${SUPABASE_URL}/rest/v1/recordings?select=count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    console.log(`🗄️ Base de datos: ${dbResponse.data.length} grabaciones`);
  } catch (error) {
    console.log(`🗄️ Base de datos: Error - ${error.message}`);
  }
  
  // Verificar API local
  try {
    const localResponse = await axios.get(`${LOCAL_API_BASE}/api/recordings-from-supabase`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    console.log(`🏠 API local: ${localResponse.data.count || 0} grabaciones`);
  } catch (error) {
    console.log(`🏠 API local: Error - ${error.message}`);
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n🧹 LIMPIADOR DE CACHÉ DE GRABACIONES 🧹\n'));
  
  try {
    await checkVPSEndpoints();
    await checkLocalEndpoints();
    await clearCache();
    await showFinalStatus();
    
    console.log(colors.cyan.bold('\n💡 RECOMENDACIONES:\n'));
    console.log('1. Si la interfaz web aún muestra grabaciones:');
    console.log('   - Limpiar caché del navegador (Ctrl+Shift+R)');
    console.log('   - Abrir en ventana incógnita');
    console.log('   - Verificar que no hay datos hardcodeados en el frontend');
    console.log('');
    console.log('2. Para evitar futuros problemas de caché:');
    console.log('   - Agregar headers de no-cache en las APIs');
    console.log('   - Implementar versioning en las respuestas');
    console.log('   - Usar timestamps en requests de desarrollo');
    
    console.log(colors.cyan.bold('\n=== PROCESO COMPLETADO ===\n'));
    
  } catch (error) {
    console.log(colors.red(`Error: ${error.message}`));
    console.error(error);
  }
}

// Ejecutar
main().catch(err => {
  console.log(colors.red(`Error fatal: ${err.message}`));
  console.error(err);
});