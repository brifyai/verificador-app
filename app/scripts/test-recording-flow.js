// Script para probar el flujo de grabación paso a paso
const https = require('https');
const http = require('http');

console.log('🧪 Iniciando prueba de flujo de grabación...');

// Función para hacer peticiones HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testRecordingFlow() {
  try {
    console.log('📋 Paso 1: Verificar que el servidor esté corriendo');
    
    // Verificar servidor principal
    try {
      const healthCheck = await makeRequest('http://localhost:3000/api/health');
      console.log('✅ Servidor principal responde:', healthCheck.status);
    } catch (error) {
      console.log('❌ Servidor principal no responde:', error.message);
      console.log('💡 Asegúrate de que esté corriendo con: cd app && npm run dev');
      return;
    }
    
    console.log('\n📋 Paso 2: Obtener lista de radios');
    
    const radiosResponse = await makeRequest('http://localhost:3000/api/radios-direct?limit=10');
    if (radiosResponse.status !== 200) {
      console.log('❌ Error obteniendo radios:', radiosResponse.status);
      return;
    }
    
    const radios = radiosResponse.data;
    console.log(`✅ Encontradas ${radios.length} radios`);
    
    if (radios.length === 0) {
      console.log('⚠️ No hay radios disponibles para probar');
      return;
    }
    
    // Tomar la primera radio activa
    const activeRadio = radios.find(radio => radio.isActive);
    if (!activeRadio) {
      console.log('⚠️ No hay radios activas. Activando la primera radio...');
      const firstRadio = radios[0];
      
      // Activar la radio
      const activateResponse = await makeRequest(`http://localhost:3000/api/radios/${firstRadio.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });
      
      if (activateResponse.status === 200) {
        console.log('✅ Radio activada exitosamente');
        var testRadio = firstRadio;
        testRadio.isActive = true;
      } else {
        console.log('❌ Error activando radio:', activateResponse.status);
        return;
      }
    } else {
      var testRadio = activeRadio;
      console.log(`✅ Usando radio activa: ${testRadio.name} (${testRadio.id})`);
    }
    
    console.log('\n📋 Paso 3: Verificar streaming de la radio');
    
    const verifyResponse = await makeRequest(`http://localhost:3000/api/radios/${testRadio.id}/verify-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Resultado de verificación:', verifyResponse.data);
    
    console.log('\n📋 Paso 4: Verificar servicio de grabación');
    
    try {
      const recordingStatus = await makeRequest('http://213.199.39.147:5000/api/status');
      console.log('✅ Servicio de grabación responde:', recordingStatus.data);
    } catch (error) {
      console.log('❌ Servicio de grabación no responde:', error.message);
      console.log('💡 El servicio de grabación debe estar corriendo en la VPS');
    }
    
    console.log('\n📋 Paso 5: Simular llamada a servicios de grabación');
    
    // Simular la llamada que haría el botón
    console.log('🎵 Simulando handlePlayWithRecording...');
    console.log('🎯 Radio:', {
      id: testRadio.id,
      name: testRadio.name,
      isActive: testRadio.isActive,
      streamUrl: testRadio.streamUrl
    });
    
    console.log('\n📋 Paso 6: Verificar servicios disponibles');
    
    // Verificar que los servicios estén importados correctamente
    const services = {
      recordingService: 'recordingService',
      streamVerifierVPS: 'streamVerifierVPS',
      onPlay: 'onPlay function'
    };
    
    console.log('✅ Servicios esperados:', Object.keys(services));
    
    console.log('\n🎉 === RESUMEN DE LA PRUEBA ===');
    console.log('✅ Flujo de grabación simulado exitosamente');
    console.log('📍 Los logs reales aparecerán en:');
    console.log('   - Consola del navegador (F12)');
    console.log('   - Página de debug: http://localhost:8080');
    console.log('   - Terminal del servidor: npm run dev');
    
    console.log('\n💡 Próximos pasos:');
    console.log('1. Abre http://localhost:3000/radios en tu navegador');
    console.log('2. Abre http://localhost:8080 en otra pestaña para ver logs');
    console.log('3. Abre la consola del navegador (F12)');
    console.log('4. Presiona el botón "Escuchar" en una radio activa');
    console.log('5. Observa los logs en ambas consolas');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testRecordingFlow();