#!/usr/bin/env node

// Script para verificar qué plataformas están permitidas en la base de datos
// Basado en el script que sí funciona

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

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

// Plataformas que queremos probar (las que no sabemos si funcionan)
const testPlatforms = frontendPlatforms.filter(p => !knownWorkingPlatforms.includes(p));

async function checkDatabasePlatforms() {
  console.log('🔍 Verificando qué plataformas están permitidas en la base de datos...\n');
  
  // Configuración de Supabase desde variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan credenciales de Supabase en el archivo .env.local');
    console.log('Variables necesarias:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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

  try {
    // Intentar insertar el radio de prueba
    const { data: insertedRadio, error: insertError } = await supabase
      .from('radios')
      .insert([testRadio])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error al crear radio de prueba:', insertError);
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

    for (const platform of testPlatforms) {
      try {
        console.log(`Probando plataforma: ${platform}...`);
        
        const { data, error } = await supabase
          .from('radios')
          .update({ platform: platform })
          .eq('id', insertedRadio.id)
          .select()
          .single();

        if (error) {
          console.log(`  ❌ ${platform}: ${error.message}`);
          results.failed.push({ platform, error: error.message });
          results.errors.push({ platform, error });
        } else {
          console.log(`  ✅ ${platform}: Actualización exitosa`);
          results.working.push(platform);
        }
        
        // Pequeña pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`  ❌ ${platform}: Error inesperado - ${error.message}`);
        results.failed.push({ platform, error: error.message });
      }
    }

    // Limpiar: eliminar el radio de prueba
    console.log('\n🗑️  Limpiando radio de prueba...');
    await supabase.from('radios').delete().eq('id', insertedRadio.id);
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

    // Análisis de errores
    if (results.errors.length > 0) {
      console.log('🔍 ANÁLISIS DE ERRORES:');
      
      // Agrupar errores por tipo
      const errorTypes = {};
      results.errors.forEach(({ platform, error }) => {
        const errorType = error.code || 'UNKNOWN';
        if (!errorTypes[errorType]) errorTypes[errorType] = [];
        errorTypes[errorType].push({ platform, message: error.message });
      });

      Object.entries(errorTypes).forEach(([type, errors]) => {
        console.log(`\n${type} (${errors.length} plataformas):`);
        errors.forEach(({ platform, message }) => {
          console.log(`  - ${platform}: ${message}`);
        });
      });
    }

    console.log('\n📝 RESUMEN:');
    console.log(`- Total de plataformas probadas: ${testPlatforms.length}`);
    console.log(`- Plataformas que funcionan: ${results.working.length}`);
    console.log(`- Plataformas que fallan: ${results.failed.length}`);
    console.log(`- Porcentaje de éxito: ${Math.round((results.working.length / testPlatforms.length) * 100)}%`);

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar el script
if (require.main === module) {
  checkDatabasePlatforms().catch(console.error);
}

module.exports = { checkDatabasePlatforms };