#!/usr/bin/env node

// Script para verificar qué plataformas están permitidas usando la API del backend
// Esto evita problemas con credenciales directas

const fetch = require('node-fetch');

// URL base de la API
const API_BASE = 'http://localhost:3000/api';

// Todas las plataformas del frontend
const frontendPlatforms = [
  'youtube', 'twitch', 'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin',
  'vimeo', 'dailymotion', 'rumble', 'odysee', 'bitchute', 'kick', 'dlive',
  'trovo', 'streamable', 'wistia', 'brightcove', 'jwplayer', 'soundcloud',
  'spotify', 'apple-music', 'amazon-music', 'tidal', 'deezer', 'pandora',
  'iheartradio', 'tunein', 'shoutcast', 'icecast', 'hls', 'dash', 'rtmp',
  'rtsp', 'm3u8', 'mp4', 'mp3', 'aac', 'ogg', 'flac', 'wav', 'm4a'
];

// Plataformas que ya sabemos que funcionan
const knownWorkingPlatforms = ['youtube', 'twitch', 'facebook', 'instagram', 'tiktok'];

// Plataformas que queremos probar
const testPlatforms = frontendPlatforms.filter(p => !knownWorkingPlatforms.includes(p));

async function testPlatformsViaAPI() {
  console.log('🔍 Verificando qué plataformas están permitidas usando la API...\n');
  
  try {
    // Primero necesitamos autenticarnos
    console.log('🔐 Obteniendo token de autenticación...');
    
    // Intentar login con credenciales por defecto
    const loginResponse = await fetch(`${API_BASE}/auth/login-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    let token;
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      console.log('✅ Login exitoso');
    } else {
      console.log('⚠️  Login falló, intentando sin autenticación...');
      token = null;
    }

    // Crear un radio de prueba
    console.log('📻 Creando radio de prueba...');
    
    const testRadio = {
      name: 'Radio Prueba Plataformas API',
      url: 'https://example.com/stream',
      city: 'Test City',
      country: 'CL',
      platform: 'youtube',
      type: 'streaming',
      status: 'active',
      genre: 'test',
      language: 'es'
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Crear radio de prueba
    const createResponse = await fetch(`${API_BASE}/radios-direct`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testRadio)
    });

    let insertedRadio;
    if (createResponse.ok) {
      insertedRadio = await createResponse.json();
      console.log('✅ Radio de prueba creada con ID:', insertedRadio.id);
    } else {
      console.error('❌ Error al crear radio de prueba:', createResponse.status, await createResponse.text());
      return;
    }

    // Ahora probar cada plataforma
    console.log('🧪 Probando plataformas...\n');
    
    const results = {
      working: [],
      failed: [],
      errors: []
    };

    // Probar solo 5 plataformas para empezar
    const platformsToTest = testPlatforms.slice(0, 5);
    
    for (const platform of platformsToTest) {
      try {
        console.log(`Probando plataforma: ${platform}...`);
        
        const updateResponse = await fetch(`${API_BASE}/radios-direct/${insertedRadio.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ platform: platform })
        });

        if (updateResponse.ok) {
          console.log(`  ✅ ${platform}: Actualización exitosa`);
          results.working.push(platform);
        } else {
          const errorText = await updateResponse.text();
          console.log(`  ❌ ${platform}: ${updateResponse.status} - ${errorText}`);
          results.failed.push({ platform, error: `${updateResponse.status} - ${errorText}` });
        }
        
        // Pequeña pausa
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`  ❌ ${platform}: Error inesperado - ${error.message}`);
        results.failed.push({ platform, error: error.message });
      }
    }

    // Limpiar: eliminar el radio de prueba
    console.log('\n🗑️  Limpiando radio de prueba...');
    await fetch(`${API_BASE}/radios-direct/${insertedRadio.id}`, {
      method: 'DELETE',
      headers
    });
    console.log('✅ Radio de prueba eliminada\n');

    // Reporte final
    console.log('📊 RESULTADOS FINALES:');
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
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar el script
if (require.main === module) {
  testPlatformsViaAPI().catch(console.error);
}