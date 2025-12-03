#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones del VPS a Supabase usando SQL directo
 */

const axios = require('axios');

// Configuración de Supabase desde variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔄 Sincronizando grabaciones del VPS a Supabase (SQL directo)...');

async function getRecordingsFromVPSDirect() {
  try {
    console.log('📡 Obteniendo grabaciones directamente desde VPS...');
    
    const response = await axios.get('http://213.199.39.147:5000/api/recordings', {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.recordings) {
      console.log(`✅ Encontradas ${response.data.recordings.length} grabaciones en el VPS`);
      return response.data.recordings;
    } else {
      console.log('⚠️  No se encontraron grabaciones en el VPS');
      return [];
    }
  } catch (error) {
    console.error('❌ Error obteniendo grabaciones del VPS:', error.message);
    return [];
  }
}

async function saveRecordingToSupabaseSQL(recording) {
  try {
    // Preparar datos para SQL
    const radio_id = recording.radio_id || recording.id || 'unknown';
    const radio_name = recording.radio_name || recording.name || 'Radio Desconocida';
    const radio_region = recording.radio_region || recording.region || 'Desconocida';
    const radio_city = recording.radio_city || recording.city || 'Desconocida';
    const filename = recording.filename;
    const file_path = recording.file_path || recording.path || `http://213.199.39.147:5000/recordings/${recording.filename}`;
    const file_size = recording.file_size || recording.size || 0;
    const duration_seconds = recording.duration_seconds || 0;
    const recorded_at = recording.recorded_at || recording.created_at || new Date().toISOString();
    
    // Crear metadata como JSON
    const metadata = {
      original_path: recording.path,
      vps_created_at: recording.created_at,
      size_bytes: recording.size,
      display_name: recording.display_name,
      enriched_source: 'vps_sql_direct',
      sync_method: 'supabase_sql_direct'
    };

    console.log(`💾 Guardando grabación en Supabase: ${filename}`);
    
    // Usar el método directo de Supabase para ejecutar SQL
    const sql = `
      INSERT INTO recordings (
        radio_id, radio_name, radio_region, radio_city, 
        filename, file_path, file_size, duration_seconds, 
        recorded_at, metadata, status
      ) VALUES (
        '${radio_id.replace(/'/g, "''")}', 
        '${radio_name.replace(/'/g, "''")}', 
        '${radio_region.replace(/'/g, "''")}', 
        '${radio_city.replace(/'/g, "''")}', 
        '${filename.replace(/'/g, "''")}', 
        '${file_path.replace(/'/g, "''")}', 
        ${file_size}, 
        ${duration_seconds}, 
        '${recorded_at}', 
        '${JSON.stringify(metadata).replace(/'/g, "''")}'::jsonb, 
        'active'
      )
      ON CONFLICT (filename) DO NOTHING
      RETURNING *;
    `;

    // Ejecutar SQL directamente usando la API de Supabase
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
      console.log(`✅ Grabación guardada exitosamente: ${filename}`);
      return true;
    } else {
      console.log(`ℹ️  Grabación ya existente o sin cambios: ${filename}`);
      return true; // No es un error real
    }
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log(`ℹ️  Grabación ya existe (conflicto): ${recording.filename}`);
      return true;
    }
    console.error(`❌ Error guardando grabación ${recording.filename}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando sincronización VPS -> Supabase (SQL directo)');
    console.log('='.repeat(70));
    
    // Obtener grabaciones del VPS
    const recordings = await getRecordingsFromVPSDirect();
    
    if (recordings.length === 0) {
      console.log('⚠️  No hay grabaciones para sincronizar');
      return;
    }
    
    console.log(`\n📊 Procesando ${recordings.length} grabaciones...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Procesar cada grabación
    for (const recording of recordings) {
      try {
        console.log(`\n📄 Procesando: ${recording.filename}`);
        console.log(`   📻 Radio: ${recording.radio_name || recording.name || 'Desconocida'}`);
        console.log(`   📅 Fecha: ${recording.created_at || 'Desconocida'}`);
        console.log(`   💾 Tamaño: ${((recording.size || 0) / (1024 * 1024)).toFixed(2)} MB`);
        
        // Guardar en Supabase
        const success = await saveRecordingToSupabaseSQL(recording);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error procesando grabación ${recording.filename}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE SINCRONIZACIÓN');
    console.log('='.repeat(70));
    console.log(`✅ Grabaciones sincronizadas exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Total procesadas: ${recordings.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 ¡Sincronización completada exitosamente!');
    } else {
      console.log(`\n⚠️  Se completó con ${errorCount} errores`);
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso de sincronización:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Script de sincronización finalizado');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });
}

module.exports = { main };