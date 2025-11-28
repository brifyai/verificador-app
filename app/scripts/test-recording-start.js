// Script para simular la llamada de inicio de grabación desde el frontend
const axios = require('axios');

async function testStartRecording() {
  console.log('🧪 Probando inicio de grabación desde el frontend...\n');
  
  const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';
  console.log('📡 VPS_API_URL:', VPS_API_URL);
  
  // Datos de prueba - simulando una radio real
  const testData = {
    radio_id: 'radio-1',
    radio_name: 'Digital Arica',
    radio_url: 'https://radio.digitalfm.cl:8000/arica',
    duration: 30
  };
  
  console.log('\n📋 Datos a enviar:', JSON.stringify(testData, null, 2));
  
  try {
    console.log('\n🚀 Enviando POST a /start-recording...');
    
    const response = await axios.post(`${VPS_API_URL}/start-recording`, testData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    
    console.log('📊 Status code:', response.status);
    console.log('📊 Status text:', response.statusText || 'OK');
    
    const responseData = response.data;
    console.log('🎉 Response data:', JSON.stringify(responseData, null, 2));
    
    if (responseData.status === 'success') {
      console.log('\n✅ ¡GRABACIÓN INICIADA EXITOSAMENTE!');
      console.log(`🎙️ Recording ID: ${responseData.recording_id}`);
      console.log(`📻 Radio: ${responseData.radio_name}`);
    } else {
      console.log('\n❌ Error en la respuesta:', responseData.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error en la petición:');
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    } else if (error.request) {
      console.error('📡 No se recibió respuesta del servidor');
    } else {
      console.error('💥 Error:', error.message);
    }
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar test
testStartRecording().catch(console.error);