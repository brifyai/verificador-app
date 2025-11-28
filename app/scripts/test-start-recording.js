const axios = require('axios');

const VPS_API_URL = 'http://213.199.39.147:5000';

async function testStartRecording() {
  console.log('🧪 PROBANDO ENDPOINT /api/start-recording\n');
  
  const testData = {
    radio_id: 'radio-1',
    radio_name: 'Digital Arica',
    radio_url: 'https://radio.digitalfm.cl:8000/arica',
    duration: 600
  };
  
  console.log('📤 Enviando POST a:', `${VPS_API_URL}/api/start-recording`);
  console.log('📋 Datos:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await axios.post(
      `${VPS_API_URL}/api/start-recording`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );
    
    console.log('\n✅ RESPUESTA EXITOSA');
    console.log('📊 Status:', response.status);
    console.log('📦 Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ ERROR EN LA PETICIÓN');
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📦 Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('🔥 No hubo respuesta del servidor');
      console.log('📝 Error:', error.message);
    } else {
      console.log('💥 Error de configuración:', error.message);
    }
  }
}

testStartRecording();
