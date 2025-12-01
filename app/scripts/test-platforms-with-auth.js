#!/usr/bin/env node

// Script para verificar qué plataformas están permitidas usando autenticación JWT

const fetch = globalThis.fetch || require('node-fetch');

// URL base de la API
const API_BASE = 'http://localhost:3000/api';

// Plataformas que queremos probar
const testPlatforms = [
  'youtube', 'twitch', 'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin',
  'vimeo', 'dailymotion', 'rumble', 'odysee', 'bitchute', 'kick', 'dlive',
  'trovo', 'streamable', 'wistia', 'brightcove', 'jwplayer', 'soundcloud',
  'spotify', 'apple-music', 'amazon-music', 'tidal', 'deezer', 'pandora',
  'iheartradio', 'tunein', 'shoutcast', 'icecast', 'hls', 'dash', 'rtmp',
  'rtsp', 'm3u8', 'mp4', 'mp3', 'aac', 'ogg', 'flac', 'wav', 'm4a'
];

// Credenciales de prueba (usando las que ya existen)
const TEST_CREDENTIALS = {
  email: 'admin@verificador.com',
  password: 'admin123'
};

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

async function createTestRadio(token) {
  console.log('📻 Creando radio de prueba...');
  
  const testRadio = {
    name: 'Radio Prueba Plataformas',
    streamUrl: 'https://example.com/stream',
    city: 'Test City',
    region: 'CL',
    platform: 'youtube',
    type: 'streaming',
    status: 'active',
    genre: 'test',
    language: 'es'
  };

  try {
    const response = await fetch(`${API_BASE}/radios-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testRadio)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const createdRadio = await response.json();
    console.log('✅ Radio de prueba creada con ID:', createdRadio.id);
    return createdRadio;
  } catch (error) {
    console.error('❌ Error al crear radio de prueba:', error.message);
    throw error;
  }
}

async function testPlatform(token, radioId, platform) {
  try {
    console.log(`Probando plataforma: ${platform}...`);
    
    const response = await fetch(`${API_BASE}/radios-direct/${radioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Radio Prueba Plataformas',
        streamUrl: 'https://example.com/stream',
        city: 'Test City',
        region: 'CL',
        platform: platform,
        type: 'streaming',
        status: 'active',
        genre: 'test',
        language: 'es'
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

async function deleteTestRadio(token, radioId) {
  console.log('\n🗑️  Limpiando radio de prueba...');
  try {
    await fetch(`${API_BASE}/radios-direct/${radioId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Radio de prueba eliminada\n');
  } catch (error) {
    console.error('❌ Error al eliminar radio de prueba:', error.message);
  }
}

async function testPlatformsWithAuth() {
  console.log('🔍 Verificando qué plataformas están permitidas usando autenticación...\n');
  
  let token;
  let testRadio;
  
  try {
    // Obtener token de autenticación
    token = await getAuthToken();
    
    // Crear radio de prueba
    testRadio = await createTestRadio(token);
    
    // Probar plataformas
    console.log('🧪 Probando plataformas...\n');
    
    const results = {
      working: [],
      failed: []
    };

    // Probar solo algunas plataformas para empezar
    const platformsToTest = ['vimeo', 'dailymotion', 'rumble', 'odysee', 'bitchute'];
    
    for (const platform of platformsToTest) {
      const result = await testPlatform(token, testRadio.id, platform);
      if (result.success) {
        results.working.push(result.platform);
      } else {
        results.failed.push({ platform: result.platform, error: result.error });
      }
      
      // Pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 300));
    }

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
  } finally {
    // Limpiar: eliminar el radio de prueba si existe
    if (testRadio && token) {
      await deleteTestRadio(token, testRadio.id);
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  testPlatformsWithAuth().catch(console.error);
}