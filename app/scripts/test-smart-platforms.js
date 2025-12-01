/**
 * Script de prueba para el sistema inteligente de plataformas
 * Usa autenticación JWT para probar todas las plataformas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Función para obtener token JWT
async function getAuthToken() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@radioverificador.cl',
        password: 'RadioAdmin2025!'
      })
    });

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.log('❌ Error obteniendo token:', error.message);
    return null;
  }
}

// Plataformas a probar
const TEST_PLATFORMS = [
  // Plataformas soportadas por la BD
  'youtube', 'vimeo', 'dailymotion', 'facebook', 'twitch',
  'rumble', 'odysee', 'bitchute', 'direct', 'hls', 'dash',
  'rtmp', 'rtsp', 'm3u8',
  
  // Plataformas NO soportadas (deberían usar OTHER)
  'tiktok', 'instagram', 'twitter', 'linkedin', 'snapchat',
  'spotify', 'soundcloud', 'shoutcast', 'other'
];

async function testSmartPlatformSystem() {
  console.log('🧪 Probando sistema inteligente de plataformas...\n');

  const token = await getAuthToken();
  if (!token) {
    console.log('❌ No se pudo obtener token de autenticación');
    return;
  }

  console.log('✅ Token obtenido exitosamente\n');

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
    console.log(`Plataforma actual: ${testRadio.platform || 'N/A'}`);
    console.log('');

    let successCount = 0;
    let failedCount = 0;

    // Probar cada plataforma
    for (const platform of TEST_PLATFORMS) {
      console.log(`🔄 Probando plataforma: ${platform}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/radios/${testRadio.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            streamPlatform: platform,
            name: testRadio.name // Mantener el nombre
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ ÉXITO`);
          console.log(`   Plataforma guardada: ${result.data.streamPlatform}`);
          console.log(`   Metadata:`, JSON.stringify(result.data.metadata || {}));
          successCount++;
        } else {
          console.log(`❌ FALLÓ: ${result.error}`);
          if (result.details) {
            console.log(`   Detalles:`, result.details);
          }
          failedCount++;
        }
      } catch (error) {
        console.log(`❌ ERROR DE CONEXIÓN: ${error.message}`);
        failedCount++;
      }
      
      console.log(''); // Línea en blanco
    }

    // Resumen final
    console.log('📊 RESUMEN DE PRUEBAS:');
    console.log(`✅ Plataformas exitosas: ${successCount}`);
    console.log(`❌ Plataformas fallidas: ${failedCount}`);
    console.log(`📈 Tasa de éxito: ${Math.round((successCount / TEST_PLATFORMS.length) * 100)}%`);

    // Verificar que el sistema inteligente está funcionando
    console.log('\n🔍 VERIFICACIÓN DEL SISTEMA INTELIGENTE:');
    
    // Obtener la radio final para verificar
    const { data: finalRadio, error: finalError } = await supabase
      .from('radios')
      .select('id, name, platform, metadata')
      .eq('id', testRadio.id)
      .single();

    if (!finalError && finalRadio) {
      console.log(`Plataforma final en BD: ${finalRadio.platform}`);
      console.log(`Metadata final:`, finalRadio.metadata);
      
      // Verificar que las plataformas no soportadas usan OTHER
      const unsupportedPlatforms = ['tiktok', 'instagram', 'twitter', 'spotify'];
      const lastPlatform = TEST_PLATFORMS[TEST_PLATFORMS.length - 1];
      
      if (unsupportedPlatforms.includes(lastPlatform)) {
        if (finalRadio.platform === 'OTHER') {
          console.log('✅ Sistema inteligente funcionando: Plataforma no soportada guardada como OTHER');
        } else {
          console.log('⚠️  Posible problema: Plataforma no soportada no se guardó como OTHER');
        }
      }
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar prueba
console.log('🚀 Iniciando prueba del sistema inteligente de plataformas...\n');
testSmartPlatformSystem().catch(console.error);