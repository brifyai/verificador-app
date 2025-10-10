#!/usr/bin/env node

// Script para probar grabaciones simultáneas
const axios = require('axios').default;

const VPS_URL = 'http://localhost:3000';

async function testSimultaneousRecordings() {
  console.log('🧪 PRUEBA DE GRABACIONES SIMULTÁNEAS');
  console.log('=====================================');
  
  try {
    // 1. Verificar que el servidor esté corriendo
    console.log('1️⃣ Verificando servidor...');
    const serverStatus = await axios.get(`${VPS_URL}/`);
    console.log('✅ Servidor activo');
    
    // 2. Limpiar grabaciones activas
    console.log('\n2️⃣ Limpiando grabaciones activas...');
    try {
      const activeRecordings = await axios.get(`${VPS_URL}/api/recordings/active`);
      console.log(`📊 Grabaciones activas encontradas: ${activeRecordings.data.recordings?.length || 0}`);
    } catch (error) {
      console.log('ℹ️ No hay grabaciones activas');
    }
    
    // 3. Crear múltiples grabaciones simultáneas
    console.log('\n3️⃣ Creando grabaciones simultáneas...');
    
    const radios = [
      {
        id: 'caramelo',
        name: 'Caramelo',
        streamUrl: 'http://streaming.caramelo.com.ar:8000/caramelo',
        region: 'Argentina'
      },
      {
        id: 'radio_test_2',
        name: 'Radio Test 2',
        streamUrl: 'http://streaming.example.com/radio2',
        region: 'Argentina'
      },
      {
        id: 'radio_test_3',
        name: 'Radio Test 3',
        streamUrl: 'http://streaming.example.com/radio3',
        region: 'Argentina'
      }
    ];
    
    const schedulePromises = radios.map(async (radio, index) => {
      const scheduleData = {
        scheduleId: `test_simultaneous_${Date.now()}_${index}`,
        days: [0,1,2,3,4,5,6],
        schedule: {
          startTime: new Date(Date.now() + 5000).toTimeString().slice(0,5), // 5 segundos en el futuro
          duration: 120 // 2 minutos
        },
        radios: [radio],
        phrase: {
          id: `test_phrase_${index}`,
          phrase: `test recording ${index}`,
          brand: 'test'
        }
      };
      
      console.log(`📡 Enviando programación para ${radio.name}...`);
      
      try {
        const response = await axios.post(`${VPS_URL}/api/schedule`, scheduleData, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        
        console.log(`✅ ${radio.name}: Programación creada`);
        return { success: true, radio: radio.name, response: response.data };
      } catch (error) {
        console.error(`❌ ${radio.name}: Error -`, error.response?.data || error.message);
        return { success: false, radio: radio.name, error: error.message };
      }
    });
    
    // Esperar a que todas las programaciones se envíen
    const results = await Promise.all(schedulePromises);
    
    console.log('\n📊 RESULTADOS DE PROGRAMACIÓN:');
    results.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.radio}: ${result.success ? 'OK' : result.error}`);
    });
    
    // 4. Esperar un momento y verificar grabaciones activas
    console.log('\n4️⃣ Esperando inicio de grabaciones...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
    
    console.log('\n5️⃣ Verificando grabaciones activas...');
    try {
      const activeRecordings = await axios.get(`${VPS_URL}/api/recordings/active`);
      const recordings = activeRecordings.data.recordings || [];
      
      console.log(`📊 Total grabaciones activas: ${recordings.length}`);
      
      recordings.forEach((recording, index) => {
        console.log(`${index + 1}. 📻 ${recording.radio?.name || 'Unknown'} - PID: ${recording.pid || 'N/A'} - Estado: ${recording.status}`);
      });
      
      if (recordings.length >= 2) {
        console.log('\n🎉 ¡ÉXITO! Grabaciones simultáneas funcionando');
      } else if (recordings.length === 1) {
        console.log('\n⚠️ Solo 1 grabación activa - Problema con simultaneidad');
      } else {
        console.log('\n❌ No hay grabaciones activas - Problema de configuración');
      }
      
    } catch (error) {
      console.error('❌ Error verificando grabaciones:', error.message);
    }
    
    // 6. Verificar estado del scheduler
    console.log('\n6️⃣ Estado del scheduler...');
    try {
      const schedulerStatus = await axios.get(`${VPS_URL}/api/scheduler/status`);
      console.log('📋 Programaciones activas:', schedulerStatus.data.scheduledJobs || 0);
      console.log('🎙️ Grabaciones en curso:', schedulerStatus.data.activeRecordings || 0);
    } catch (error) {
      console.error('❌ Error obteniendo estado:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar prueba
if (require.main === module) {
  testSimultaneousRecordings()
    .then(() => {
      console.log('\n✅ Prueba completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Prueba falló:', error.message);
      process.exit(1);
    });
}

module.exports = { testSimultaneousRecordings };
