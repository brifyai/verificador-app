/**
 * Script de prueba para el nuevo sistema inteligente de plataformas
 * Prueba todas las plataformas del frontend para verificar que funcionan
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Todas las plataformas del frontend
const FRONTEND_PLATFORMS = [
  'youtube', 'vimeo', 'dailymotion', 'facebook', 'twitch',
  'rumble', 'odysee', 'bitchute', 'direct', 'hls', 'dash',
  'rtmp', 'rtsp', 'm3u8', 'twitch-vod', 'facebook-vod',
  'instagram', 'tiktok', 'twitter', 'linkedin', 'snapchat',
  'reddit', 'discord', 'telegram', 'whatsapp', 'signal',
  'spotify', 'apple-music', 'amazon-music', 'deezer', 'tidal',
  'pandora', 'soundcloud', 'bandcamp', 'mixcloud', 'hearthis',
  'radiojavan', 'radionomy', 'shoutcast', 'icecast', 'azura',
  'airtime', 'radio-co', 'live365', 'streema', 'tunein',
  'iheartradio', 'radio-com', 'radio-de', 'radio-fr', 'radio-es',
  'radio-it', 'radio-pt', 'radio-nl', 'radio-be', 'radio-ch',
  'radio-at', 'radio-se', 'radio-no', 'radio-dk', 'radio-fi',
  'radio-ie', 'radio-uk', 'other'
];

async function testPlatformUpdate() {
  console.log('🧪 Probando sistema inteligente de plataformas...\n');

  try {
    // Obtener una radio de prueba
    const { data: radios, error: fetchError } = await supabase
      .from('radios')
      .select('id, name, platform, metadata')
      .limit(1);

    if (fetchError || !radios || radios.length === 0) {
      console.log('❌ No se encontraron radios para probar');
      return;
    }

    const testRadio = radios[0];
    console.log(`📻 Radio de prueba: ${testRadio.name} (ID: ${testRadio.id})`);
    console.log(`Plataforma actual: ${testRadio.platform}`);
    console.log(`Metadata actual:`, testRadio.metadata);
    console.log('');

    // Probar diferentes tipos de plataformas
    const testPlatforms = [
      { name: 'Plataforma soportada', platform: 'youtube' },
      { name: 'Plataforma soportada', platform: 'vimeo' },
      { name: 'Plataforma NO soportada', platform: 'tiktok' },
      { name: 'Plataforma NO soportada', platform: 'instagram' },
      { name: 'Plataforma streaming', platform: 'twitch' },
      { name: 'Plataforma radio', platform: 'shoutcast' }
    ];

    for (const test of testPlatforms) {
      console.log(`🔄 Probando ${test.name}: ${test.platform}`);
      
      try {
        // Actualizar usando el endpoint directo
        const response = await fetch(`http://localhost:3000/api/radios-direct/${testRadio.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // Usar autenticación básica para probar
            'Authorization': 'Bearer your-test-token-here'
          },
          body: JSON.stringify({
            streamPlatform: test.platform,
            name: testRadio.name // Mantener el nombre
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Éxito - Plataforma guardada: ${result.data.streamPlatform}`);
          console.log(`   Metadata:`, JSON.stringify(result.data.metadata || {}));
        } else {
          console.log(`❌ Error: ${result.error}`);
          if (result.details) {
            console.log(`   Detalles:`, result.details);
          }
        }
      } catch (error) {
        console.log(`❌ Error de conexión: ${error.message}`);
      }
      
      console.log(''); // Línea en blanco
    }

    console.log('🎉 Pruebas completadas!');
    
    // Mostrar resumen de plataformas soportadas vs no soportadas
    console.log('\n📊 RESUMEN DE PLATAFORMAS:');
    console.log('Soportadas por BD:', ['youtube', 'vimeo', 'dailymotion', 'facebook', 'twitch', 'rumble', 'odysee', 'bitchute', 'direct', 'hls', 'dash', 'rtmp', 'rtsp', 'm3u8'].join(', '));
    console.log('No soportadas (usarán OTHER):', ['tiktok', 'instagram', 'twitter', 'linkedin', 'shoutcast', 'spotify', 'soundcloud', 'other'].join(', '));

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar prueba
testPlatformUpdate().catch(console.error);