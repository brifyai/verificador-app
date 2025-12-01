// Script para escanear puertos cercanos a 10989
const https = require('https');
const http = require('http');

// Función de verificación usando HEAD
function verifyStreamStatus(streamUrl, timeout = 3000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Determinar protocolo y módulo
    const isHttps = streamUrl.startsWith('https://');
    const client = isHttps ? https : http;
    
    // Parsear URL para extraer hostname, puerto y path
    const url = new URL(streamUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'HEAD',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Icy-MetaData': '1',
        'Connection': 'close'
      }
    };

    const req = client.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'] || '';
      const server = res.headers['server'] || '';
      const icePublic = res.headers['icy-pub'] || '';
      const icyName = res.headers['icy-name'] || '';
      
      // Lógica de verificación
      let status = 'OFFLINE';
      let details = `Status: ${statusCode}, Content-Type: ${contentType}`;
      
      if (statusCode === 200) {
        if (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('mp3')) {
          status = 'ONLINE';
          details += ' (Audio stream confirmed)';
        } else if (icePublic || icyName || server.toLowerCase().includes('icecast') || server.toLowerCase().includes('shoutcast')) {
          status = 'ONLINE';
          details += ' (Streaming server detected)';
        } else {
          status = 'OFFLINE';
          details += ' (No audio content detected)';
        }
      } else if (statusCode === 302 || statusCode === 301) {
        status = 'REDIRECT';
        details += ` (Redirects to: ${res.headers.location})`;
      } else if (statusCode === 404) {
        status = 'OFFLINE';
        details += ' (Not found)';
      } else if (statusCode === 400) {
        status = 'OFFLINE';
        details += ' (Bad request)';
      } else if (statusCode === 401) {
        status = 'OFFLINE';
        details += ' (Unauthorized)';
      } else if (statusCode === 403) {
        status = 'OFFLINE';
        details += ' (Forbidden)';
      }

      resolve({
        status,
        statusCode,
        responseTime,
        contentType,
        server,
        details,
        headers: {
          icePublic,
          icyName
        },
        url: streamUrl
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        status: 'OFFLINE',
        statusCode: 0,
        responseTime,
        contentType: '',
        server: '',
        details: `Error: ${error.message}`,
        url: streamUrl,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        status: 'OFFLINE',
        statusCode: 0,
        responseTime,
        contentType: '',
        server: '',
        details: 'Timeout',
        url: streamUrl
      });
    });

    req.end();
  });
}

// Puertos a probar basados en los que ya vimos que funcionan
const portsToTest = [
  10989, // Original (probablemente incorrecto)
  10977, // VALDIVIA
  10966, // PTO. VARAS
  10965, // ANCUD
  9630,  // ANCUD (sin puerto específico)
  9696,  // ANCUD (HTTP)
  9920,  // CASTRO (¡Este SÍ funciona!)
  9146,  // CHONCHI
  9542,  // DALCAHUE
  // Probar puertos cercanos al 10989
  10988,
  10990,
  10991,
  10992,
  10993,
  10994,
  10995,
  10996,
  10997,
  10998,
  10999,
  11000,
  11001,
  11002,
  11003,
  11004,
  11005
];

async function scanPorts() {
  console.log('🔍 Scanning chiloestreaming ports for LANCO radio...\n');
  console.log('Known working port: 9920 (CASTRO)');
  console.log('Current problematic port: 10989 (LANCO)');
  console.log('Testing nearby ports and known working ports...\n');
  
  let foundOnline = false;
  let onlineUrls = [];
  
  for (const port of portsToTest) {
    const protocols = port === 9630 || port === 9542 ? ['https'] : ['http', 'https'];
    
    for (const protocol of protocols) {
      const baseUrl = `${protocol}://streaming.chiloestreaming.com:${port}`;
      const testUrls = [
        `${baseUrl}/;`,
        `${baseUrl}/;stream.mp3`,
        `${baseUrl}/stream`
      ];
      
      for (const url of testUrls) {
        console.log(`Testing: ${url}`);
        try {
          const result = await verifyStreamStatus(url);
          
          if (result.status === 'ONLINE') {
            console.log(`  🎉 ¡ENCONTRADO! Stream ONLINE`);
            console.log(`  📊 Status Code: ${result.statusCode}`);
            console.log(`  ⏱️  Response Time: ${result.responseTime}ms`);
            console.log(`  🎵 Content-Type: ${result.contentType}`);
            console.log(`  🖥️  Server: ${result.server}`);
            console.log(`  📻 ICE-Name: ${result.headers.icyName || 'N/A'}`);
            foundOnline = true;
            onlineUrls.push({
              url: url,
              port: port,
              protocol: protocol,
              responseTime: result.responseTime,
              iceName: result.headers.icyName
            });
          } else {
            console.log(`  ❌ Status: ${result.status} (${result.statusCode})`);
            if (result.statusCode === 0) {
              console.log(`  🔍 Error: ${result.error}`);
            }
          }
          console.log('  ---');
          
          // Pequeña pausa entre requests para no sobrecargar el servidor
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.log(`  ❌ Test failed: ${error.message}`);
          console.log('  ---');
        }
      }
    }
  }
  
  console.log('\n📊 SCAN RESULTS:');
  if (foundOnline) {
    console.log('🎉 ¡SE ENCONTRARON STREAMS ONLINE! 🎉');
    console.log('URLs funcionales:');
    onlineUrls.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.url}`);
      console.log(`     Puerto: ${item.port}, Protocolo: ${item.protocol.toUpperCase()}`);
      console.log(`     Tiempo de respuesta: ${item.responseTime}ms`);
      console.log(`     Nombre ICE: ${item.iceName || 'N/A'}`);
    });
  } else {
    console.log('❌ No se encontraron streams online en los puertos probados.');
    console.log('💡 Sugerencias:');
    console.log('  - Verificar si el stream está en un puerto muy diferente');
    console.log('  - Contactar al proveedor de chiloestreaming.com');
    console.log('  - Verificar si el stream necesita autenticación especial');
  }
  
  console.log('\n✅ Port scan completed!');
}

// Ejecutar el escaneo
scanPorts().catch(console.error);