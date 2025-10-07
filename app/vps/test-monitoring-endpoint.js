// Script para probar el endpoint de monitoreo actualizado
const BASE_URL = 'http://localhost:3000';

// Datos de prueba que simula lo que envía el frontend
const testMonitoringData = {
  userId: 'user123',
  radioIds: ['radio1', 'radio2'], // Debes usar IDs reales de tu base de datos
  phraseId: 'phrase_ripley', // ID real de una frase en tu base de datos
  days: [1, 2, 3, 4, 5], // Lunes a Viernes
  startTime: '08:00',
  endTime: '09:00',
  aiModel: 'premium',
  description: 'Prueba de monitoreo desde script'
};

async function testMonitoringEndpoint() {
  try {
    console.log('🧪 Probando endpoint de monitoreo...');
    console.log('📤 Datos de prueba:', JSON.stringify(testMonitoringData, null, 2));
    
    const response = await fetch(`${BASE_URL}/api/monitoring/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMonitoringData)
    });
    
    const result = await response.json();
    
    console.log('\n📊 Resultado:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (response.ok && result.success) {
      console.log('\n✅ ÉXITO - Monitoreo programado correctamente');
      console.log('📋 Detalles:');
      console.log(`  📻 Radios programadas: ${result.data.scheduledRadios}`);
      console.log(`  🔍 Frase: "${result.data.phrase.text}" (${result.data.phrase.brand})`);
      console.log(`  📅 Días: ${result.data.days.join(', ')}`);
      console.log(`  ⏰ Horario: ${result.data.timeRange}`);
      console.log(`  ⏱️ Duración: ${result.data.duration}`);
      console.log(`  🤖 Modelo IA: ${result.data.detection.aiModel}`);
      console.log(`  💰 Costo estimado: $${result.data.estimatedCost}`);
      
      if (result.data.vpsResponse) {
        console.log('\n🌐 Respuesta de VPS:');
        console.log('  ✅ VPS recibió los datos correctamente');
        console.log('  📄 Detalles:', JSON.stringify(result.data.vpsResponse, null, 2));
      }
      
    } else {
      console.log('\n❌ ERROR');
      console.log('Error:', result.error);
      console.log('Detalles:', result.details || 'No hay detalles adicionales');
    }
    
  } catch (error) {
    console.error('\n💥 ERROR DE CONEXIÓN:', error.message);
    console.log('\n🔍 Posibles causas:');
    console.log('  - El servidor Next.js no está corriendo (yarn dev)');
    console.log('  - El endpoint no existe o tiene errores');
    console.log('  - Problemas de red');
  }
}

async function testWithDifferentData() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Probando con diferentes configuraciones...');
  
  // Prueba 1: Horario nocturno (cruza medianoche)
  const nightSchedule = {
    ...testMonitoringData,
    startTime: '22:00',
    endTime: '02:00',
    description: 'Prueba horario nocturno'
  };
  
  console.log('\n📅 Prueba 1: Horario nocturno (22:00 - 02:00)');
  await testSpecificData(nightSchedule);
  
  // Prueba 2: Solo fines de semana
  const weekendSchedule = {
    ...testMonitoringData,
    days: [6, 0], // Sábado y Domingo
    aiModel: 'estandar',
    description: 'Prueba fines de semana'
  };
  
  console.log('\n📅 Prueba 2: Solo fines de semana');
  await testSpecificData(weekendSchedule);
}

async function testSpecificData(data) {
  try {
    const response = await fetch(`${BASE_URL}/api/monitoring/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`  ✅ ${result.data.timeRange} - ${result.data.duration} - $${result.data.estimatedCost}`);
    } else {
      console.log(`  ❌ Error: ${result.error}`);
    }
    
  } catch (error) {
    console.log(`  💥 Error de conexión: ${error.message}`);
  }
}

// Ejecutar pruebas
async function runAllTests() {
  console.log('🚀 INICIANDO PRUEBAS DEL ENDPOINT DE MONITOREO');
  console.log('='.repeat(60));
  
  await testMonitoringEndpoint();
  await testWithDifferentData();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ PRUEBAS COMPLETADAS');
  console.log('\n💡 Notas:');
  console.log('  - Asegúrate de que existan radios y frases en la base de datos');
  console.log('  - Verifica que la VPS esté corriendo en 173.249.26.38:3000');
  console.log('  - Los IDs de radioIds y phraseId deben ser válidos');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testMonitoringEndpoint,
  testWithDifferentData
};
