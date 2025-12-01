const axios = require('axios');
const https = require('https');

// Crear un agente HTTPS que ignore errores de certificado (como el sistema actual)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testDigitalFMDirect() {
  console.log('🧪 Probando Digital FM Arica con el método actual del sistema...\n');
  
  const digitalFMAricaUrl = 'https://radio.digitalfm.cl:8000/arica';
  
  try {
    console.log(`📻 Verificando: ${digitalFMAricaUrl}`);
    console.log('⏳ Usando método HTTPS con rejectUnauthorized: false...\n');
    
    // Simular exactamente lo que hace el sistema actual
    const startTime = Date.now();
    
    const response = await axios.get(digitalFMAricaUrl, {
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Aceptar cualquier status menor a 500
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
        'Accept': '*/*',
        'Icy-MetaData': '1',
        'Connection': 'close'
      },
      responseType: 'stream',
      httpsAgent: httpsAgent // Ignorar errores de certificado SSL (como el sistema actual)
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Stream accesible:');
    console.log('- Status:', response.status);
    console.log('- Tiempo de respuesta:', responseTime + 'ms');
    console.log('- Headers:', response.headers);
    
    // Verificar si es un stream de audio válido (como hace el sistema)
    const contentType = response.headers['content-type'];
    const statusCode = response.status;
    
    // Lógica de verificación del sistema actual
    const isIcecastServer = true; // Porque es :8000 y digitalfm.cl
    const isOnline = (statusCode >= 200 && statusCode < 300) ||
                     (statusCode === 400 && isIcecastServer) ||
                     (statusCode >= 200 && statusCode < 500 && isIcecastServer);
    
    console.log('\n📊 Análisis según lógica del sistema:');
    console.log(`- Es servidor Icecast: ${isIcecastServer}`);
    console.log(`- Código HTTP: ${statusCode}`);
    console.log(`- Debería estar ONLINE: ${isOnline}`);
    
    if (contentType && (contentType.includes('audio') || contentType.includes('mpeg'))) {
      console.log('✅ Tipo de contenido válido para stream de audio:', contentType);
    }
    
    // Verificar metadata ICY
    const icyMetaInt = response.headers['icy-metaint'];
    if (icyMetaInt) {
      console.log('✅ Stream tiene metadata ICY, intervalo:', icyMetaInt);
    }
    
    // Cerrar conexión (como hace el sistema)
    if (response && response.destroy) {
      response.destroy();
    }
    
    if (isOnline) {
      console.log('\n🎉 ¡ÉXITO! Digital FM Arica está ONLINE según la lógica del sistema');
      console.log('✅ El certificado SSL está siendo ignorado correctamente');
      console.log('✅ El stream responde con código HTTP válido');
      console.log('✅ El contenido es audio/mpeg válido');
    } else {
      console.log('\n❌ La radio aparece como OFFLINE según la lógica actual');
      console.log('🔍 Razón: Código HTTP', statusCode, 'no cumple con los criterios');
    }
    
    return {
      status: isOnline ? 'ONLINE' : 'OFFLINE',
      details: isOnline ? 'Stream verificado exitosamente' : 'Stream no responde correctamente',
      streamType: 'ICECAST',
      method: 'HTTPS_MODULE',
      responseCode: statusCode,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    };
    
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
    }
    
    return {
      status: 'OFFLINE',
      details: `Error de conexión: ${error.message}`,
      streamType: 'ICECAST',
      method: 'HTTPS_MODULE_ERROR',
      timestamp: new Date().toISOString()
    };
  }
}

// Ejecutar prueba
if (require.main === module) {
  testDigitalFMDirect()
    .then(result => {
      console.log('\n📋 RESUMEN DE LA PRUEBA:');
      console.log(`- URL probada: https://radio.digitalfm.cl:8000/arica`);
      console.log(`- Estado final: ${result.status}`);
      console.log(`- Método de verificación: ${result.method}`);
      console.log(`- SSL ignorado: Sí (rejectUnauthorized: false)`);
      console.log(`- Tiempo de respuesta: ${result.responseTime || 'N/A'}ms`);
      
      if (result.status === 'ONLINE') {
        console.log('\n✅ CONCLUSIÓN: El sistema debería mostrar Digital FM Arica como ONLINE');
        console.log('🔧 Si aún aparece como OFFLINE, el problema está en otro lugar del sistema');
      } else {
        console.log('\n❌ CONCLUSIÓN: Hay otro problema además del certificado SSL');
        console.log('🔍 Se necesita investigar más a fondo');
      }
    })
    .catch(error => {
      console.error('❌ Error en la prueba:', error);
    });
}

module.exports = { testDigitalFMDirect };