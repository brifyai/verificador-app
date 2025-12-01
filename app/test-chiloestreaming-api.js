#!/usr/bin/env node

// Script para probar la verificación de streaming.chiloestreaming.com:10989
// usando el endpoint API directo del proyecto

const https = require('https');
const http = require('http');

// Función para hacer petición al endpoint de verificación
async function testChiloeStreamingViaAPI() {
  console.log('🧪 Testeando streaming.chiloestreaming.com:10989 vía API del sistema...\n');
  
  // Primero necesitamos un token válido
  const loginUrl = 'http://localhost:3000/api/auth/login';
  const loginData = JSON.stringify({
    email: 'admin@verificador.com',
    password: 'admin123'
  });

  console.log('🔐 Obteniendo token de autenticación...');
  
  return new Promise((resolve, reject) => {
    const loginReq = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, (loginRes) => {
      let loginBody = '';
      
      loginRes.on('data', (chunk) => {
        loginBody += chunk;
      });
      
      loginRes.on('end', () => {
        try {
          const loginResponse = JSON.parse(loginBody);
          
          if (loginResponse.success) {
            const token = loginResponse.token;
            console.log('✅ Token obtenido exitosamente\n');
            
            // Ahora probar la verificación directa
            testDirectVerification(token, resolve, reject);
          } else {
            console.error('❌ Error en login:', loginResponse.error);
            reject(new Error('No se pudo autenticar'));
          }
        } catch (error) {
          console.error('❌ Error parseando respuesta de login:', error);
          reject(error);
        }
      });
    });
    
    loginReq.on('error', (error) => {
      console.error('❌ Error en petición de login:', error);
      reject(error);
    });
    
    loginReq.write(loginData);
    loginReq.end();
  });
}

function testDirectVerification(token, resolve, reject) {
  const testUrl = 'https://streaming.chiloestreaming.com:10989/';
  
  console.log(`📡 Verificando URL: ${testUrl}`);
  console.log('⏳ Realizando verificación directa...\n');
  
  // Hacer una petición simple al endpoint de radios para verificar una radio específica
  // Usaremos el endpoint que ya vimos en los logs
  const radioId = 'radio_mijm9z66_yr0h4uo'; // Este es el ID que vimos en los logs para esta URL
  
  const verifyReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/radios/${radioId}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, (verifyRes) => {
    let verifyBody = '';
    
    verifyRes.on('data', (chunk) => {
      verifyBody += chunk;
    });
    
    verifyRes.on('end', () => {
      try {
        console.log(`📊 Código de respuesta: ${verifyRes.statusCode}`);
        console.log(`📄 Respuesta: ${verifyBody}\n`);
        
        // Ahora probemos con una verificación manual usando el mismo método que el sistema
        testManualVerification();
        
        resolve();
      } catch (error) {
        console.error('❌ Error en verificación:', error);
        reject(error);
      }
    });
  });
  
  verifyReq.on('error', (error) => {
    console.error('❌ Error en petición de verificación:', error);
    reject(error);
  });
  
  verifyReq.write(JSON.stringify({
    // Datos que podrían actualizar el estado
  }));
  verifyReq.end();
}

function testManualVerification() {
  console.log('🔍 Verificación manual con módulos nativos de Node.js:\n');
  
  const testUrl = 'https://streaming.chiloestreaming.com:10989/';
  
  console.log(`📡 Probar URL: ${testUrl}`);
  
  // Test con HTTPS nativo
  const req = https.request(testUrl, {
    method: 'GET',
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
    }
  }, (res) => {
    console.log(`📊 Código de estado: ${res.statusCode}`);
    console.log(`🏷️  Servidor: ${res.headers.server}`);
    console.log(`📄 Tipo de contenido: ${res.headers['content-type']}`);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log(`📏 Tamaño de respuesta: ${body.length} bytes`);
      
      if (res.statusCode === 404) {
        console.log('\n⚠️  ANÁLISIS:');
        console.log('   - El servidor está FUNCIONANDO (responde 404)');
        console.log('   - SonicPanel está activo y respondiendo');
        console.log('   - El recurso solicitado no existe en este path');
        console.log('   - Esto explica por qué el sistema lo marca como OFFLINE');
        console.log('\n💡 CONCLUSIÓN:');
        console.log('   El servidor está ONLINE pero el endpoint específico no existe.');
        console.log('   El sistema correctamente lo marca como OFFLINE porque 404 = contenido no encontrado.');
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('\n✅ El stream está respondiendo correctamente');
      } else {
        console.log(`\n❌ Estado no esperado: ${res.statusCode}`);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
  });
  
  req.on('timeout', () => {
    console.error('⏰ Timeout de conexión');
    req.destroy();
  });
  
  req.end();
}

// Ejecutar el test
testChiloeStreamingViaAPI().catch(console.error);