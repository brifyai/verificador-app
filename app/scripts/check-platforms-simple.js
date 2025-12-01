#!/usr/bin/env node

// Script simple para verificar qué plataformas están permitidas
// Usa el cliente directo que ya funciona

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const { supabaseDirect } = require('../lib/supabase-direct');

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

async function checkPlatformsSimple() {
  console.log('🔍 Verificando qué plataformas están permitidas en la base de datos...\n');
  
  try {
    // Primero, crear un radio de prueba con una plataforma conocida
    console.log('📻 Creando radio de prueba...\n');
    
    const testRadio = {
      name: 'Radio Prueba Plataformas',
      url: 'https://example.com/stream',
      city: 'Test City',
      country: 'CL',
      platform: 'youtube', // Plataforma conocida que funciona
      type: 'streaming',
      status: 'active',
      genre: 'test',
      language: 'es'
    };

    // Intentar insertar el radio de prueba
    const insertedRadio = await supabaseDirect.createRadio(testRadio);

    if (!insertedRadio) {
      console.error('❌ Error al crear radio de prueba');
      return;
    }

    console.log('✅ Radio de prueba creada con ID:', insertedRadio.id);
    console.log('Plataforma inicial:', insertedRadio.platform);
    console.log('');

    // Ahora probar cada plataforma
    console.log('🧪 Probando plataformas...\n');
    
    const results = {
      working: [],
      failed: [],
      errors: []
    };

    for (const platform of testPlatforms.slice(0, 10)) { // Probar solo 10 primeras para empezar
      try {
        console.log(`Probando plataforma: ${platform}...`);
        
        const result = await supabaseDirect.updateRadio(insertedRadio.id, { platform: platform });

        if (!result) {
          console.log(`  ❌ ${platform}: Falló la actualización`);
          results.failed.push({ platform, error: 'Actualización fallida' });
        } else {
          console.log(`  ✅ ${platform}: Actualización exitosa`);
          results.working.push(platform);
        }
        
        // Pequeña pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`  ❌ ${platform}: Error inesperado - ${error.message}`);
        results.failed.push({ platform, error: error.message });
      }
    }

    // Limpiar: eliminar el radio de prueba
    console.log('\n🗑️  Limpiando radio de prueba...');
    await supabaseDirect.deleteRadio(insertedRadio.id);
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

    console.log('\n📝 RESUMEN:');
    console.log(`- Total de plataformas probadas: ${testPlatforms.slice(0, 10).length}`);
    console.log(`- Plataformas que funcionan: ${results.working.length}`);
    console.log(`- Plataformas que fallan: ${results.failed.length}`);

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar el script
if (require.main === module) {
  checkPlatformsSimple().catch(console.error);
}