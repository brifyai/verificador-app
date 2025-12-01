const https = require('https');
const http = require('http');

async function checkUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data.substring(0, 200),
          success: true
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        statusText: err.message,
        error: err.code,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        statusText: 'Timeout',
        error: 'ETIMEDOUT',
        success: false
      });
    });

    req.setTimeout(timeout);
  });
}

async function investigateRadioPilmaiquen() {
  console.log('🔍 Investigando Radio Pilmaiquen...');
  console.log('='.repeat(60));
  
  const baseUrl = 'https://streaming.chiloestreaming.com';
  const originalPort = 10977;
  const testPorts = [10977, 10978, 10979, 10980, 10981, 10982, 10983, 10984, 10985, 10986, 10987, 10988, 10989, 10990, 10991, 10992];
  
  // Primero verificar la URL original
  console.log(`📡 Verificando URL original: ${baseUrl}:${originalPort}/`);
  const originalResult = await checkUrl(`${baseUrl}:${originalPort}/`);
  
  console.log('📊 Resultado original:');
  console.log(`   Status: ${originalResult.status}`);
  console.log(`   Éxito: ${originalResult.success}`);
  if (originalResult.error) {
    console.log(`   Error: ${originalResult.error}`);
  }
  if (originalResult.headers) {
    console.log(`   Content-Type: ${originalResult.headers['content-type']}`);
    console.log(`   Server: ${originalResult.headers['server']}`);
  }
  console.log('');
  
  // Si la original falla, buscar puertos alternativos
  if (!originalResult.success || originalResult.status !== 200) {
    console.log('🔍 Buscando puertos alternativos...');
    console.log('');
    
    let foundWorking = false;
    let workingUrl = '';
    
    for (const port of testPorts) {
      if (port === originalPort) continue; // Saltar el puerto original que ya verificamos
      
      const testUrl = `${baseUrl}:${port}/`;
      console.log(`🔍 Probando: ${testUrl}`);
      
      const result = await checkUrl(testUrl, 5000); // Timeout más corto para pruebas rápidas
      
      if (result.success && result.status === 200) {
        console.log(`   ✅ ¡ENCONTRADO! Puerto ${port} responde con status 200`);
        console.log(`   📋 Content-Type: ${result.headers['content-type']}`);
        console.log(`   🖥️  Server: ${result.headers['server']}`);
        console.log(`   📊 Data preview: ${result.data}`);
        
        foundWorking = true;
        workingUrl = testUrl;
        break;
      } else {
        console.log(`   ❌ Puerto ${port}: ${result.statusText}`);
      }
    }
    
    if (foundWorking) {
      console.log('');
      console.log('🎉 ¡PUERTO FUNCIONAL ENCONTRADO!');
      console.log(`✅ URL correcta: ${workingUrl}`);
      console.log('');
      console.log('📋 Resumen para actualizar la base de datos:');
      console.log(`   UPDATE radios SET stream_url = '${workingUrl}' WHERE name LIKE '%pilmaiquen%';`);
    } else {
      console.log('');
      console.log('❌ No se encontraron puertos alternativos funcionales');
      
      // Probar con diferentes rutas en el puerto original
      console.log('');
      console.log('🔍 Probando rutas alternativas en el puerto original...');
      const routes = ['/', '/stream', '/listen', '/radio', '/live'];
      
      for (const route of routes) {
        const testUrl = `${baseUrl}:${originalPort}${route}`;
        console.log(`🔍 Probando: ${testUrl}`);
        
        const result = await checkUrl(testUrl, 5000);
        
        if (result.success && result.status === 200) {
          console.log(`   ✅ ¡ENCONTRADO! Ruta ${route} responde con status 200`);
          console.log(`   📋 Content-Type: ${result.headers['content-type']}`);
          console.log(`   🖥️  Server: ${result.headers['server']}`);
          
          foundWorking = true;
          workingUrl = testUrl;
          break;
        } else {
          console.log(`   ❌ Ruta ${route}: ${result.statusText}`);
        }
      }
      
      if (foundWorking) {
        console.log('');
        console.log('🎉 ¡RUTA FUNCIONAL ENCONTRADA!');
        console.log(`✅ URL correcta: ${workingUrl}`);
      }
    }
    
  } else {
    console.log('✅ La URL original ya está funcionando correctamente');
    console.log('🎉 No se requieren cambios');
  }
  
  console.log('');
  console.log('='.repeat(60));
}

// Ejecutar la investigación
investigateRadioPilmaiquen();