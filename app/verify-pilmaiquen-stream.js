const https = require('https');
const http = require('http');

async function checkStream(url, timeout = 15000) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    
    console.log(`🔍 Verificando: ${url}`);
    
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      const chunks = [];
      
      res.on('data', chunk => {
        data += chunk;
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        // Analizar headers para identificar el tipo de stream
        const contentType = res.headers['content-type'];
        const server = res.headers['server'];
        const icyName = res.headers['icy-name'];
        const icyGenre = res.headers['icy-genre'];
        const icyBr = res.headers['icy-br'];
        const icyUrl = res.headers['icy-url'];
        
        const isAudioStream = contentType && (
          contentType.includes('audio') || 
          contentType.includes('mpeg') || 
          contentType.includes('mp3') ||
          contentType.includes('aac') ||
          contentType.includes('application/octet-stream')
        );
        
        const isShoutcast = !!(icyName || icyBr || res.headers['icy-metaint']);
        const isIcecast = server && server.toLowerCase().includes('icecast');
        
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          isAudioStream: isAudioStream,
          isShoutcast: isShoutcast,
          isIcecast: isIcecast,
          metadata: {
            name: icyName,
            genre: icyGenre,
            bitrate: icyBr,
            server: server,
            icyUrl: icyUrl,
            contentType: contentType
          },
          dataPreview: data.substring(0, 200),
          success: res.statusCode === 200,
          isValidStream: res.statusCode === 200 && (isAudioStream || isShoutcast || isIcecast)
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        statusText: err.message,
        error: err.code,
        success: false,
        isValidStream: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        statusText: 'Timeout',
        error: 'ETIMEDOUT',
        success: false,
        isValidStream: false
      });
    });

    req.setTimeout(timeout);
  });
}

