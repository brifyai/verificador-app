const https = require('https');
const { URL } = require('url');

async function testQuieroStream() {
  const streamUrl = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log('🎵 Probando stream de FM Quiero de Antofagasta...');
  console.log(`URL: ${streamUrl}`);
  
  try {
    // Test 1: HEAD request
    console.log('\n📡 Test 1: HEAD request');
    await new Promise((resolve) => {
      const url = new URL(streamUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
          'Accept': '*/*',
          'Connection': 'keep-alive'
        }
      };

      const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Headers:', res.headers);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ HEAD request exitoso');
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          console.log('🔄 Redirección detectada');
        } else {
          console.log('❌ HEAD request fallido');
        }
        resolve();
      });

      req.on('error', (err) => {
        console.log('❌ HEAD request error:', err.message);
        resolve();
      });

      req.on('timeout', () => {
        console.log('⏰ HEAD request timeout');
        req.destroy();
        resolve();
      });

      req.end();
    });

    // Test 2: GET request (con rango limitado)
    console.log('\n📡 Test 2: GET request con rango limitado');
    await new Promise((resolve) => {
      const url = new URL(streamUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
          'Accept': '*/*',
          'Range': 'bytes=0-1024',
          'Connection': 'keep-alive'
        }
      };

      const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Headers:', res.headers);
        
        let dataReceived = 0;
        res.on('data', (chunk) => {
          dataReceived += chunk.length;
          if (dataReceived > 1024) {
            console.log('✅ Datos de audio recibidos, stream está ONLINE');
            req.destroy();
            resolve();
          }
        });

        res.on('end', () => {
          console.log(`✅ Stream terminado, ${dataReceived} bytes recibidos`);
          resolve();
        });

        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ GET request exitoso');
        } else {
          console.log('❌ GET request fallido');
          resolve();
        }
      });

      req.on('error', (err) => {
        console.log('❌ GET request error:', err.message);
        resolve();
      });

      req.on('timeout', () => {
        console.log('⏰ GET request timeout');
        req.destroy();
        resolve();
      });

      req.end();
    });

    // Test 3: Verificar tipo de contenido
    console.log('\n📡 Test 3: Verificación de tipo de contenido');
    await new Promise((resolve) => {
      const url = new URL(streamUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
          'Accept': 'audio/mpeg, audio/*, */*',
          'Icy-MetaData': '1',
          'Connection': 'close'
        }
      };

      const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Server:', res.headers['server']);
        console.log('icy-metaint:', res.headers['icy-metaint']);
        
        if (res.headers['content-type'] && res.headers['content-type'].includes('audio')) {
          console.log('✅ Tipo de contenido de audio detectado');
        }
        
        if (res.headers['icy-metaint']) {
          console.log('✅ Stream ICY detectado (con metadatos)');
        }
        
        req.destroy();
        resolve();
      });

      req.on('error', (err) => {
        console.log('❌ Error en verificación de contenido:', err.message);
        resolve();
      });

      req.on('timeout', () => {
        console.log('⏰ Timeout en verificación de contenido');
        req.destroy();
        resolve();
      });

      req.end();
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testQuieroStream();