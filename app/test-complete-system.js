// Script para probar el sistema completo de monitoreo
const https = require('https');
const http = require('http');

// Función para hacer requests HTTP
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    };
    
    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCompleteSystem() {
  console.log('🧪 PROBANDO SISTEMA COMPLETO DE MONITOREO');
  console.log('='.repeat(60));
  
  try {
    // 1. Probar endpoint local de monitoreo
    console.log('1️⃣ Probando endpoint local de monitoreo...');
    
    const now = new Date();
    const nextMinute = new Date(now.getTime() + 60000);
    const startTime = `${nextMinute.getHours().toString().padStart(2, '0')}:${nextMinute.getMinutes().toString().padStart(2, '0')}`;
    
    const testData = {
      userId: `test-${Date.now()}`,
      radioIds: ['radio1', 'radio2'],
      phraseId: 'phrase_test',
      days: [now.getDay()], // Día actual
      startTime: startTime,
      endTime: startTime, // Mismo tiempo para prueba corta
      aiModel: 'estandar',
      description: 'Prueba completa del sistema'
    };
    
    console.log('📤 Enviando datos:', JSON.stringify(testData, null, 2));
    
    const localResponse = await makeRequest('http://localhost:3000/api/monitoring/start', 'POST', testData);
    
    if (localResponse.status === 200 && localResponse.data.success) {
      console.log('✅ Endpoint local funcionando correctamente');
      console.log('📄 Respuesta:', JSON.stringify(localResponse.data, null, 2));
      
      // 2. Verificar que llegó a la VPS
      console.log('\n2️⃣ Verificando estado de la VPS...');
      
      try {
        const vpsStatus = await makeRequest('http://173.249.26.38:3000/api/scheduler/status');
        
        if (vpsStatus.status === 200) {
          console.log('✅ VPS respondiendo correctamente');
          console.log('📊 Estado del scheduler:', JSON.stringify(vpsStatus.data, null, 2));
          
          // 3. Verificar programaciones en VPS
          console.log('\n3️⃣ Verificando programaciones en VPS...');
          
          const vpsSchedules = await makeRequest('http://173.249.26.38:3000/api/schedules');
          
          if (vpsSchedules.status === 200) {
            console.log('✅ Programaciones en VPS:', JSON.stringify(vpsSchedules.data, null, 2));
          } else {
            console.log('⚠️ Error obteniendo programaciones de VPS:', vpsSchedules.status);
          }
          
        } else {
          console.log('❌ VPS no responde correctamente:', vpsStatus.status);
        }
        
      } catch (vpsError) {
        console.log('❌ Error conectando con VPS:', vpsError.message);
        console.log('💡 Verifica que la VPS esté corriendo en 173.249.26.38:3000');
      }
      
    } else {
      console.log('❌ Error en endpoint local:');
      console.log('Status:', localResponse.status);
      console.log('Respuesta:', JSON.stringify(localResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 RESUMEN DE LA PRUEBA:');
  console.log('1. El endpoint local debe procesar los datos del dashboard');
  console.log('2. Debe enviar la programación a la VPS');
  console.log('3. La VPS debe programar las grabaciones automáticamente');
  console.log('4. Las grabaciones se ejecutarán en el horario programado');
  
  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('- Prueba el botón "Iniciar Monitoreo" desde el dashboard');
  console.log('- Monitorea los logs de la VPS para ver las grabaciones');
  console.log('- Verifica los archivos en /root/radio-api/recordings/');
}

// Ejecutar prueba
testCompleteSystem();
