/**
 * Prueba del verificador legacy para Digital FM Arica
 */

const https = require('https');
const http = require('http');

async function verifyStreamLegacy(streamUrl, streamType) {
  return new Promise((resolve) => {
    try {
      const url = new URL(streamUrl);
      const isHttps = url.protocol === 'https:';
      const module = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'HEAD',
        headers: {
          'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
          'Icy-MetaData': '1',
          'Accept': 'audio/*, */*',
          'Connection': 'close'
        },
        timeout: 8000,
        rejectUnauthorized: false, // Aceptar certificados SSL inválidos
        secureOptions: require('crypto')?.constants?.SSL_OP_LEGACY_SERVER_CONNECT
      };

      const req = module.request(options, (res) => {
        const statusCode = res.statusCode;
        const contentType = res.headers['content-type'];
        
        console.log(`📊 Status Code: ${statusCode}`);
        console.log(`🎶 Content-Type: ${contentType}`);
        console.log(`📋 Headers:`, res.headers);
        
        // Para Icecast/Shoutcast, incluso un error 400 puede indicar que el servidor está vivo
        const isOnline = statusCode && (statusCode < 400 || (streamType === 'ICECAST' && statusCode === 400));
        
        if (isOnline) {
          resolve({
            status: 'ONLINE',
            details: `Stream disponible (HTTP ${statusCode}) [verificación legacy]`,
            httpStatus: statusCode,
            contentType: contentType,
            sslError: false,
            sslErrorFixed: true
          });
        } else {
          resolve({
            status: 'OFFLINE',
            details: `Stream no disponible (HTTP ${statusCode}) [verificación legacy]`,
            httpStatus: statusCode,
            contentType: contentType
          });
        }
      });

      req.on('error', (error) => {
        console.log(`❌ Error en request: ${error.message}`);
        const errorMessage = error.message || 'Error desconocido';
        
        // Detectar errores SSL
        const isSSLError = errorMessage.includes('certificate') || 
                          errorMessage.includes('SSL') || 
                          errorMessage.includes('TLS') ||
                          errorMessage.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
        
        resolve({
          status: 'OFFLINE',
          details: `Error legacy: ${errorMessage}`,
          sslError: isSSLError,
          sslErrorFixed: false
        });
      });

      req.on('timeout', () => {
        console.log('⏰ Timeout alcanzado');
        req.destroy();
        resolve({
          status: 'OFFLINE',
          details: 'Timeout (8s) [verificación legacy]'
        });
      });

      console.log(`🚀 Enviando request HEAD a ${streamUrl}...`);
      req.end();
      
    } catch (error) {
      console.log(`❌ Error configurando verificación: ${error.message}`);
      resolve({
        status: 'OFFLINE',
        details: `Error configurando verificación legacy: ${error.message}`
      });
    }
  });
}

// Probar con Digital FM Arica
async function probarVerificadorLegacy() {
  console.log('🧪 Probando verificador legacy para Digital FM Arica...');
  
  const url = 'https://radio.digitalfm.cl:8000/arica';
  console.log('📻 URL:', url);
  
  try {
    const resultado = await verifyStreamLegacy(url, 'ICECAST');
    console.log('✅ Estado:', resultado.status);
    console.log('📋 Detalles:', resultado.details);
    console.log('📊 HTTP Status:', resultado.httpStatus);
    console.log('🎶 Content Type:', resultado.contentType);
    console.log('🔒 SSL Error:', resultado.sslError);
    console.log('🔧 SSL Fixed:', resultado.sslErrorFixed);
    
  } catch (error) {
    console.log('❌ Error en verificación legacy:', error.message);
  }
}

probarVerificadorLegacy();