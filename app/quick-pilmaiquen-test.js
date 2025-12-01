const https = require('https');
const http = require('http');

async function quickCheckStream(url, timeout = 5000) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    
    console.log(`🔍 Probando: ${url}`);
    
    const req = client.get(url, { timeout }, (res) => {
      // Solo verificar si es un stream válido rápidamente
      const contentType = res.headers['content-type'];
      const icyName = res.headers['icy-name'];
      const server = res.headers['server'];
      
      const isAudioStream = contentType && (
        contentType.includes('audio') || 
        contentType.includes('mpeg') || 
        contentType.includes('mp3') ||
        contentType.includes('aac') ||
        contentType.includes('application/octet-stream')
      );
      
      const isShoutcast = !!(icyName || res.headers['icy-br'] || res.headers['icy-metaint']);
      const isIcecast = server && server.toLowerCase().includes('icecast');
      
      const isValidStream = res.statusCode === 200 && (isAudioStream || isShoutcast || isIcecast);
      
      if (isValidStream) {
        console.log(`   ✅ ¡STREAM VÁLIDO!`);
        console.log(`   🎵 Nombre: ${icyName || 'Sin nombre'}`);
        console.log(`   📊 Bitrate: ${res.headers['icy-br'] || 'Desconocido'}`);
        console.log(`   🖥️  Server: ${server || 'Desconocido'}`);
        console.log(`   📄 Content-Type: ${contentType || 'Desconocido'}`);
        resolve({ success: true, url, metadata: { name: icyName, bitrate: res.headers['icy-br'], server, contentType } });
      } else {
        console.log(`   ❌ No es stream válido (${res.statusCode}: ${res.statusMessage})`);
        resolve({ success: false, url, status: res.statusCode, statusText: res.statusMessage });
      }
      
      // Destruir la conexión para no esperar más datos
      req.destroy();
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.code}`);
      resolve({ success: false, url, error: err.code });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`   ⏱️  Timeout`);
      resolve({ success: false, url, error: 'ETIMEDOUT' });
    });

    req.setTimeout(timeout);
  });
}

async function quickTestPilmaiquen() {
  console.log('🚀 Búsqueda rápida de Radio Pilmaiquen');
  console.log('='.repeat(50));
  
  const baseUrl = 'https://streaming.chiloestreaming.com';
  const originalPort = 10977;
  
  // Primero verificar la URL original
  console.log(`📡 Verificando URL original: ${baseUrl}:${originalPort}/`);
  const originalResult = await quickCheckStream(`${baseUrl}:${originalPort}/`);
  
  if (originalResult.success) {
    console.log('');
    console.log('🎉 ¡URL ORIGINAL FUNCIONA!');
    console.log(`✅ ${originalResult.url}`);
    console.log('📋 La URL de Radio Pilmaiquen ya está correcta');
    return;
  }
  
  console.log('');
  console.log('🔍 Buscando puertos alternativos (más probables)...');
  console.log('');
  
  // Puertos más probables basados en patrones anteriores
  const testPorts = [
    10976, 10978, 10979, 10980, 10981, 10982, 10983, 10984, 10985,
    10986, 10987, 10988, 10989, 10990, 10991, 10992, 10993, 10994, 10995
  ];
  
  let foundStream = false;
  
  for (const port of testPorts) {
    if (port === originalPort) continue;
    
    const testUrl = `${baseUrl}:${port}/`;
    const result = await quickCheckStream(testUrl);
    
    if (result.success) {
      foundStream = true;
      console.log('');
      console.log('🎉 ¡STREAM VÁLIDO ENCONTRADO!');
      console.log(`✅ URL correcta: ${result.url}`);
      console.log('');
      console.log('📋 Para actualizar la base de datos:');
      console.log(`   UPDATE radios SET stream_url = '${result.url}' WHERE name LIKE '%Pilmaiquen%';`);
      console.log('');
      console.log('💡 Si no encuentras la radio en la base de datos, busca por el ID o por la URL antigua');
      break;
    }
  }
  
  if (!foundStream) {
    console.log('');
    console.log('🔍 Probando rutas alternativas en el puerto original...');
    console.log('');
    
    const routes = ['/', '/stream', '/listen', '/radio', '/live', '/;stream.mp3', '/stream.mp3'];
    
    for (const route of routes) {
      const testUrl = `${baseUrl}:${originalPort}${route}`;
      const result = await quickCheckStream(testUrl);
      
      if (result.success) {
        foundStream = true;
        console.log('');
        console.log('🎉 ¡STREAM VÁLIDO ENCONTRADO!');
        console.log(`✅ URL correcta: ${result.url}`);
        console.log('');
        console.log('📋 Para actualizar la base de datos:');
        console.log(`   UPDATE radios SET stream_url = '${result.url}' WHERE name LIKE '%Pilmaiquen%';`);
        break;
      }
    }
  }
  
  if (!foundStream) {
    console.log('');
    console.log('❌ No se encontraron streams válidos');
    console.log('📋 La URL actual de Radio Pilmaiquen parece estar realmente offline');
    console.log('💡 Sugerencias:');
    console.log('   1. Verificar con el administrador de la emisora');
    console.log('   2. Buscar la radio en la página web oficial');
    console.log('   3. Contactar a chiloestreaming.com para confirmar el estado del servicio');
  }
  
  console.log('');
  console.log('='.repeat(50));
}

// Ejecutar la búsqueda rápida
quickTestPilmaiquen();