#!/usr/bin/env node

// Script simple para verificar qué plataformas están permitidas
// Usa fetch directamente desde Node.js

// Asegurar que fetch esté disponible
const fetch = globalThis.fetch || require('node-fetch');

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

async function testPlatformsSimple() {
  console.log('🔍 Verificando qué plataformas están permitidas usando la API...\n');
  
  try {
    // Crear un radio de prueba directamente
    console.log('📻 Creando radio de prueba...');
    
    const testRadio = {
      name: 'Radio Prueba Plataformas',
      url: 'https://example.com/stream',
      city: 'Test City',
      country: 'CL',
      platform: 'youtube',
      type: 'streaming',
      status: 'active',
      genre: 'test',
      language: 'es'
    };

    // Crear radio de prueba usando el endpoint directo
    const createResponse = await fetch(`${API_BASE}/radios-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const platformsToTest = ['vimeo', 'dailymotion', 'rumble', 'odysee', 'bitchute'];
    
    for (const platform of platformsToTest) {
      try {
        console.log(`Probando plataforma: ${platform}...`);
        
        const updateResponse = await fetch(`${API_BASE}/radios-direct/${insertedRadio.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            name: insertedRadio.name,
            url: insertedRadio.url,
            city: insertedRadio.city,
            country: insertedRadio.country,
            platform: platform,
            type: insertedRadio.type,
            status: insertedRadio.status,
            genre: insertedRadio.genre,
            language: insertedRadio.language
          })
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
      headers: {
        'Content-Type': 'application/json',
      }
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
  testPlatformsSimple().catch(console.error);
}