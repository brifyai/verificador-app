#!/usr/bin/env node

/**
 * Script final para insertar datos de prueba usando el token real de administrador
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// URL del endpoint local
const LOCAL_API_URL = 'http://localhost:3000/api/recordings-save';

// Leer el token de administrador del archivo
function getAdminToken() {
  try {
    const tokenPath = path.join(__dirname, '..', 'admin-token.txt');
    if (fs.existsSync(tokenPath)) {
      const token = fs.readFileSync(tokenPath, 'utf8').trim();
      console.log('🔑 Token de administrador encontrado');
      return token;
    } else {
      console.error('❌ No se encontró el archivo admin-token.txt');
      return null;
    }
  } catch (error) {
    console.error('❌ Error leyendo el token de administrador:', error.message);
    return null;
  }
}

console.log('🧪 Insertando datos de prueba con autenticación real...');

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
  const adminToken = getAdminToken();
  
  if (!adminToken) {
    console.error('❌ No se pudo obtener el token de administrador');
    console.log('💡 Asegúrate de haber ejecutado: node scripts/generate-admin-token.js');
    process.exit(1);
  }
  
  try {
    console.log('📊 Insertando 3 grabaciones de prueba con autenticación real...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const recording of testRecordings) {
      try {
        console.log(`\n📝 Insertando: ${recording.filename}`);
        console.log(`   📻 Radio: ${recording.radio_name}`);
        console.log(`   📅 Fecha: ${recording.recorded_at}`);
        console.log(`   💾 Tamaño: ${(recording.file_size / (1024 * 1024)).toFixed(2)} MB`);
        
        // Usar el endpoint local con autenticación
        const response = await axios.post(
          LOCAL_API_URL,
          recording,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );
        
        if (response.data && response.data.success) {
          console.log(`✅ Grabación insertada exitosamente: ${recording.filename}`);
          successCount++;
        } else {
          console.error(`❌ Error al insertar grabación: ${response.data?.error || 'Error desconocido'}`);
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
      console.log('🌐 Abre: http://localhost:3000/grabaciones');
    } else {
      console.log('\n⚠️  No se pudieron insertar los datos de prueba');
      console.log('🔍 Verifica que el servidor esté ejecutándose en http://localhost:3000');
      console.log('🔑 Verifica que el token de administrador sea válido');
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