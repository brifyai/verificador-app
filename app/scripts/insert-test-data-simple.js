#!/usr/bin/env node

/**
 * Script simple para insertar datos de prueba en Supabase
 * Usa el cliente de Supabase directamente
 */

const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const SUPABASE_URL = 'https://jzvqwehwjfsktnioxvex.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dnF3ZWh3amZza3RuaW94dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMTY5MzIsImV4cCI6MjA0ODY5MjkzMn0.7pC7Y3z6vX2sZ8qW5tU9rP1mN4bV8cX2aL6sK3fG9hJ';

console.log('🧪 Insertando datos de prueba en Supabase...');

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
  }
];

async function insertTestData() {
  try {
    console.log('📊 Insertando 2 grabaciones de prueba...');
    
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
      console.log('\n🎉 ¡Datos de prueba insertados!');
      console.log('💡 Ahora puedes verificar la página /grabaciones para ver los datos');
    } else {
      console.log('\n⚠️  No se pudieron insertar los datos de prueba');
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