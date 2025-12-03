#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones del VPS a Supabase usando cliente directo
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔄 Sincronizando grabaciones del VPS a Supabase (cliente directo)...');

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function saveRecordingToSupabaseDirect(recording) {
  try {
    const recordingData = {
      radio_id: recording.radio_id || recording.id || 'unknown',
      radio_name: recording.radio_name || recording.name || 'Radio Desconocida',
      radio_region: recording.radio_region || recording.region || 'Desconocida',
      radio_city: recording.radio_city || recording.city || 'Desconocida',
      filename: recording.filename,
      file_path: recording.file_path || recording.path || `http://213.199.39.147:5000/recordings/${recording.filename}`,
      file_size: recording.file_size || recording.size || 0,
      duration_seconds: recording.duration_seconds || 0,
      recorded_at: recording.recorded_at || recording.created_at || new Date().toISOString(),
      metadata: {
        original_path: recording.path,
        vps_created_at: recording.created_at,
        size_bytes: recording.size,
        display_name: recording.display_name,
        enriched_source: 'vps_direct_supabase',
        sync_method: 'supabase_client_direct'
      },
      status: 'active'
    };

    console.log(`💾 Guardando grabación en Supabase: ${recording.filename}`);
    
    const { data, error } = await supabase
      .from('recordings')
      .insert([recordingData])
      .select()
      .single();

    if (error) {
      console.error(`❌ Error guardando grabación ${recording.filename}:`, error.message);
      return false;
    }

    if (data) {
      console.log(`✅ Grabación guardada exitosamente: ${recording.filename}`);
      return true;
    } else {
      console.error(`❌ Error guardando grabación: ${recording.filename} - No se recibieron datos`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error guardando grabación ${recording.filename}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando sincronización VPS -> Supabase (cliente directo)');
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
        const success = await saveRecordingToSupabaseDirect(recording);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 300));
        
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