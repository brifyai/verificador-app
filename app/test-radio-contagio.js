const https = require('https');
const http = require('http');

// Configuración para manejar certificados SSL
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT
});

async function testRadioContagio() {
  console.log('🎵 Verificando Radio Contagio - sonic.streamingchilenos.com:7113');
  console.log('=' .repeat(60));
  
  const url = 'https://sonic.streamingchilenos.com:7113/';
  const testUrls = [
    'https://sonic.streamingchilenos.com:7113/',
    'https://sonic.streamingchilenos.com:7113/stream',
    'https://sonic.streamingchilenos.com:7113/;stream.mp3',
    'http://sonic.streamingchilenos.com:7113/',
    'http://sonic.streamingchilenos.com:7113/stream',
    'http://sonic.streamingchilenos.com:7113/;stream.mp3'
  ];

  for (const testUrl of testUrls) {
    console.log(`\n📡 Probando: ${testUrl}`);
    
    try {
      // Primero intentar con fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`✅ Estado HTTP: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        console.log('🎶 ¡Stream encontrado!');
        
        // Obtener headers
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });
        
        console.log('📋 Headers:');
        for (const [key, value] of Object.entries(headers)) {
          console.log(`  ${key}: ${value}`);
        }
        
        // Verificar tipo de contenido
        const contentType = headers['content-type'] || headers['icy-br'];
        if (contentType) {
          console.log(`🎵 Tipo de contenido: ${contentType}`);
        }
        
        // Verificar metadata SHOUTcast/ICE
        const icyName = headers['icy-name'];
        const icyGenre = headers['icy-genre'];
        const icyBr = headers['icy-br'];
        
        if (icyName) console.log(`📻 Nombre: ${icyName}`);
        if (icyGenre) console.log(`🎼 Género: ${icyGenre}`);
        if (icyBr) console.log(`⚡ Bitrate: ${icyBr} kbps`);
        
        return {
          status: 'online',
          url: testUrl,
          httpStatus: response.status,
          headers: headers
        };
      }
      
    } catch (fetchError) {
      console.log(`❌ Error con fetch: ${fetchError.message}`);
      
      // Intentar con HTTPS module como fallback
      try {
        const result = await testWithHttps(testUrl);
        if (result && result.status === 'online') {
          return result;
        }
      } catch (httpsError) {
        console.log(`❌ Error con HTTPS: ${httpsError.message}`);
      }
    }
  }
  
  return { status: 'offline', url: url };
}

function testWithHttps(testUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(testUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'HEAD',
      timeout: 10000,
      agent: url.protocol === 'https:' ? httpsAgent : undefined
    };

    const req = protocol.request(options, (res) => {
      console.log(`✅ Estado HTTPS: ${res.statusCode} ${res.statusMessage}`);
      
      if (res.statusCode === 200) {
        console.log('🎶 ¡Stream encontrado con HTTPS module!');
        
        console.log('📋 Headers:');
        for (const [key, value] of Object.entries(res.headers)) {
          console.log(`  ${key}: ${value}`);
        }
        
        resolve({
          status: 'online',
          url: testUrl,
          httpStatus: res.statusCode,
          headers: res.headers
        });
      } else {
        resolve({
          status: 'error',
          url: testUrl,
          httpStatus: res.statusCode,
          headers: res.headers
        });
      }
    });

    req.on('error', (error) => {
      console.log(`❌ Error HTTPS request: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('⏱️ Timeout de conexión');
      req.destroy();
      reject(new Error('Timeout de conexión'));
    });

    req.end();
  });
}

// Ejecutar prueba
testRadioContagio()
  .then(result => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO FINAL:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'online') {
      console.log('\n🎉 ¡RADIO CONTAGIO ESTÁ ONLINE! 🎉');
    } else {
      console.log('\n❌ Radio Contagio aparece como offline');
    }
  })
  .catch(error => {
    console.error('❌ Error general:', error);
  });