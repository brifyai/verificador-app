const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@verificador.com',
  password: 'admin123'
};

// Lista de plataformas para probar
const platformsToTest = [
  'youtube',
  'twitch', 
  'facebook',
  'icecast',
  'shoutcast',
  'direct',
  'rtmp',
  'hls',
  'dash',
  'centova',
  'arkeo',
  'creattiva',
  'tunein',
  'hardata',
  'shoutcheap',
  'other'
];

let authToken = '';

async function login() {
  try {
    console.log('🔐 Iniciando sesión...');
    const response = await axios.post(`${BASE_URL}/api/auth/login-direct`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    authToken = response.data.token;
    console.log('✅ Login exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    return false;
  }
}

async function getRadios() {
  try {
    console.log('📻 Obteniendo lista de radios...');
    const response = await axios.get(`${BASE_URL}/api/radios-direct?limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo radios:', error.response?.data || error.message);
    return null;
  }
}

async function updateRadioPlatform(radioId, platform) {
  try {
    console.log(`🔄 Actualizando plataforma a: ${platform}...`);
    
    const updateData = {
      name: `Radio de Prueba - ${platform}`,
      streamUrl: 'https://test-stream.com/radio.mp3',
      streamPlatform: platform,
      region: 'Metropolitana',
      isActive: true,
      programadora: 'Test Programadora',
      frequency: '100.1',
      city: 'Santiago',
      website: 'https://test-website.com',
      genre: 'Test Genre'
    };

    const response = await axios.put(`${BASE_URL}/api/radios/${radioId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log(`✅ Plataforma ${platform} actualizada exitosamente`);
      console.log(`   Plataforma guardada: ${response.data.data.streamPlatform}`);
      return true;
    } else {
      console.log(`❌ Error actualizando plataforma ${platform}: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error actualizando plataforma ${platform}:`, error.response?.data || error.message);
    return false;
  }
}

async function testAllPlatforms() {
  console.log('🚀 INICIANDO PRUEBA DE ACTUALIZACIÓN DE PLATAFORMAS');
  console.log('='.repeat(60));
  
  // Login
  if (!await login()) {
    console.log('❌ No se pudo iniciar sesión');
    return;
  }

  // Obtener radio de prueba
  const radio = await getRadios();
  if (!radio) {
    console.log('❌ No se encontró radio para probar');
    return;
  }

  console.log(`📻 Radio seleccionada: ${radio.name} (ID: ${radio.id})`);
  console.log('');

  let successCount = 0;
  let totalCount = platformsToTest.length;

  // Probar cada plataforma
  for (const platform of platformsToTest) {
    console.log(`\n${'-'.repeat(40)}`);
    const success = await updateRadioPlatform(radio.id, platform);
    if (success) successCount++;
    
    // Pequeña pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  console.log(`✅ Plataformas exitosas: ${successCount}/${totalCount}`);
  console.log(`❌ Plataformas fallidas: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 ¡TODAS LAS PLATAFORMAS FUNCIONAN CORRECTAMENTE!');
  } else {
    console.log('⚠️  Algunas plataformas fallaron');
  }
}

// Ejecutar prueba
testAllPlatforms().catch(console.error);