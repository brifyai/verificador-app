const https = require('https');
const http = require('http');

async function checkStream(url, timeout = 10000) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      const chunks = [];
      
      res.on('data', chunk => {
        data += chunk;
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        // Analizar si es un stream de audio válido
        const contentType = res.headers['content-type'];
        const isAudioStream = contentType && (
          contentType.includes('audio') || 
          contentType.includes('mpeg') || 
          contentType.includes('mp3') ||
          contentType.includes('aac')
        );
        
        // Buscar metadatos de SHOUTcast/Icecast
        const icyName = res.headers['icy-name'];
        const icyGenre = res.headers['icy-genre'];
        const icyBr = res.headers['icy-br'];
        const server = res.headers['server'];
        
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          isAudioStream: isAudioStream,
          metadata: {
            name: icyName,
            genre: icyGenre,
            bitrate: icyBr,
            server: server
          },
          dataPreview: data.substring(0, 100),
          success: res.statusCode === 200,
          isStream: isAudioStream || !!(icyName || icyBr || server)
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        statusText: err.message,
        error: err.code,
        success: false,
        isStream: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        statusText: 'Timeout',
        error: 'ETIMEDOUT',
        success: false,
        isStream: false
      });
    });

    req.setTimeout(timeout);
  });
}

async function testRadioPilmaiquen() {
  console.log('🔍 Verificando Radio Pilmaiquen manualmente...');
  console.log('='.repeat(60));
  
  const baseUrl = 'https://streaming.chiloestreaming.com';
  const originalPort = 10977;
  
  // Primero verificar la URL original
  console.log(`📡 Verificando: ${baseUrl}:${originalPort}/`);
  const result = await checkStream(`${baseUrl}:${originalPort}/`, 15000);
  
  console.log('📊 Resultados:');
  console.log(`   ✅ Status: ${result.status}`);
  console.log(`   📋 Status Text: ${result.statusText}`);
  console.log(`   🎯 Success: ${result.success}`);
  console.log(`   🎵 Is Audio Stream: ${result.isAudioStream}`);
  console.log(`   📻 Is Stream: ${result.isStream}`);
  
  if (result.error) {
    console.log(`   ❌ Error: ${result.error}`);
  }
  
  if (result.metadata) {
    console.log('   📡 Metadatos del stream:');
    if (result.metadata.name) console.log(`      🎵 Nombre: ${result.metadata.name}`);
    if (result.metadata.genre) console.log(`      🎭 Género: ${result.metadata.genre}`);
    if (result.metadata.bitrate) console.log(`      📊 Bitrate: ${result.metadata.bitrate} kbps`);
    if (result.metadata.server) console.log(`      🖥️  Server: ${result.metadata.server}`);
  }
  
  if (result.headers) {
    console.log('   📋 Headers:');
    console.log(`      Content-Type: ${result.headers['content-type']}`);
    console.log(`      Server: ${result.headers['server']}`);
  }
  
  console.log('');
  
  // Si no funciona, probar puertos cercanos
  if (!result.success || !result.isStream) {
    console.log('🔍 La URL original no parece ser un stream válido');
    console.log('🔍 Probando puertos cercanos...');
    console.log('');
    
    const testPorts = [10976, 10978, 10979, 10980, 10981, 10982, 10983, 10984, 10985];
    
    for (const port of testPorts) {
      const testUrl = `${baseUrl}:${port}/`;
      console.log(`🔍 Probando: ${testUrl}`);
      
      const portResult = await checkStream(testUrl, 8000); // Timeout más corto
      
      if (portResult.success && portResult.isStream) {
        console.log(`   ✅ ¡ENCONTRADO! Puerto ${port} tiene un stream válido`);
        
        if (portResult.metadata.name) {
          console.log(`   🎵 Nombre: ${portResult.metadata.name}`);
        }
        if (portResult.metadata.bitrate) {
          console.log(`   📊 Bitrate: ${portResult.metadata.bitrate} kbps`);
        }
        console.log(`   🖥️  Server: ${portResult.metadata.server || 'Desconocido'}`);
        
        console.log('');
        console.log('🎉 URL CORRECTA ENCONTRADA:');
        console.log(`✅ ${testUrl}`);
        console.log('');
        console.log('📋 Resumen para actualizar la base de datos:');
        console.log(`   UPDATE radios SET stream_url = '${testUrl}' WHERE name LIKE '%pilmaiquen%';`);
        
        return;
      } else {
        console.log(`   ❌ Puerto ${port}: ${portResult.statusText}`);
      }
    }
    
    console.log('');
    console.log('❌ No se encontraron puertos alternativos funcionales');
    
    // Probar con rutas alternativas
    console.log('');
    console.log('🔍 Probando rutas alternativas en el puerto original...');
    const routes = ['/', '/stream', '/listen', '/radio', '/live', '/;stream.mp3'];
    
    for (const route of routes) {
      const testUrl = `${baseUrl}:${originalPort}${route}`;
      console.log(`🔍 Probando: ${testUrl}`);
      
      const routeResult = await checkStream(testUrl, 8000);
      
      if (routeResult.success && routeResult.isStream) {
        console.log(`   ✅ ¡ENCONTRADO! Ruta ${route} tiene un stream válido`);
        
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
        console.log('📋 Resumen para actualizar la base de datos:');
        console.log(`   UPDATE radios SET stream_url = '${testUrl}' WHERE name LIKE '%pilmaiquen%';`);
        
        return;
      } else {
        console.log(`   ❌ Ruta ${route}: ${routeResult.statusText}`);
      }
    }
    
  } else {
    console.log('✅ La URL original ya es un stream válido');
    console.log('🎉 No se requieren cambios');
  }
  
  console.log('');
  console.log('='.repeat(60));
}

// Ejecutar la verificación
testRadioPilmaiquen();