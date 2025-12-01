const axios = require('axios');

async function testRadioVerification() {
  console.log('🧪 Probando verificación de radios sin autenticación...');
  
  // Probar directamente con la URL de Digital FM Arica
  const testUrl = 'https://radio.digitalfm.cl:8000/arica';
  
  try {
    console.log(`\n📻 Probando: ${testUrl}`);
    
    // Intentar conectar directamente al stream
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
      responseType: 'stream'
    });
    
    console.log('✅ Stream accesible:');
    console.log('- Status:', response.status);
    console.log('- Headers:', response.headers);
    
    // Verificar si es un stream de audio válido
    const contentType = response.headers['content-type'];
    if (contentType && (contentType.includes('audio') || contentType.includes('mpeg'))) {
      console.log('✅ Tipo de contenido válido para stream de audio');
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

async function testMultipleRadios() {
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
    }
  ];
  
  console.log('\n🎵 Probando múltiples radios...\n');
  
  for (const radio of radios) {
    console.log(`\n=== ${radio.name} ===`);
    const isOnline = await testRadioVerificationDirect(radio.url);
    console.log(`Estado: ${isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
  }
}

async function testRadioVerificationDirect(url) {
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
      responseType: 'stream'
    });
    
    // Verificar si es un stream válido
    const contentType = response.headers['content-type'];
    const hasValidContentType = contentType && (
      contentType.includes('audio') || 
      contentType.includes('mpeg') || 
      contentType.includes('application/octet-stream') ||
      contentType.includes('video')
    );
    
    return response.status === 200 && hasValidContentType;
    
  } catch (error) {
    console.log(`Error directo: ${error.message}`);
    return false;
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testRadioVerification()
    .then(result => {
      console.log('\n✅ Prueba individual completada');
      return testMultipleRadios();
    })
    .then(() => {
      console.log('\n✅ Todas las pruebas completadas');
    })
    .catch(error => {
      console.error('❌ Error en las pruebas:', error);
    });
}

module.exports = {
  testRadioVerification,
  testRadioVerificationDirect
};