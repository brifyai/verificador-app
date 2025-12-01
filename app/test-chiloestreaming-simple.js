#!/usr/bin/env node

// Script simple para probar la conexión a streaming.chiloestreaming.com:10989
// usando solo módulos nativos de Node.js

const https = require('https');
const http = require('http');

console.log('🧪 Testeando conexión a streaming.chiloestreaming.com:10989...\n');

function testConnection(url, description) {
  return new Promise((resolve, reject) => {
    console.log(`📡 ${description}`);
    console.log(`   URL: ${url}`);
    
    const isHttps = url.startsWith('https:');
    const module = isHttps ? https : http;
    
    const req = module.request(url, {
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
      }
    }, (res) => {
      console.log(`   📊 Código de estado: ${res.statusCode}`);
      console.log(`   🏷️  Servidor: ${res.headers.server || 'No especificado'}`);
      console.log(`   📄 Tipo de contenido: ${res.headers['content-type'] || 'No especificado'}`);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📏 Tamaño de respuesta: ${body.length} bytes`);
        
        // Análisis del resultado
        if (res.statusCode === 404) {
          console.log('   ⚠️  ANÁLISIS: Servidor funcionando pero recurso no encontrado');
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('   ✅ ANÁLISIS: Conexión exitosa');
        } else if (res.statusCode >= 400 && res.statusCode < 500) {
          console.log('   ❌ ANÁLISIS: Error del cliente (4xx)');
        } else if (res.statusCode >= 500) {
          console.log('   🔥 ANÁLISIS: Error del servidor (5xx)');
        }
        
        console.log(''); // Línea en blanco
        resolve({
          url,
          statusCode: res.statusCode,
          server: res.headers.server,
          contentType: res.headers['content-type'],
          bodySize: body.length,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error de conexión: ${error.message}`);
      console.log(''); // Línea en blanco
      resolve({
        url,
        error: error.message,
        success: false
      });
    });
    
    req.on('timeout', () => {
      console.log('   ⏰ Timeout de conexión');
      req.destroy();
      resolve({
        url,
        error: 'Timeout',
        success: false
      });
    });
    
    req.end();
  });
}

async function runTests() {
  // Probar diferentes variaciones de la URL
  const tests = [
    {
      url: 'https://streaming.chiloestreaming.com:10989/',
      description: 'URL original (HTTPS con /)'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10989',
      description: 'URL sin barra final'
    },
    {
      url: 'http://streaming.chiloestreaming.com:10989/',
      description: 'HTTP en lugar de HTTPS'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10989/stream',
      description: 'Con /stream al final'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10989/;stream.mp3',
      description: 'Con formato SHOUTcast'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testConnection(test.url, test.description);
    results.push(result);
  }
  
  // Resumen final
  console.log('📊 RESUMEN DE PRUEBAS:');
  console.log('='.repeat(50));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const statusCode = result.statusCode ? `(${result.statusCode})` : '';
    const error = result.error ? ` - ${result.error}` : '';
    
    console.log(`${index + 1}. ${status} ${result.url} ${statusCode}${error}`);
  });
  
  // Análisis final
  console.log('\n🔍 ANÁLISIS FINAL:');
  
  const successfulConnections = results.filter(r => r.success && !r.error);
  const failedConnections = results.filter(r => !r.success);
  const serverResponses = results.filter(r => r.statusCode);
  
  if (serverResponses.length > 0) {
    console.log(`   📡 El servidor respondió a ${serverResponses.length} de ${results.length} intentos`);
    
    const sonicPanelResponses = serverResponses.filter(r => 
      r.server && r.server.toLowerCase().includes('sonic')
    );
    
    if (sonicPanelResponses.length > 0) {
      console.log('   🎛️  Se detectó SonicPanel en el servidor');
      console.log('   💡 El servidor está funcionando pero el endpoint específico puede ser incorrecto');
    }
    
    const notFoundResponses = serverResponses.filter(r => r.statusCode === 404);
    if (notFoundResponses.length > 0) {
      console.log('   ⚠️  Se recibieron respuestas 404 (Not Found)');
      console.log('   🔍 Esto sugiere que el servidor está activo pero el recurso no existe');
    }
  }
  
  if (failedConnections.length > 0) {
    console.log(`   ❌ ${failedConnections.length} conexiones fallaron completamente`);
  }
  
  console.log('\n💡 CONCLUSIÓN:');
  if (serverResponses.length > 0 && successfulConnections.length > 0) {
    console.log('   El servidor streaming.chiloestreaming.com:10989 está FUNCIONANDO');
    console.log('   El problema parece ser el endpoint específico, no la conectividad');
  } else if (serverResponses.length > 0) {
    console.log('   El servidor responde pero con errores (posiblemente 404)');
    console.log('   El sistema correctamente lo marca como OFFLINE');
  } else {
    console.log('   El servidor no responde o está verdaderamente offline');
  }
}

// Ejecutar las pruebas
runTests().catch(console.error);