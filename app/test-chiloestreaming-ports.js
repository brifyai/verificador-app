#!/usr/bin/env node

// Script para probar diferentes puertos de chiloestreaming.com
// para encontrar el patrón correcto de endpoints

const https = require('https');
const http = require('http');

console.log('🧪 Testeando diferentes puertos de chiloestreaming.com...\n');

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
          // Mostrar primeros 100 caracteres del body si es success
          if (body.length > 0) {
            console.log(`   📝 Preview: ${body.substring(0, 100)}...`);
          }
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
          bodyPreview: body.substring(0, 200),
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
  // Probar diferentes puertos de chiloestreaming.com basados en la base de datos
  const tests = [
    // Puertos HTTPS de la base de datos
    {
      url: 'https://streaming.chiloestreaming.com:10989/',
      description: 'Puerto 10989 - LANCO (original)',
      city: 'LANCO'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10977/',
      description: 'Puerto 10977 - VALDIVIA',
      city: 'VALDIVIA'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10966/',
      description: 'Puerto 10966 - PTO. VARAS',
      city: 'PTO. VARAS'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10965/',
      description: 'Puerto 10965 - ANCUD',
      city: 'ANCUD'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10997/',
      description: 'Puerto 10997 - Ejemplo del mock',
      city: 'Desconocido'
    },
    // Puertos HTTP de la base de datos
    {
      url: 'http://streaming.chiloestreaming.com:9696/',
      description: 'Puerto 9696 - ANCUD (HTTP)',
      city: 'ANCUD'
    },
    {
      url: 'http://streaming.chiloestreaming.com:9920/',
      description: 'Puerto 9920 - CASTRO (HTTP)',
      city: 'CASTRO'
    },
    {
      url: 'http://streaming.chiloestreaming.com:9146/',
      description: 'Puerto 9146 - CHONCHI (HTTP)',
      city: 'CHONCHI'
    },
    // Probar variaciones de endpoints comunes
    {
      url: 'https://streaming.chiloestreaming.com:10989/stream',
      description: 'Puerto 10989 con /stream',
      city: 'LANCO'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10989/;stream.mp3',
      description: 'Puerto 10989 con formato SHOUTcast',
      city: 'LANCO'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10989/listen',
      description: 'Puerto 10989 con /listen',
      city: 'LANCO'
    },
    {
      url: 'https://streaming.chiloestreaming.com:10989/radio',
      description: 'Puerto 10989 con /radio',
      city: 'LANCO'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testConnection(test.url, test.description);
    results.push({...result, city: test.city});
  }
  
  // Resumen final
  console.log('📊 RESUMEN DE PRUEBAS POR PUERTO:');
  console.log('='.repeat(60));
  
  // Agrupar por ciudad
  const byCity = {};
  results.forEach(result => {
    if (!byCity[result.city]) {
      byCity[result.city] = [];
    }
    byCity[result.city].push(result);
  });
  
  Object.entries(byCity).forEach(([city, cityResults]) => {
    console.log(`\n🏙️  ${city}:`);
    cityResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const statusCode = result.statusCode ? `(${result.statusCode})` : '';
      const error = result.error ? ` - ${result.error}` : '';
      
      console.log(`   ${index + 1}. ${status} ${result.url.split('/').pop() || '/'} ${statusCode}${error}`);
      
      if (result.success && result.contentType) {
        console.log(`      🎵 Content-Type: ${result.contentType}`);
      }
    });
  });
  
  // Encontrar patrones exitosos
  console.log('\n🔍 ANÁLISIS DE PATRONES EXITOSOS:');
  const successful = results.filter(r => r.success && r.statusCode >= 200 && r.statusCode < 300);
  
  if (successful.length > 0) {
    console.log(`✅ Se encontraron ${successful.length} conexiones exitosas:`);
    successful.forEach(result => {
      console.log(`   🎵 ${result.url} - Status: ${result.statusCode}`);
      if (result.contentType) {
        console.log(`      📄 Content-Type: ${result.contentType}`);
      }
      if (result.bodyPreview) {
        console.log(`      📝 Preview: ${result.bodyPreview.substring(0, 50)}...`);
      }
    });
  } else {
    console.log('❌ No se encontraron conexiones exitosas');
  }
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  if (successful.length > 0) {
    const firstSuccess = successful[0];
    console.log(`   La URL que debería usar es: ${firstSuccess.url}`);
    if (firstSuccess.contentType && firstSuccess.contentType.includes('audio')) {
      console.log('   ✅ Esta URL parece ser un stream de audio válido');
    }
  } else {
    console.log('   🔍 Considere probar otros endpoints como:');
    console.log('      - /listen');
    console.log('      - /radio');
    console.log('      - /stream.mp3');
    console.log('      - /;stream.mp3');
    console.log('      - Sin el ";" al final');
  }
}

// Ejecutar las pruebas
runTests().catch(console.error);