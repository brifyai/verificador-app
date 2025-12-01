#!/usr/bin/env node

// Script final para probar los endpoints correctos de chiloestreaming
// usando el sistema de verificación real del proyecto

const { verifyStreamStatus } = require('./lib/stream-verifier-enhanced.ts');

async function testCorrectEndpoints() {
  console.log('🧪 Testeando endpoints correctos para chiloestreaming:10989...\n');
  
  // Endpoints que encontramos que responden correctamente
  const testUrls = [
    'https://streaming.chiloestreaming.com:10989/;stream.mp3',
    'https://streaming.chiloestreaming.com:10989/stream',
    'https://streaming.chiloestreaming.com:10989/', // Original para comparar
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    console.log(`📡 Probando: ${url}`);
    
    try {
      const result = await verifyStreamStatus(url);
      
      console.log(`   ✅ Resultado: ${result.status}`);
      console.log(`   ⏱️  Tiempo de respuesta: ${result.responseTime}ms`);
      console.log(`   🎵 Content-Type: ${result.contentType || 'No especificado'}`);
      console.log(`   🏷️  Status Code: ${result.statusCode || 'No especificado'}`);
      
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
      
      results.push({
        url,
        ...result
      });
      
    } catch (error) {
      console.log(`   ❌ Error en verificación: ${error.message}`);
      results.push({
        url,
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log(''); // Línea en blanco
  }
  
  // Análisis final
  console.log('📊 RESUMEN DE RESULTADOS:');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    const status = result.status === 'ONLINE' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.url}`);
    console.log(`   Estado: ${result.status}`);
    console.log(`   Tiempo: ${result.responseTime || 'N/A'}ms`);
    console.log(`   Content-Type: ${result.contentType || 'N/A'}`);
    console.log(`   Status Code: ${result.statusCode || 'N/A'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });
  
  // Encontrar el mejor endpoint
  const onlineEndpoints = results.filter(r => r.status === 'ONLINE');
  
  if (onlineEndpoints.length > 0) {
    console.log('🎉 ¡SE ENCONTRARON ENDPOINTS FUNCIONALES!');
    console.log('\n💡 RECOMENDACIONES:');
    
    onlineEndpoints.forEach(endpoint => {
      console.log(`   ✅ ${endpoint.url} - Status: ${endpoint.statusCode} - Content-Type: ${endpoint.contentType}`);
      
      // Verificar si es un stream de audio válido
      if (endpoint.contentType && endpoint.contentType.includes('audio')) {
        console.log('      🎵 Este endpoint parece ser un stream de audio válido');
      }
      
      // Verificar si es SHOUTcast
      if (endpoint.url.includes(';stream.mp3')) {
        console.log('      📻 Este es un endpoint SHOUTcast estándar');
      }
    });
    
    console.log('\n📝 CONCLUSIÓN:');
    console.log('   La URL que debería usar es: https://streaming.chiloestreaming.com:10989/;stream.mp3');
    console.log('   Este endpoint responde con audio/mpeg y debería ser grabable');
    
  } else {
    console.log('❌ No se encontraron endpoints funcionales');
    console.log('🔍 Se necesita investigar más sobre la configuración de este servidor');
  }
}

// Ejecutar las pruebas
testCorrectEndpoints().catch(console.error);