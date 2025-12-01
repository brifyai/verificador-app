#!/usr/bin/env node

// Script para verificar qué plataformas están permitidas usando un radio existente

const fetch = globalThis.fetch || require('node-fetch');

// URL base de la API
const API_BASE = 'http://localhost:3000/api';

// Credenciales de prueba (usando las que ya existen)
const TEST_CREDENTIALS = {
  email: 'admin@verificador.com',
  password: 'admin123'
};

// Plataformas que queremos probar
const testPlatforms = [
  'youtube', 'twitch', 'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin',
  'vimeo', 'dailymotion', 'rumble', 'odysee', 'bitchute', 'kick', 'dlive',
  'trovo', 'streamable', 'wistia', 'brightcove', 'jwplayer', 'soundcloud',
  'spotify', 'apple-music', 'amazon-music', 'tidal', 'deezer', 'pandora',
  'iheartradio', 'tunein', 'shoutcast', 'icecast', 'hls', 'dash', 'rtmp',
  'rtsp', 'm3u8', 'mp4', 'mp3', 'aac', 'ogg', 'flac', 'wav', 'm4a'
];

async function getAuthToken() {
  console.log('🔐 Obteniendo token de autenticación...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✅ Token obtenido exitosamente');
    return data.token;
  } catch (error) {
    console.error('❌ Error al obtener token:', error.message);
    throw error;
  }
}

async function getExistingRadio(token) {
  console.log('📻 Obteniendo radio existente para pruebas...');
  
  try {
    const response = await fetch(`${API_BASE}/radios?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    console.log('📡 Respuesta cruda:', JSON.stringify(responseData, null, 2));
    
    // La respuesta puede tener diferentes estructuras
    let radios = responseData;
    if (responseData.data && Array.isArray(responseData.data)) {
      radios = responseData.data;
    } else if (responseData.radios && Array.isArray(responseData.radios)) {
      radios = responseData.radios;
    } else if (!Array.isArray(responseData)) {
      // Si es un objeto único, convertirlo en array
      radios = [responseData];
    }
    
    if (!radios || radios.length === 0) {
      throw new Error('No hay radios disponibles para pruebas');
    }

    const radio = radios[0];
    console.log('✅ Radio obtenida con ID:', radio.id);
    console.log('   Nombre:', radio.name);
    console.log('   Plataforma actual:', radio.platform);
    console.log('   URL:', radio.streamUrl);
    return radio;
  } catch (error) {
    console.error('❌ Error al obtener radio existente:', error.message);
    throw error;
  }
}

async function testPlatform(token, radio, platform) {
  try {
    console.log(`Probando plataforma: ${platform}...`);
    
    const response = await fetch(`${API_BASE}/radios/${radio.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        name: radio.name,
        streamUrl: radio.streamUrl,
        city: radio.city,
        region: radio.region,
        platform: platform,
        type: radio.type,
        status: radio.status,
        genre: radio.genre,
        language: radio.language
      })
    });

    if (response.ok) {
      console.log(`  ✅ ${platform}: Actualización exitosa`);
      return { success: true, platform };
    } else {
      const errorText = await response.text();
      console.log(`  ❌ ${platform}: ${response.status} - ${errorText}`);
      return { success: false, platform, error: `${response.status} - ${errorText}` };
    }
    
  } catch (error) {
    console.log(`  ❌ ${platform}: Error inesperado - ${error.message}`);
    return { success: false, platform, error: error.message };
  }
}

async function testPlatformsExistingRadio() {
  console.log('🔍 Verificando qué plataformas están permitidas usando radio existente...\n');
  
  let token;
  let originalRadio;
  
  try {
    // Obtener token de autenticación
    token = await getAuthToken();
    
    // Obtener radio existente
    originalRadio = await getExistingRadio(token);
    
    // Guardar la plataforma original para restaurarla después
    const originalPlatform = originalRadio.platform;
    
    // Probar plataformas
    console.log('🧪 Probando plataformas...\n');
    
    const results = {
      working: [],
      failed: []
    };

    // Probar solo algunas plataformas para empezar
    const platformsToTest = ['vimeo', 'dailymotion', 'rumble', 'odysee', 'bitchute'];
    
    for (const platform of platformsToTest) {
      const result = await testPlatform(token, originalRadio, platform);
      if (result.success) {
        results.working.push(result.platform);
      } else {
        results.failed.push({ platform: result.platform, error: result.error });
      }
      
      // Pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Restaurar la plataforma original
    console.log('\n🔄 Restaurando plataforma original...');
    await testPlatform(token, originalRadio, originalPlatform);
    
    // Reporte final
    console.log('\n📊 RESULTADOS FINALES:');
    console.log('======================\n');
    
    console.log(`✅ Plataformas que FUNCIONAN (${results.working.length}):`);
    results.working.forEach(platform => console.log(`  - ${platform}`));
    console.log('');

    console.log(`❌ Plataformas que FALLAN (${results.failed.length}):`);
    results.failed.forEach(({ platform, error }) => {
      console.log(`  - ${platform}: ${error}`);
    });
    console.log('');

    console.log('📝 RESUMEN:');
    console.log(`- Total de plataformas probadas: ${platformsToTest.length}`);
    console.log(`- Plataformas que funcionan: ${results.working.length}`);
    console.log(`- Plataformas que fallan: ${results.failed.length}`);

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar el script
if (require.main === module) {
  testPlatformsExistingRadio().catch(console.error);
}