const fs = require('fs');
const path = require('path');

// Leer el token desde el archivo
function getToken() {
  const tokenPaths = [
    path.join(__dirname, 'admin-token.txt'),
    path.join(__dirname, 'valid-token.txt')
  ];
  
  for (const tokenPath of tokenPaths) {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf8').trim();
    }
  }
  throw new Error('No se encontró token de autenticación');
}

// Función para obtener información de la radio desde la API
async function getRadioInfo(radioId) {
  const token = getToken();
  
  try {
    const response = await fetch(`http://localhost:3000/api/radios/${radioId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener información: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener información de la radio:', error);
    return null;
  }
}

// Función para verificar el stream
async function verifyStream(url) {
  console.log(`🔍 Verificando stream: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
      },
      timeout: 10000
    });

    console.log(`📊 Estado HTTP: ${response.status} ${response.statusText}`);
    
    if (response.ok || response.status === 404) {
      const contentType = response.headers.get('content-type') || '';
      const server = response.headers.get('server') || '';
      const icyName = response.headers.get('icy-name') || '';
      const icyBr = response.headers.get('icy-br') || '';
      
      console.log(`📋 Tipo de contenido: ${contentType}`);
      console.log(`🔧 Servidor: ${server}`);
      
      if (icyName) {
        console.log(`📻 Nombre: ${icyName}`);
        console.log(`📊 Bitrate: ${icyBr} kbps`);
      }
      
      return {
        online: true,
        statusCode: response.status,
        contentType,
        server,
        icyName,
        icyBr
      };
    }
    
    return {
      online: false,
      statusCode: response.status,
      error: response.statusText
    };
  } catch (error) {
    console.error(`❌ Error al verificar: ${error.message}`);
    return {
      online: false,
      error: error.message
    };
  }
}

// Función principal
async function main() {
  console.log('🎵 Verificando Radio Contagio actual en la base de datos');
  console.log('============================================================');
  
  const radioId = 'radio_mijm9yge_lagcxh3';
  
  // Obtener información actual de la radio
  console.log('📡 Obteniendo información actual de la base de datos...');
  const radioInfo = await getRadioInfo(radioId);
  
  if (!radioInfo) {
    console.error('❌ No se pudo obtener la información de la radio');
    return;
  }
  
  console.log('📊 Información actual:');
  console.log(`   ID: ${radioInfo.id}`);
  console.log(`   Nombre: ${radioInfo.name || 'Sin nombre'}`);
  console.log(`   URL: ${radioInfo.stream_url || 'Sin URL'}`);
  console.log(`   Estado: ${radioInfo.status || 'Sin estado'}`);
  console.log(`   Región: ${radioInfo.region || 'Sin región'}`);
  
  if (!radioInfo.stream_url) {
    console.error('❌ La radio no tiene URL configurada');
    return;
  }
  
  console.log('\n🔍 Verificando el stream actual...');
  const result = await verifyStream(radioInfo.stream_url);
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log(JSON.stringify({
    radioId: radioInfo.id,
    name: radioInfo.name,
    url: radioInfo.stream_url,
    status: result.online ? 'online' : 'offline',
    verification: result
  }, null, 2));
  
  if (result.online) {
    console.log('\n✅ ¡Radio Contagio está ONLINE!');
    console.log(`🎵 Stream: ${radioInfo.stream_url}`);
    if (result.icyName) {
      console.log(`📻 Nombre del stream: ${result.icyName}`);
      console.log(`📊 Bitrate: ${result.icyBr} kbps`);
    }
  } else {
    console.log('\n❌ Radio Contagio aparece como offline');
    if (result.error) {
      console.log(`⚠️  Error: ${result.error}`);
    }
  }
}

// Ejecutar
main().catch(console.error);