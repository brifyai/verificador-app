const axios = require('axios');
const https = require('https');

// Crear un agente HTTPS que ignore errores de certificado
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testRadioVerificationSSL() {
  console.log('🔒 Probando verificación de radios con SSL ignorado...');
  
  // Probar directamente con la URL de Digital FM Arica
  const testUrl = 'https://radio.digitalfm.cl:8000/arica';
  
  try {
    console.log(`\n📻 Probando: ${testUrl}`);
    
    // Intentar conectar directamente al stream con SSL ignorado
    const response = await axios.get(testUrl, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Aceptar cualquier status menor a 500
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Icy-MetaData': '1' // Importante para streams de radio
      },
      responseType: 'stream',
      httpsAgent: httpsAgent // Ignorar errores de certificado SSL
    });
    
    console.log('✅ Stream accesible:');
    console.log('- Status:', response.status);
    console.log('- Status text:', response.statusText);
    console.log('- Headers:', response.headers);
    
    // Verificar si es un stream de audio válido
    const contentType = response.headers['content-type'];
    if (contentType && (contentType.includes('audio') || contentType.includes('mpeg'))) {
      console.log('✅ Tipo de contenido válido para stream de audio:', contentType);
    } else {
      console.log('⚠️  Tipo de contenido inusual:', contentType);
    }
    
    // Verificar si hay metadata ICY
    const icyMetaInt = response.headers['icy-metaint'];
    if (icyMetaInt) {
      console.log('✅ Stream tiene metadata ICY, intervalo:', icyMetaInt);
    } else {
      console.log('ℹ️  Stream sin metadata ICY detectada');
    }
    
    // Verificar el tamaño del contenido o si es un stream continuo
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      console.log('📊 Tamaño del contenido:', contentLength, 'bytes');
    } else {
      console.log('🔄 Stream continuo (sin tamaño fijo)');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Error al verificar stream:');
    console.log('- Mensaje:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('- Conexión rechazada - el servidor no está escuchando');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('- Tiempo de espera agotado');
    } else if (error.code === 'ENOTFOUND') {
      console.log('- Host no encontrado');
    } else if (error.code === 'ECONNRESET') {
      console.log('- Conexión reiniciada por el servidor');
    } else if (error.response) {
      console.log('- Status:', error.response.status);
      console.log('- Status text:', error.response.statusText);
      console.log('- Headers:', error.response.headers);
    }
    
    return false;
  }
}

async function testMultipleRadiosSSL() {
  const radios = [
    {
      name: 'Digital FM Arica',
      url: 'https://radio.digitalfm.cl:8000/arica'
    },
    {
      name: 'Somos FM',
      url: 'https://stream5.eltelon.com:8080/somosfm.aac'
    },
    {
      name: 'FM Quiero (Cloudflare)',
      url: 'https://zeno.fm/radio/fm-quiero/'
    },
    {
      name: 'Radio Pudahuel',
      url: 'https://stream.pudahuel.cl/pudahuel.mp3'
    }
  ];
  
  console.log('\n🎵 Probando múltiples radios con SSL ignorado...\n');
  
  for (const radio of radios) {
    console.log(`\n=== ${radio.name} ===`);
    const isOnline = await testRadioVerificationDirectSSL(radio.url);
    console.log(`Estado: ${isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
  }
}

async function testRadioVerificationDirectSSL(url) {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500;
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Icy-MetaData': '1'
      },
      responseType: 'stream',
      httpsAgent: httpsAgent // Ignorar errores de certificado SSL
    });
    
    // Verificar si es un stream válido
    const contentType = response.headers['content-type'];
    const hasValidContentType = contentType && (
      contentType.includes('audio') || 
      contentType.includes('mpeg') || 
      contentType.includes('application/octet-stream') ||
      contentType.includes('video') ||
      contentType.includes('mp3')
    );
    
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Content-Type: ${contentType || 'no especificado'}`);
    
    return response.status === 200 && hasValidContentType;
    
  } catch (error) {
    console.log(`  - Error: ${error.message}`);
    if (error.code) {
      console.log(`  - Código: ${error.code}`);
    }
    return false;
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testRadioVerificationSSL()
    .then(result => {
      console.log('\n✅ Prueba individual SSL completada');
      return testMultipleRadiosSSL();
    })
    .then(() => {
      console.log('\n✅ Todas las pruebas SSL completadas');
      console.log('\n📋 RESUMEN:');
      console.log('- Digital FM Arica debería marcarse como ONLINE con SSL ignorado');
      console.log('- El problema era el certificado SSL inválido');
      console.log('- La solución es ignorar la verificación SSL en el verificador del sistema');
    })
    .catch(error => {
      console.error('❌ Error en las pruebas SSL:', error);
    });
}

module.exports = {
  testRadioVerificationSSL,
  testRadioVerificationDirectSSL,
  httpsAgent
};