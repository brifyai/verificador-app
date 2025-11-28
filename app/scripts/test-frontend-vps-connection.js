// Script para probar conectividad desde el frontend al VPS
const fetch = require('node-fetch');

async function testVPSConnection() {
  console.log('🧪 Probando conectividad desde frontend al VPS...\n');
  
  const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';
  console.log('📡 Usando VPS_API_URL:', VPS_API_URL);
  
  try {
    // Test 1: Estado del servidor
    console.log('\n1️⃣ Test 1: Estado del servidor VPS');
    const statusResponse = await fetch(`${VPS_API_URL}/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Status endpoint responde:', statusData);
    
    // Test 2: Grabaciones activas
    console.log('\n2️⃣ Test 2: Grabaciones activas');
    const activeResponse = await fetch(`${VPS_API_URL}/active-recordings`);
    const activeData = await activeResponse.json();
    console.log('✅ Active recordings responde:', activeData);
    
    // Test 3: Lista de grabaciones
    console.log('\n3️⃣ Test 3: Lista de grabaciones');
    const recordingsResponse = await fetch(`${VPS_API_URL}/recordings`);
    const recordingsData = await recordingsResponse.json();
    console.log('✅ Recordings list responde:', recordingsData);
    
    console.log('\n🎉 ¡Todos los tests pasaron! El frontend puede comunicarse con el VPS.');
    
  } catch (error) {
    console.error('❌ Error en la conexión:', error.message);
    process.exit(1);
  }
}

testVPSConnection();