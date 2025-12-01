const axios = require('axios');

const CHOAPA_RADIO_ID = 'radio_mijm9xsk_6oxkrbx';
const API_BASE_URL = 'http://localhost:3000/api';

async function testChoapaVerification() {
  console.log('🎯 Probando verificación de Radio Choapa de Illapel');
  console.log('📻 ID:', CHOAPA_RADIO_ID);
  console.log('🌐 URL: https://cast.tunzilla.com/http://sonic.portalfoxmix.club:8106/stream');
  console.log('');

  try {
    // Primero, obtener el token de autenticación
    console.log('🔑 Obteniendo token de autenticación...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login-direct`, {
      email: 'admin@verificador.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Token obtenido exitosamente');
    console.log('');

    // Probar la verificación usando la ruta /api/radios-direct/[id]/verify
    console.log('🔍 Probando verificación con /api/radios-direct/[id]/verify...');
    
    const verifyResponse = await axios.post(
      `${API_BASE_URL}/radios-direct/${CHOAPA_RADIO_ID}/verify`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Verificación completada');
    console.log('📊 Resultado:', JSON.stringify(verifyResponse.data, null, 2));
    
    if (verifyResponse.data.verification) {
      const { status, streamType, details } = verifyResponse.data.verification;
      console.log('');
      console.log('📈 Resumen de verificación:');
      console.log(`   Estado: ${status}`);
      console.log(`   Tipo de stream: ${streamType}`);
      console.log(`   Detalles: ${details}`);
      
      if (status === 'ONLINE') {
        console.log('🎉 ¡La radio está ONLINE!');
      } else {
        console.log('❌ La radio aparece como OFFLINE');
      }
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    
    if (error.response) {
      console.error('📡 Respuesta del servidor:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
  }
}

// Ejecutar la prueba
testChoapaVerification().catch(console.error);