#!/usr/bin/env node

/**
 * Script para insertar grabaciones de prueba manualmente en Supabase
 * Usa SQL directo para evitar problemas de autenticación
 */

const { supabaseDirect } = require('../lib/db');

console.log('🧪 Insertando grabaciones de prueba en Supabase...');

// Datos de prueba realistas
const testRecordings = [
  {
    radio_id: 'mijm9xci',
    radio_name: 'Radio Agricultura',
    radio_region: 'Metropolitana',
    radio_city: 'Santiago',
    filename: 'radio_mijm9xci_test_20251201_120000_abc123.mp3',
    file_path: 'http://213.199.39.147:5000/recordings/radio_mijm9xci_test_20251201_120000_abc123.mp3',
    file_size: 9600000, // 9.6 MB
    duration_seconds: 600, // 10 minutos
    recorded_at: '2025-12-01T12:00:00Z',
    metadata: {
      test: true,
      source: 'manual_insert',
      quality: 'high',
      format: 'mp3'
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
    file_size: 14400000, // 14.4 MB
    duration_seconds: 900, // 15 minutos
    recorded_at: '2025-12-01T14:00:00Z',
    metadata: {
      test: true,
      source: 'manual_insert',
      quality: 'high',
      format: 'mp3'
    },
    status: 'active'
  },
  {
    radio_id: 'rj949ks',
    radio_name: 'Radio Pudahuel',
    radio_region: 'Metropolitana',
    radio_city: 'Santiago',
    filename: 'radio_rj949ks_test_20251201_160000_ghi789.mp3',
    file_path: 'http://213.199.39.147:5000/recordings/radio_rj949ks_test_20251201_160000_ghi789.mp3',
    file_size: 7200000, // 7.2 MB
    duration_seconds: 450, // 7.5 minutos
    recorded_at: '2025-12-01T16:00:00Z',
    metadata: {
      test: true,
      source: 'manual_insert',
      quality: 'high',
      format: 'mp3'
    },
    status: 'active'
  }
];

async function insertTestRecordings() {
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
        
        // Insertar usando Supabase Direct
        const { data, error } = await supabaseDirect
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
        await new Promise(resolve => setTimeout(resolve, 200));
        
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
      console.log('\n🎉 ¡Grabaciones de prueba insertadas!');
      console.log('💡 Ahora puedes verificar la página /grabaciones para ver los datos');
    } else {
      console.log('\n⚠️  No se pudieron insertar las grabaciones de prueba');
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso de inserción:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  insertTestRecordings().then(() => {
    console.log('\n✅ Script de inserción finalizado');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });
}

module.exports = { insertTestRecordings };