async function verifyPilmaiquenStream() {
  console.log('🔍 Verificando Radio Pilmaiquen - Análisis completo');
  console.log('='.repeat(60));
  
  const baseUrl = 'https://streaming.chiloestreaming.com';
  const originalPort = 10977;
  
  console.log(`📡 Verificando URL original: ${baseUrl}:${originalPort}/`);
  console.log('');
  
  const originalResult = await checkStream(`${baseUrl}:${originalPort}/`);
  
  console.log('📊 Resultado de la verificación:');
  console.log(`   ✅ Status: ${originalResult.status}`);
  console.log(`   📋 Status Text: ${originalResult.statusText}`);
  console.log(`   🎯 Success: ${originalResult.success}`);
  console.log(`   🎵 Is Audio Stream: ${originalResult.isAudioStream}`);
  console.log(`   📻 Is SHOUTcast: ${originalResult.isShoutcast}`);
  console.log(`   ❄️  Is Icecast: ${originalResult.isIcecast}`);
  console.log(`   🎊 Is Valid Stream: ${originalResult.isValidStream}`);
  
  if (originalResult.error) {
    console.log(`   ❌ Error: ${originalResult.error}`);
  }
  
  if (originalResult.metadata) {
    console.log('   📡 Metadatos:');
    if (originalResult.metadata.name) console.log(`      🎵 Nombre: ${originalResult.metadata.name}`);
    if (originalResult.metadata.genre) console.log(`      🎭 Género: ${originalResult.metadata.genre}`);
    if (originalResult.metadata.bitrate) console.log(`      📊 Bitrate: ${originalResult.metadata.bitrate} kbps`);
    if (originalResult.metadata.server) console.log(`      🖥️  Server: ${originalResult.metadata.server}`);
    if (originalResult.metadata.contentType) console.log(`      📄 Content-Type: ${originalResult.metadata.contentType}`);
  }
  
  console.log('');
  
  // Si no es un stream válido, buscar alternativas
  if (!originalResult.isValidStream) {
    console.log('🔍 La URL original no es un stream válido');
    console.log('🔍 Buscando puertos alternativos...');
    console.log('');
    
    // Puertos a probar basados en patrones de chiloestreaming
    const testPorts = [
      10976, 10978, 10979, 10980, 10981, 10982, 10983, 10984, 10985,
      10986, 10987, 10988, 10989, 10990, 10991, 10992, 10993, 10994, 10995
    ];
    
    let foundStream = false;
    
    for (const port of testPorts) {
      if (port === originalPort) continue;
      
      const testUrl = `${baseUrl}:${port}/`;
      console.log(`🔍 Probando puerto ${port}...`);
      
      const portResult = await checkStream(testUrl, 8000);
      
      if (portResult.isValidStream) {
        console.log(`   ✅ ¡STREAM VÁLIDO ENCONTRADO!`);
        console.log(`   🎵 Puerto: ${port}`);
        
        if (portResult.metadata.name) {
          console.log(`   📻 Nombre: ${portResult.metadata.name}`);
        }
        if (portResult.metadata.bitrate) {
          console.log(`   📊 Bitrate: ${portResult.metadata.bitrate} kbps`);
        }
        if (portResult.metadata.server) {
          console.log(`   🖥️  Server: ${portResult.metadata.server}`);
        }
        
        console.log('');
        console.log('🎉 URL CORRECTA ENCONTRADA:');
        console.log(`✅ ${testUrl}`);
        console.log('');
        console.log('📋 Para actualizar la base de datos:');
        console.log(`   UPDATE radios SET stream_url = '${testUrl}' WHERE stream_url LIKE '%10977%';`);
        
        foundStream = true;
        break;
      } else {
        console.log(`   ❌ Puerto ${port}: ${portResult.statusText}`);
        if (portResult.metadata.server) {
          console.log(`      Server: ${portResult.metadata.server}`);
        }
      }
    }
    
    if (!foundStream) {
      console.log('');
      console.log('❌ No se encontraron streams válidos en puertos alternativos');
      
      // Probar rutas alternativas en el puerto original
      console.log('');
      console.log('🔍 Probando rutas alternativas...');
      
      const routes = ['/', '/stream', '/listen', '/radio', '/live', '/;stream.mp3', '/stream.mp3'];
      
      for (const route of routes) {
        const testUrl = `${baseUrl}:${originalPort}${route}`;
        console.log(`🔍 Probando ruta: ${route}`);
        
        const routeResult = await checkStream(testUrl, 8000);
        
        if (routeResult.isValidStream) {
          console.log(`   ✅ ¡STREAM VÁLIDO ENCONTRADO!`);
          console.log(`   📻 Ruta: ${route}`);
          
          if (routeResult.metadata.name) {
            console.log(`   🎵 Nombre: ${routeResult.metadata.name}`);
          }
          if (routeResult.metadata.bitrate) {
            console.log(`   📊 Bitrate: ${routeResult.metadata.bitrate} kbps`);
          }
          
          console.log('');
          console.log('🎉 URL CORRECTA ENCONTRADA:');
          console.log(`✅ ${testUrl}`);
          console.log('');
          console.log('📋 Para actualizar la base de datos:');
          console.log(`   UPDATE radios SET stream_url = '${testUrl}' WHERE stream_url LIKE '%10977%';`);
          
          foundStream = true;
          break;
        } else {
          console.log(`   ❌ Ruta ${route}: ${routeResult.statusText}`);
        }
      }
    }
    
    if (!foundStream) {
      console.log('');
      console.log('❌ No se encontraron streams válidos');
      console.log('📋 La URL actual de Radio Pilmaiquen parece estar realmente offline');
      console.log('💡 Sugerencia: Verificar con el administrador de la emisora');
    }
    
  } else {
    console.log('✅ La URL original ya es un stream válido');
    console.log('🎉 Radio Pilmaiquen está ONLINE');
    
    if (originalResult.metadata.name) {
      console.log(`📻 Nombre del stream: ${originalResult.metadata.name}`);
    }
    if (originalResult.metadata.bitrate) {
      console.log(`📊 Bitrate: ${originalResult.metadata.bitrate} kbps`);
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
}

// Ejecutar la verificación
verifyPilmaiquenStream();