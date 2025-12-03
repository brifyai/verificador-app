#!/usr/bin/env node

/**
 * Script para insertar datos de prueba usando el cliente directo de Supabase
 * Similar a create-recordings-table-simple.js
 */

const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase actualizadas
const SUPABASE_URL = 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

console.log('🧪 Insertando datos de prueba usando cliente directo de Supabase...');

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Datos de prueba
const testRecordings = [
  {
    radio_id: 'mijm9xci',
    radio_name: 'Radio Agricultura',
    radio_region: 'Metropolitana',
    radio_city: 'Santiago',
    filename: 'radio_mijm9xci_test_20251201_120000_abc123.mp3',
    file_path: 'http://213.199.39.147:5000/recordings/radio_mijm9xci_test_20251201_120000_abc123.mp3',
    file_size: 9600000,
    duration_seconds: 600,
    recorded_at: '2025-12-01T12:00:00Z',
    metadata: {
      test: true,
      source: 'manual_insert',
      quality: 'high'
    },
    status: 'active'
  },
  {
    radio_id: 'mijm9xsi',
    radio_name: 'Radio Cooperativa',
    radio_region: 'Metropolitana',
    radio_city: 'Santiago',
    filename: 'radio_mijm9xsi_test_20251201_140000_def456.mp3',
    file_path: 'http://213.199.39.147:5000/recordings/radio_mijm9xsi_test_20251201_140000_def456.mp3',
    file_size: 14400000,
    duration_seconds: 900,
    recorded_at: '2025-12-01T14:00:00Z',
    metadata: {
      test: true,
      source: 'manual_insert',
      quality: 'high'
    },
    status: 'active'
  },
  {
    radio_id: 'mijm9xbi',
    radio_name: 'Radio Bio-Bio',
    radio_region: 'Biobío',
    radio_city: 'Concepción',
    filename: 'radio_mijm9xbi_test_20251201_160000_ghi789.mp3',
    file_path: 'http://213.199.39.147:5000/recordings/radio_mijm9xbi_test_20251201_160000_ghi789.mp3',
    file_size: 12000000,
    duration_seconds: 750,
    recorded_at: '2025-12-01T16:00:00Z',
    metadata: {
      test: true,
      source: 'manual_insert',
      quality: 'high'
    },
    status: 'active'
  }
];

async function insertTestData() {
  try {
    console.log('📊 Insertando 3 grabaciones de prueba...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const recording of testRecordings) {
      try {
        console.log(`\n📝 Insertando: ${recording.filename}`);
        console.log(`   📻 Radio: ${recording.radio_name}`);
        console.log(`   📅 Fecha: ${recording.recorded_at}`);
        console.log(`   💾 Tamaño: ${(recording.file_size / (1024 * 1024)).toFixed(2)} MB`);
        
        // Insertar directamente usando el cliente de Supabase
        const { data, error } = await supabase
          .from('recordings')
          .insert([recording])
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error insertando grabación: ${error.message}`);
          errorCount++;
        } else if (data) {
          console.log(`✅ Grabación insertada exitosamente: ${data.filename}`);
          successCount++;
        } else {
          console.error(`❌ No se recibieron datos al insertar`);
          errorCount++;
        }
        
        // Pequeña pausa entre inserciones
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Error procesando grabación: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE INSERCIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Grabaciones insertadas exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Total procesadas: ${testRecordings.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 ¡Datos de prueba insertados en Supabase!');
      console.log('💡 Ahora puedes verificar la página /grabaciones para ver los datos');
      console.log('🌐 Abre: http://localhost:3000/grabaciones');
    } else {
      console.log('\n⚠️  No se pudieron insertar los datos de prueba');
      console.log('🔍 Esto puede deberse a problemas de conectividad con Supabase');
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso de inserción:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  insertTestData().then(() => {
    console.log('\n✅ Script de inserción finalizado');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });
}

module.exports = { insertTestData };