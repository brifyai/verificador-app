#!/usr/bin/env node

/**
 * Script para insertar datos de prueba usando el endpoint de API directo
 * Similar a create-recordings-table-simple.js
 */

const axios = require('axios');

// Credenciales de Supabase
const SUPABASE_URL = 'https://jzvqwehwjfsktnioxvex.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dnF3ZWh3amZza3RuaW94dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMTY5MzIsImV4cCI6MjA0ODY5MjkzMn0.7pC7Y3z6vX2sZ8qW5tU9rP1mN4bV8cX2aL6sK3fG9hJ';

console.log('🧪 Insertando datos de prueba usando API directa...');

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
    metadata: JSON.stringify({
      test: true,
      source: 'manual_insert',
      quality: 'high'
    }),
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
    metadata: JSON.stringify({
      test: true,
      source: 'manual_insert',
      quality: 'high'
    }),
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
        
        // Crear la consulta SQL para insertar
        const sql = `
          INSERT INTO recordings (
            radio_id,
            radio_name,
            radio_region,
            radio_city,
            filename,
            file_path,
            file_size,
            duration_seconds,
            recorded_at,
            metadata,
            status,
            created_at,
            updated_at
          ) VALUES (
            '${recording.radio_id}',
            '${recording.radio_name}',
            '${recording.radio_region}',
            '${recording.radio_city}',
            '${recording.filename}',
            '${recording.file_path}',
            ${recording.file_size},
            ${recording.duration_seconds},
            '${recording.recorded_at}',
            '${recording.metadata}'::jsonb,
            '${recording.status}',
            NOW(),
            NOW()
          )
          RETURNING *;
        `;
        
        // Usar el endpoint de SQL directo
        const response = await axios.post(
          `${SUPABASE_URL}/rest/v1/rpc/execute_sql`,
          { query: sql },
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data && response.data.length > 0) {
          console.log(`✅ Grabación insertada exitosamente: ${response.data[0].filename}`);
          successCount++;
        } else {
          console.error(`❌ No se recibieron datos al insertar`);
          errorCount++;
        }
        
        // Pequeña pausa entre inserciones
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error procesando grabación: ${error.message}`);
        if (error.response) {
          console.error(`   Código: ${error.response.status}`);
          console.error(`   Respuesta: ${JSON.stringify(error.response.data)}`);
        }
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