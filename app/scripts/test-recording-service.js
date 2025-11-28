// Script para probar el RecordingService directamente
require('dotenv').config({ path: '../.env' });

// Simular el entorno del navegador para fetch
global.fetch = require('node-fetch');

// Importar el RecordingService
const { recordingService } = require('../lib/recording-service');

async function testRecordingService() {
  console.log('🧪 Probando RecordingService...\n');
  
  console.log('📡 VPS_API_URL desde entorno:', process.env.VPS_API_URL);
  
  try {
    // Test 1: Obtener estado del servidor
    console.log('\n1️⃣ Test: Obtener estado del servidor');
    const status = await recordingService.getServerStatus();
    console.log('✅ Status:', status);
    
    // Test 2: Obtener grabaciones activas
    console.log('\n2️⃣ Test: Obtener grabaciones activas');
    const active = await recordingService.getActiveRecordings();
    console.log('✅ Active recordings:', active);
    
    // Test 3: Obtener lista de grabaciones
    console.log('\n3️⃣ Test: Obtener lista de grabaciones');
    const recordings = await recordingService.getRecordingsList();
    console.log('✅ Recordings list:', recordings);
    
    console.log('\n🎉 ¡Todos los tests del RecordingService pasaron!');
    
  } catch (error) {
    console.error('❌ Error en RecordingService:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testRecordingService();