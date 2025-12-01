/**
 * Script de prueba simple para el sistema inteligente de plataformas
 * Usa una radio existente y prueba diferentes plataformas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Plataformas a probar
const TEST_PLATFORMS = [
  // Plataformas soportadas por la BD
  'youtube', 'vimeo', 'dailymotion', 'facebook', 'twitch',
  'rumble', 'odysee', 'bitchute', 'direct', 'hls', 'dash',
  
  // Plataformas NO soportadas (deberían usar OTHER)
  'tiktok', 'instagram', 'twitter', 'linkedin', 'spotify',
  'soundcloud', 'shoutcast', 'other'
];

async function testPlatformSystem() {
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
    console.log(`Plataforma actual: ${testRadio.platform || 'N/A'}`);
    console.log('');

    let successCount = 0;
    let failedCount = 0;

    // Probar cada plataforma
    for (const platform of TEST_PLATFORMS) {
      console.log(`🔄 Probando plataforma: ${platform}`);
      
      try {
        // Usar el cliente directo de Supabase para actualizar
        const updateData = {
          platform: platform.toUpperCase(), // Convertir a mayúsculas para BD
          updated_at: new Date().toISOString()
        };

        // Para plataformas no soportadas, usar OTHER y guardar original en metadata
        const unsupportedPlatforms = ['tiktok', 'instagram', 'twitter', 'linkedin', 'spotify', 'soundcloud', 'shoutcast', 'other'];
        
        if (unsupportedPlatforms.includes(platform)) {
          updateData.platform = 'OTHER';
          updateData.metadata = {
            ...testRadio.metadata,
            original_platform: platform,
            stream_platform: platform
          };
        }

        const { data: updatedRadio, error: updateError } = await supabase
          .from('radios')
          .update(updateData)
          .eq('id', testRadio.id)
          .select();

        if (updateError) {
          console.log(`❌ FALLÓ: ${updateError.message}`);
          failedCount++;
        } else {
          console.log(`✅ ÉXITO`);
          console.log(`   Plataforma guardada: ${updatedRadio[0].platform}`);
          console.log(`   Metadata:`, JSON.stringify(updatedRadio[0].metadata || {}));
          successCount++;
        }
      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        failedCount++;
      }
      
      console.log(''); // Línea en blanco
    }

    // Resumen final
    console.log('📊 RESUMEN DE PRUEBAS:');
    console.log(`✅ Plataformas exitosas: ${successCount}`);
    console.log(`❌ Plataformas fallidas: ${failedCount}`);
    console.log(`📈 Tasa de éxito: ${Math.round((successCount / TEST_PLATFORMS.length) * 100)}%`);

    // Verificar el resultado final
    const { data: finalRadio, error: finalError } = await supabase
      .from('radios')
      .select('id, name, platform, metadata')
      .eq('id', testRadio.id)
      .single();

    if (!finalError && finalRadio) {
      console.log('\n🔍 ESTADO FINAL:');
      console.log(`Plataforma: ${finalRadio.platform}`);
      console.log(`Metadata:`, finalRadio.metadata);
    }

    console.log('\n🎉 Prueba completada!');

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar prueba
console.log('🚀 Iniciando prueba del sistema de plataformas...\n');
testPlatformSystem().catch(console.error);