const https = require('https');
const http = require('http');

// Función para verificar la URL específica de chiloestreaming
async function verifyChiloeStreaming10989() {
  const url = 'https://streaming.chiloestreaming.com:10989/';
  
  console.log('🔍 Verificando URL:', url);
  console.log('⏰ Hora:', new Date().toISOString());
  
  try {
    // Intentar con fetch primero
    console.log('📡 Intentando con fetch...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log('✅ Fetch exitoso');
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
  } catch (fetchError) {
    console.log('❌ Fetch falló:', fetchError.message);
    
    // Si fetch falla, intentar con HTTPS module
    console.log('🔧 Intentando con HTTPS module...');
    
    const options = {
      hostname: 'streaming.chiloestreaming.com',
      port: 10989,
      path: '/',
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        console.log('✅ HTTPS request exitoso');
        console.log('📊 Status Code:', res.statusCode);
        console.log('📊 Status Message:', res.statusMessage);
        console.log('📊 Headers:', res.headers);
        
        res.on('data', () => {});
        res.on('end', () => {
          resolve();
        });
      });
      
      req.on('error', (error) => {
        console.log('❌ HTTPS request falló:', error.message);
        console.log('📋 Error code:', error.code);
        
        // Si es un error de conexión, intentar con HTTP en lugar de HTTPS
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
          console.log('🔄 Intentando con HTTP en lugar de HTTPS...');
          
          const httpOptions = {
            hostname: 'streaming.chiloestreaming.com',
            port: 10989,
            path: '/',
            method: 'HEAD',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          };
          
          const httpReq = http.request(httpOptions, (res) => {
            console.log('✅ HTTP request exitoso');
            console.log('📊 Status Code:', res.statusCode);
            console.log('📊 Status Message:', res.statusMessage);
            console.log('📊 Headers:', res.headers);
            
            res.on('data', () => {});
            res.on('end', () => {
              resolve();
            });
          });
          
          httpReq.on('error', (httpError) => {
            console.log('❌ HTTP request también falló:', httpError.message);
            resolve();
          });
          
          httpReq.on('timeout', () => {
            console.log('⏰ Timeout en HTTP request');
            httpReq.destroy();
            resolve();
          });
          
          httpReq.end();
        } else {
          resolve();
        }
      });
      
      req.on('timeout', () => {
        console.log('⏰ Timeout en HTTPS request');
        req.destroy();
        resolve();
      });
      
      req.end();
    });
  }
}

// Función para probar diferentes variaciones de la URL
async function testUrlVariations() {
  const variations = [
    'https://streaming.chiloestreaming.com:10989/',
    'http://streaming.chiloestreaming.com:10989/',
    'https://streaming.chiloestreaming.com:10989/;',
    'http://streaming.chiloestreaming.com:10989/;',
    'https://streaming.chiloestreaming.com:10989/stream',
    'http://streaming.chiloestreaming.com:10989/stream'
  ];
  
  console.log('\n🧪 Probando diferentes variaciones de URL:');
  
  for (const url of variations) {
    console.log(`\n--- Probando: ${url} ---`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'VLC/3.0.0 LibVLC/3.0.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`✅ Status: ${response.status} - ${response.statusText}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación de streaming.chiloestreaming.com:10989');
  console.log('='.repeat(60));
  
  await verifyChiloeStreaming10989();
  
  await testUrlVariations();
  
  console.log('\n✅ Verificación completada');
}

// Ejecutar
main().catch(console.error);