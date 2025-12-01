/**
 * Script para crear una radio de prueba
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestRadio() {
  console.log('🚀 Creando radio de prueba...\n');

  try {
    const testRadio = {
      name: 'Radio de Prueba - Plataformas',
      stream_url: 'https://example.com/stream.m3u8',
      platform: 'YOUTUBE',
      region: 'Santiago',
      status: 'ACTIVE',
      description: 'Radio de prueba para testing de plataformas',
      priority: 1,
      cost_per_hour: 0.0,
      metadata: {
        programadora: 'Test Programadora',
        frequency: '100.1 FM',
        city: 'Santiago',
        website: 'https://example.com',
        stream_platform: 'youtube',
        lastMonitored: 'Nunca'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('radios')
      .insert([testRadio])
      .select();

    if (error) {
      console.log('❌ Error creando radio:', error.message);
      console.log('Detalles:', error);
      return null;
    }

    console.log('✅ Radio creada exitosamente!');
    console.log('Datos:', data[0]);
    return data[0];

  } catch (error) {
    console.log('❌ Error general:', error.message);
    return null;
  }
}

// Ejecutar
createTestRadio().then(radio => {
  if (radio) {
    console.log(`\n🎉 Radio de prueba creada con ID: ${radio.id}`);
    console.log('Ahora puedes probar el sistema de plataformas con esta radio.');
  }
}).catch(console.error);