// Script para probar las URLs activas de chiloestreaming
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

// URLs activas de chiloestreaming de la base de datos
const activeChiloeUrls = [
  { url: 'https://streaming.chiloestreaming.com:10989/;', city: 'LANCO', status: 'active' },
  { url: 'https://streaming.chiloestreaming.com:10977/;', city: 'VALDIVIA', status: 'active' },
  { url: 'https://streaming.chiloestreaming.com:10966/;', city: 'PTO. VARAS', status: 'active' },
  { url: 'https://streaming.chiloestreaming.com:10965/;', city: 'ANCUD', status: 'active' },
  { url: 'https://streaming.chiloestreaming.com/9630/;', city: 'ANCUD', status: 'active' },
  { url: 'http://streaming.chiloestreaming.com:9696/;', city: 'ANCUD', status: 'active' },
  { url: 'http://streaming.chiloestreaming.com:9920/;', city: 'CASTRO', status: 'active' },
  { url: 'https://streaming.chiloestreaming.com/9542/;', city: 'DALCAHUE', status: 'active' },
  { url: 'http://streaming.chiloestreaming.com:9146/;', city: 'CHONCHI', status: 'active' }
];

// También probar algunas variaciones comunes de endpoints
const endpointVariations = [
  '/;stream.mp3',
  '/stream',
  '/;',
  '/',
  ';stream.mp3',
  'stream'
];

async function testActiveUrls() {
  console.log('🔍 Testing ACTIVE chiloestreaming URLs from database...\n');
  
  let onlineCount = 0;
  let totalCount = 0;
  
  for (const radio of activeChiloeUrls) {
    console.log(`📻 ${radio.city} - ${radio.url}`);
    
    try {
      const result = await verifyStreamStatus(radio.url);
      totalCount++;
      
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
      
      if (result.status === 'ONLINE') {
        console.log(`  🎉 ¡STREAM ONLINE! 🎉`);
        onlineCount++;
      } else if (result.status === 'REDIRECT') {
        console.log(`  🔄 Redirect detected - might be online`);
      }
      
      console.log('  ---');
      
      // Si encontramos un stream online, también probar sus variaciones
      if (result.status === 'ONLINE') {
        console.log(`  🔍 Testing endpoint variations for working stream...`);
        const baseUrl = radio.url.replace(/[;\/]+$/, '');
        for (const variation of endpointVariations) {
          const testUrl = baseUrl + variation;
          console.log(`    Testing: ${testUrl}`);
          try {
            const varResult = await verifyStreamStatus(testUrl);
            if (varResult.status === 'ONLINE') {
              console.log(`      ✅ ONLINE: ${testUrl}`);
            }
          } catch (varError) {
            console.log(`      ❌ Failed: ${varError.message}`);
          }
        }
        console.log('    ---');
      }
      
    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      console.log('  ---');
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total tested: ${totalCount}`);
  console.log(`  Online: ${onlineCount}`);
  console.log(`  Offline: ${totalCount - onlineCount}`);
  console.log(`  Success rate: ${((onlineCount / totalCount) * 100).toFixed(1)}%`);
}

async function testVariationsForProblematicUrl() {
  console.log('\n🔍 Testing endpoint variations for the problematic URL (LANCO - 10989)...\n');
  
  const baseUrl = 'https://streaming.chiloestreaming.com:10989';
  
  for (const variation of endpointVariations) {
    const testUrl = baseUrl + variation;
    console.log(`Testing: ${testUrl}`);
    try {
      const result = await verifyStreamStatus(testUrl);
      console.log(`  ✅ Status: ${result.status}`);
      console.log(`  📊 Status Code: ${result.statusCode}`);
      console.log(`  ⏱️  Response Time: ${result.responseTime}ms`);
      console.log(`  🎵 Content-Type: ${result.contentType}`);
      console.log(`  🖥️  Server: ${result.server}`);
      console.log(`  📝 Details: ${result.details}`);
      
      if (result.status === 'ONLINE') {
        console.log(`  🎉 ¡ENCONTRADO! Esta variación funciona: ${testUrl}`);
      }
      
      console.log('  ---');
    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      console.log('  ---');
    }
  }
}

// Ejecutar los tests
async function runAllTests() {
  await testActiveUrls();
  await testVariationsForProblematicUrl();
  console.log('\n✅ All tests completed!');
}

runAllTests().catch(console.error);