// 🔍 DIAGNÓSTICO DE STREAM - Ejecutar con Node.js
// node diagnostico-backend-stream.js

const https = require('https');
const http = require('http');

console.log('=== DIAGNÓSTICO DE STREAM DESDE BACKEND ===');
console.log('Hora:', new Date().toLocaleString());
console.log('');

// Configuración del stream a verificar
const STREAM_URL = 'https://radio.digitalfm.cl:8000/iquique2';
const RADIO_NAME = 'Digital';

// Función para verificar el stream exactamente como lo hace la API
async function verificarStreamComoAPI() {
  console.log('📋 PASO 1: Verificando stream como lo hace /api/verify-stream-public');
  console.log('📡 URL:', STREAM_URL);
  console.log('📻 Radio:', RADIO_NAME);
  console.log('');

  try {
    // Método 1: HEAD request (como lo hace la API)
    console.log('🔄 Método 1: HEAD request...');
    
    const headResult = await hacerHeadRequest(STREAM_URL);
    console.log('📊 HEAD Resultado:', headResult);
    
    if (headResult.success) {
      console.log('✅ HEAD request exitoso');
      return headResult;
    } else {
      console.log('⚠️ HEAD falló, intentando GET...');
      
      // Método 2: GET request con rango limitado
      console.log('🔄 Método 2: GET request con rango...');
      
      const getResult = await hacerGetRequest(STREAM_URL);
      console.log('📊 GET Resultado:', getResult);
      
      return getResult;
    }
    
  } catch (error) {
    console.log('❌ Error en verificación:', error.message);
    return {
      success: false,
      status: 'error',
      message: `Error: ${error.message}`,
      url: STREAM_URL,
      verifiedAt: new Date().toISOString()
    };
  }
}

// Función para hacer HEAD request
function hacerHeadRequest(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
      }
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      console.log('📊 HEAD Response Status:', res.statusCode, res.statusMessage);
      console.log('📋 HEAD Headers:', res.headers);
      
      const success = res.statusCode >= 200 && res.statusCode < 400;
      
      resolve({
        success: success,
        status: success ? 'available' : 'unavailable',
        message: success ? 'Stream disponible' : 'Stream no accesible',
        statusCode: res.statusCode,
        url: url,
        verifiedAt: new Date().toISOString()
      });
    });

    req.on('error', (error) => {
      console.log('❌ HEAD Error:', error.message);
      resolve({
        success: false,
        status: 'error',
        message: `HEAD Error: ${error.message}`,
        url: url,
        verifiedAt: new Date().toISOString()
      });
    });

    req.on('timeout', () => {
      console.log('⏰ HEAD Timeout');
      req.destroy();
      resolve({
        success: false,
        status: 'timeout',
        message: 'HEAD Timeout',
        url: url,
        verifiedAt: new Date().toISOString()
      });
    });

    req.end();
  });
}

// Función para hacer GET request con rango
function hacerGetRequest(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      method: 'GET',
      timeout: 10000,
      headers: {
        'Range': 'bytes=0-1024',
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
      }
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      console.log('📊 GET Response Status:', res.statusCode, res.statusMessage);
      console.log('📋 GET Headers:', res.headers);
      
      const success = res.statusCode === 206 || (res.statusCode >= 200 && res.statusCode < 400);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        // Solo necesitamos los primeros bytes
        if (data.length > 1024) {
          res.destroy();
        }
      });
      
      res.on('end', () => {
        console.log('📄 Datos recibidos:', data.length, 'bytes');
        
        resolve({
          success: success,
          status: success ? 'available' : 'unavailable',
          message: success ? 'Stream disponible' : 'Stream no accesible',
          statusCode: res.statusCode,
          url: url,
          verifiedAt: new Date().toISOString(),
          dataSize: data.length
        });
      });
    });

    req.on('error', (error) => {
      console.log('❌ GET Error:', error.message);
      resolve({
        success: false,
        status: 'error',
        message: `GET Error: ${error.message}`,
        url: url,
        verifiedAt: new Date().toISOString()
      });
    });

    req.on('timeout', () => {
      console.log('⏰ GET Timeout');
      req.destroy();
      resolve({
        success: false,
        status: 'timeout',
        message: 'GET Timeout',
        url: url,
        verifiedAt: new Date().toISOString()
      });
    });

    req.end();
  });
}

// Función para verificar grabaciones activas
async function verificarGrabacionesActivas() {
  console.log('');
  console.log('📋 PASO 2: Verificando grabaciones activas');
  
  try {
    const response = await fetch('http://localhost:3000/api/recording-vps-fixed');
    const data = await response.json();
    
    console.log('📊 Grabaciones activas:', data);
    
    if (data.active_recordings && Object.keys(data.active_recordings).length > 0) {
      console.log('✅ Hay grabaciones activas en el sistema');
      return data;
    } else {
      console.log('❌ No hay grabaciones activas');
      return null;
    }
    
  } catch (error) {
    console.log('❌ Error al verificar grabaciones:', error.message);
    return null;
  }
}

// Función principal
async function ejecutarDiagnostico() {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...');
  console.log('');
  
  const resultadoVerificacion = await verificarStreamComoAPI();
  
  await verificarGrabacionesActivas();
  
  console.log('');
  console.log('📊 RESUMEN FINAL:');
  console.log('==================');
  
  if (resultadoVerificacion.success) {
    console.log('✅ EL STREAM ESTÁ DISPONIBLE');
    console.log('📝 El problema no es el stream');
    console.log('🔍 El problema debe estar en el componente RadioCard');
  } else {
    console.log('❌ EL STREAM NO ESTÁ DISPONIBLE');
    console.log('📝 Razón:', resultadoVerificacion.message);
    console.log('🔍 El problema es la accesibilidad del stream');
  }
  
  console.log('');
  console.log('🎯 CONCLUSIÓN:');
  console.log('- Si el stream está disponible: El problema está en el frontend');
  console.log('- Si el stream no está disponible: El problema es externo (servidor de streaming)');
}

// Ejecutar diagnóstico
ejecutarDiagnostico().catch(console.error);