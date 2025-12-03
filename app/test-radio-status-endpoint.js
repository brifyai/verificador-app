#!/usr/bin/env node

/**
 * Script para probar el endpoint de actualización de estado de radio
 * Verifica que ya no haya errores 401 de autenticación
 */

const http = require('http');
const fs = require('fs');

// Configuración
const BASE_URL = 'http://localhost:3000';
const RADIO_ID = 'radio-1'; // ID de una radio existente para pruebas
const ADMIN_TOKEN_FILE = './admin-token.txt';

// Función para leer el token del archivo
function readAdminToken() {
  try {
    const token = fs.readFileSync(ADMIN_TOKEN_FILE, 'utf8').trim();
    console.log('✅ Token de admin leído correctamente');
    return token;
  } catch (error) {
    console.log('❌ Error leyendo token de admin:', error.message);
    return null;
  }
}

// Función para hacer petición HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Función principal de prueba
async function testRadioStatusEndpoint() {
  console.log('🧪 Probando endpoint de actualización de estado de radio...');
  console.log('=' .repeat(60));
  
  // Leer token de admin
  const token = readAdminToken();
  if (!token) {
    console.log('❌ No se pudo leer el token de admin. Abortando prueba.');
    return;
  }
  
  console.log(`📻 Probando con radio ID: ${RADIO_ID}`);
  console.log(`🔗 URL: ${BASE_URL}/api/radios/${RADIO_ID}/status`);
  console.log('');
  
  // Test 1: Activar radio (cambiar a ACTIVE)
  console.log('📝 Test 1: Activando radio (cambiar a ACTIVE)...');
  try {
    const activateOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/radios/${RADIO_ID}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const activateData = JSON.stringify({ isActive: true });
    
    const activateResponse = await makeRequest(activateOptions, activateData);
    
    console.log(`📊 Status Code: ${activateResponse.statusCode}`);
    console.log(`📄 Response:`, JSON.stringify(activateResponse.data, null, 2));
    
    if (activateResponse.statusCode === 200) {
      console.log('✅ Test 1 PASÓ: Radio activada exitosamente');
    } else if (activateResponse.statusCode === 401) {
      console.log('❌ Test 1 FALLÓ: Error 401 - Problema de autenticación');
    } else {
      console.log(`⚠️ Test 1 RESULTADO INESPERADO: Status ${activateResponse.statusCode}`);
    }
    
  } catch (error) {
    console.log('❌ Test 1 ERROR:', error.message);
  }
  
  console.log('');
  
  // Test 2: Desactivar radio (cambiar a INACTIVE)
  console.log('📝 Test 2: Desactivando radio (cambiar a INACTIVE)...');
  try {
    const deactivateOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/radios/${RADIO_ID}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const deactivateData = JSON.stringify({ isActive: false });
    
    const deactivateResponse = await makeRequest(deactivateOptions, deactivateData);
    
    console.log(`📊 Status Code: ${deactivateResponse.statusCode}`);
    console.log(`📄 Response:`, JSON.stringify(deactivateResponse.data, null, 2));
    
    if (deactivateResponse.statusCode === 200) {
      console.log('✅ Test 2 PASÓ: Radio desactivada exitosamente');
    } else if (deactivateResponse.statusCode === 401) {
      console.log('❌ Test 2 FALLÓ: Error 401 - Problema de autenticación');
    } else {
      console.log(`⚠️ Test 2 RESULTADO INESPERADO: Status ${deactivateResponse.statusCode}`);
    }
    
  } catch (error) {
    console.log('❌ Test 2 ERROR:', error.message);
  }
  
  console.log('');
  console.log('=' .repeat(60));
  console.log('🏁 Prueba completada');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testRadioStatusEndpoint().catch(console.error);
}

module.exports = { testRadioStatusEndpoint };