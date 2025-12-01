// Script para probar la URL actual de chiloestreaming desde la base de datos
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

// URLs a probar basadas en la URL actual de la base de datos
const currentUrl = 'https://streaming.chiloestreaming.com:10989/;';
const testUrls = [
  currentUrl, // URL actual de la BD
  'https://streaming.chiloestreaming.com:10989/;stream.mp3',
  'https://streaming.chiloestreaming.com:10989/stream',
  'https://streaming.chiloestreaming.com:10989/',
  'http://streaming.chiloestreaming.com:10989/;stream.mp3',
  'http://streaming.chiloestreaming.com:10989/stream',
  'http://streaming.chiloestreaming.com:10989/;'
];

async function runTests() {
  console.log('🔍 Testing current chiloestreaming URL from database...\n');
  console.log(`Current URL in DB: ${currentUrl}\n`);
  
  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    try {
      const result = await verifyStreamStatus(url);
      console.log(`  ✅ Status: ${result.status}`);
      console.log(`  📊 Status Code: ${result.statusCode}`);
      console.log(`  ⏱️  Response Time: ${result.responseTime}ms`);
      console.log(`  🎵 Content-Type: ${result.contentType}`);
      console.log(`  🖥️  Server: ${result.server}`);
      console.log(`  📝 Details: ${result.details}`);
      
      if (result.headers.icePublic) console.log(`  📻 ICE-Public: ${result.headers.icePublic}`);
      if (result.headers.icyName) console.log(`  📻 ICE-Name: ${result.headers.icyName}`);
      
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      }
      
      // Si encontramos un stream online, destacarlo
      if (result.status === 'ONLINE') {
        console.log(`  🎉 ¡STREAM ONLINE ENCONTRADO! 🎉`);
      }
      
      console.log('  ---');
    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      console.log('  ---');
    }
  }
  
  console.log('\n✅ Database URL test completed!');
}

// Ejecutar los tests
runTests().catch(console.error);