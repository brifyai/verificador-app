// Test script para verificar la radio Zeno.fm a través de la API
const https = require('https');

async function testZenoRadioAPI() {
  const radioId = 'radio_mijm9xci_rj949ks';
  const apiUrl = `http://localhost:3000/api/radios/${radioId}/verify`;
  
  console.log('🔍 Verificando radio Zeno.fm a través de la API...');
  console.log(`📡 URL: ${apiUrl}`);
  
  // Intentar sin autenticación primero
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log('✅ Respuesta de la API:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Message: ${data.message}`);
    
    if (data.radio) {
      console.log(`   Radio: ${data.radio.name}`);
      console.log(`   URL: ${data.radio.stream_url}`);
      console.log(`   Estado: ${data.radio.status}`);
      console.log(`   Última verificación: ${data.radio.last_verified}`);
      console.log(`   Plataforma: ${data.radio.platform}`);
    }
    
    if (data.verification) {
      console.log(`   Verificación: ${JSON.stringify(data.verification, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testZenoRadioAPI();