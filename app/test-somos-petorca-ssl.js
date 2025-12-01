const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Deshabilitar verificación SSL para este análisis
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// URL de Radio Somos de Petorca
const RADIO_URL = 'https://streaming1.tecnoera.com:8227/';
const PLS_FILE = path.join(__dirname, 'somos-petorca.pls');

console.log('🔍 Analizando Radio Somos de Petorca (ignorando SSL)...');
console.log('📡 URL:', RADIO_URL);

// Función para descargar y analizar el archivo .pls
function downloadAndAnalyzePls() {
  return new Promise((resolve, reject) => {
    https.get(RADIO_URL, (response) => {
      console.log('📊 Código de respuesta:', response.statusCode);
      console.log('📋 Headers:', response.headers);
      
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        console.log('\n📄 Contenido del archivo .pls:');
        console.log('=' .repeat(50));
        console.log(data);
        console.log('=' .repeat(50));
        
        // Guardar el archivo para análisis
        fs.writeFileSync(PLS_FILE, data);
        console.log('💾 Archivo guardado como:', PLS_FILE);
        
        // Analizar el contenido
        const lines = data.split('\n');
        const streamUrls = [];
        
        lines.forEach((line, index) => {
          line = line.trim();
          if (line.startsWith('File') || line.startsWith('file')) {
            const url = line.split('=')[1];
            if (url) {
              streamUrls.push(url);
              console.log(`🎵 Stream encontrado en línea ${index + 1}: ${url}`);
            }
          }
        });
        
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          content: data,
          streamUrls: streamUrls
        });
      });
      
    }).on('error', (err) => {
      console.error('❌ Error al descargar .pls:', err);
      reject(err);
    });
  });
}

// Función para probar las URLs del stream
async function testStreamUrls(urls) {
  console.log('\n🧪 Probando URLs de stream...');
  
  for (const url of urls) {
    console.log(`\n📡 Probando: ${url}`);
    
    try {
      await testStreamUrl(url);
    } catch (error) {
      console.log(`❌ Error con ${url}:`, error.message);
    }
  }
}

function testStreamUrl(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    const req = protocol.request(url, options, (res) => {
      console.log(`📊 Código: ${res.statusCode}`);
      console.log(`📋 Content-Type: ${res.headers['content-type']}`);
      console.log(`📏 Content-Length: ${res.headers['content-length']}`);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Stream accesible');
      } else if (res.statusCode === 302 || res.statusCode === 301) {
        console.log(`🔄 Redirección a: ${res.headers.location}`);
        if (res.headers.location) {
          testStreamUrl(res.headers.location).then(resolve).catch(reject);
          return;
        }
      } else {
        console.log('⚠️ Stream puede tener problemas');
      }
      
      resolve(res);
    });
    
    req.on('error', (err) => {
      console.log('❌ Error de conexión:', err.message);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Timeout - intentando con GET...');
      req.destroy();
      
      // Intentar con GET
      const getReq = protocol.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': 'bytes=0-1024'
        }
      }, (getRes) => {
        console.log(`📊 GET Código: ${getRes.statusCode}`);
        console.log(`📋 GET Content-Type: ${getRes.headers['content-type']}`);
        
        if (getRes.statusCode >= 200 && getRes.statusCode < 300) {
          console.log('✅ Stream accesible con GET');
        }
        
        getRes.on('data', () => {}); // Consumir datos
        getRes.on('end', resolve);
      });
      
      getReq.on('error', reject);
    });
    
    req.setTimeout(5000);
    req.end();
  });
}

// Función para buscar la radio en la base de datos
async function searchRadioInDatabase() {
  console.log('\n🔍 Buscando Radio Somos de Petorca en la base de datos...');
  
  // Buscar por nombre o URL
  const searchTerms = ['somos', 'petorca', 'tecnoera', '8227'];
  
  // Simular búsqueda (en producción usarías la API real)
  console.log('🔍 Búsqueda simulada con términos:', searchTerms);
  console.log('📡 Esto buscaría en la tabla radios por:');
  console.log('  - name ILIKE "%somos%" OR name ILIKE "%petorca%"');
  console.log('  - stream_url ILIKE "%tecnoera%" OR stream_url ILIKE "%8227%"');
}

// Función principal
async function main() {
  try {
    const analysis = await downloadAndAnalyzePls();
    
    if (analysis.streamUrls.length > 0) {
      await testStreamUrls(analysis.streamUrls);
    } else {
      console.log('⚠️ No se encontraron URLs de stream en el archivo .pls');
      
      // Intentar interpretar el contenido como URL directa
      console.log('\n🔍 Intentando interpretar la URL original como stream directo...');
      await testStreamUrl(RADIO_URL);
    }
    
    // Buscar en base de datos
    await searchRadioInDatabase();
    
    // Limpiar
    if (fs.existsSync(PLS_FILE)) {
      fs.unlinkSync(PLS_FILE);
      console.log('\n🗑️ Archivo temporal eliminado');
    }
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error);
    
    // Si falla, intentar como stream directo
    console.log('\n🔄 Intentando como stream directo...');
    try {
      await testStreamUrl(RADIO_URL);
    } catch (directError) {
      console.log('❌ También falló como stream directo:', directError.message);
    }
  }
}

// Ejecutar
main();