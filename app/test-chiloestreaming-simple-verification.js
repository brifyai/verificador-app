// Script simple para probar la verificación de chiloestreaming con diferentes endpoints
const https = require('https');
const http = require('http');

// Función simple de verificación de stream
function verifyStreamStatus(streamUrl, timeout = 5000) {
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
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Icy-MetaData': '1',
        'Connection': 'keep-alive'
      }
    };

    const req = client.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'] || '';
      const server = res.headers['server'] || '';
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        // Si es audio, no necesitamos todo el contenido
        if (contentType.includes('audio') || data.length > 1000) {
          res.destroy(); // Detener la descarga
        }
      });

      res.on('end', () => {
        // Lógica de verificación basada en los códigos de estado
        let status = 'OFFLINE';
        let details = `Status: ${statusCode}, Content-Type: ${contentType}`;
        
        if (statusCode === 200) {
          if (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('mp3')) {
            status = 'ONLINE';
            details += ' (Audio stream confirmed)';
          } else if (data.includes('<html') || contentType.includes('text/html')) {
            status = 'OFFLINE';
            details += ' (HTML page, not audio)';
          } else {
            status = 'ONLINE';
            details += ' (Possible audio stream)';
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
          url: streamUrl
        });
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

// URLs a probar
const testUrls = [
  'https://streaming.chiloestreaming.com:10989/',
  'https://streaming.chiloestreaming.com:10989/;stream.mp3',
  'https://streaming.chiloestreaming.com:10989/stream',
  'https://streaming.chiloestreaming.com:10989/stream.mp3',
  'http://streaming.chiloestreaming.com:10989/',
  'http://streaming.chiloestreaming.com:10989/;stream.mp3',
  'http://streaming.chiloestreaming.com:10989/stream'
];

async function runTests() {
  console.log('🧪 Testing chiloestreaming.com:10989 verification...\n');
  
  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    try {
      const result = await verifyStreamStatus(url);
      console.log(`  Status: ${result.status}`);
      console.log(`  Status Code: ${result.statusCode}`);
      console.log(`  Response Time: ${result.responseTime}ms`);
      console.log(`  Content-Type: ${result.contentType}`);
      console.log(`  Server: ${result.server}`);
      console.log(`  Details: ${result.details}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      console.log('  ---');
    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      console.log('  ---');
    }
  }
  
  console.log('\n✅ All tests completed!');
}

// Ejecutar los tests
runTests().catch(console.error);