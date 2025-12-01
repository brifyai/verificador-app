const axios = require('axios');

async function getRealToken() {
  try {
    console.log('Obteniendo token real del sistema...');
    
    // Intentar login con credenciales de admin (según GUÍAS)
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login-direct', {
      email: 'admin@example.com',
      password: 'admin123456'
    });
    
    if (loginResponse.data.token) {
      console.log('✅ Token obtenido exitosamente:');
      console.log(loginResponse.data.token);
      console.log('');
      console.log('Datos del usuario:', JSON.stringify(loginResponse.data.user, null, 2));
      return loginResponse.data.token;
    } else {
      console.log('❌ No se recibió token en la respuesta');
      console.log('Respuesta:', loginResponse.data);
    }
  } catch (error) {
    console.log('❌ Error al obtener token:', error.message);
    if (error.response) {
      console.log('Estado:', error.response.status);
      console.log('Datos:', error.response.data);
    }
  }
}

getRealToken();