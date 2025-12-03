#!/usr/bin/env node

/**
 * Script para insertar grabaciones de prueba en Supabase
 * Este script inserta datos de ejemplo para verificar el funcionamiento
 */

const axios = require('axios');

// Configuración
const SAVE_API_URL = 'http://localhost:3000/api/recordings-save';

console.log('🧪 Insertando grabaciones de prueba en Supabase...');

// Datos de prueba basados en las grabaciones reales que vimos en los logs
const testRecordings = [
  {
    radio_id: 'radio_mijm9xci_rj949ks',
    radio_name: 'Neura',
    radio_region: 'Arica y Parinacota',
    radio_city: 'ARICA',
    filename: 'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
    file_path: 'http://213.199.39.147:5000/recordings/radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
    file_size: 1024000, // ~1MB
    duration_seconds: 120, // 2 minutos
    recorded_at: '2025-12-02T00:46:18Z',
    metadata: {
      test: true,
      source: 'manual_insert',
      original_platform: 'zeno.fm',
      frequency: 'custom',
      description: 'Grabación de prueba - Radio Neura'
    },
    status: 'active'
  },
  {
    radio_id: 'radio_mijm9xsi_6nx1sqf',
    radio_name: 'Astronomica',
    radio_region: 'Coquimbo',
    radio_city: 'VICUÑA',
    filename: 'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
    file_path: 'http://213.199.39.147:5000/recordings/radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
    file_size: 2048000, // ~2MB
    duration_seconds: 240, // 4 minutos
    recorded_at: '2025-12-01T20:12:05Z',
    metadata: {
      test: true,
      source: 'manual_insert',
      original_platform: 'sonicpanel',
      description: 'Grabación de prueba - Radio Astronomica'
    },
    status: 'active'
  },
  {
    radio_id: 'radio_mijm9xsi_6nx1sqf',
    radio_name: 'Astronomica',
    radio_region: 'Coquimbo',
    radio_city: 'VICUÑA',
    filename: 'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3',
    file_path: 'http://213.199.39.147:5000/recordings/radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3',
    file_size: 1536000, // ~1.5MB
    duration_seconds: 180, // 3 minutos
    recorded_at: '2025-12-01T20:02:16Z',
    metadata: {
      test: true,
      source: 'manual_insert',
      original_platform: 'sonicpanel',
      description: 'Grabación de prueba - Radio Astronomica (2da grabación)'
    },
    status: 'active'
  }
];

async function insertTestRecordings() {
  try {
    console.log(`📊 Insertando ${testRecordings.length} grabaciones de prueba...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const recording of testRecordings) {
      try {
        console.log(`💾 Insertando: ${recording.filename}`);
        console.log(`   📻 Radio: ${recording.radio_name} (${recording.radio_region})`);
        console.log(`   📅 Fecha: ${recording.recorded_at}`);
        console.log(`   📏 Tamaño: ${recording.file_size} bytes`);
        
        const response = await axios.post(SAVE_API_URL, {
          recordings: [recording]
        });
        
        if (response.data && response.data.success) {
          console.log(`✅ Grabación insertada exitosamente: ${recording.filename}`);
          if (response.data.details.results.length > 0) {
            console.log(`   📊 Acción: ${response.data.details.results[0].action}`);
            console.log(`   🆔 ID: ${response.data.details.results[0].id}`);
          }
          successCount++;
        } else {
          console.error(`❌ Error insertando grabación: ${recording.filename}`, response.data);
          errorCount++;
        }
        
        // Pequeña pausa entre inserciones
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error insertando grabación ${recording.filename}:`, error.message);
        if (error.response) {
          console.error('📋 Respuesta del servidor:', error.response.data);
        }
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE INSERCIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Grabaciones insertadas exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Total procesadas: ${testRecordings.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 ¡Grabaciones de prueba insertadas exitosamente!');
      console.log('🔄 Ahora puedes verificar en http://localhost:3000/grabaciones');
    } else {
      console.log(`\n⚠️  Se completó con ${errorCount} errores`);
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