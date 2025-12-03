#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones existentes del VPS a Supabase
 * Este script toma las grabaciones actuales del VPS y las guarda en la tabla recordings de Supabase
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const VPS_API_URL = 'http://213.199.39.147:5000/api/recordings';
const LOCAL_API_URL = 'http://localhost:3000/api/recordings-save';
const VPS_RECORDINGS_URL = 'http://213.199.39.147:5000/recordings';

console.log('🔄 Sincronizando grabaciones del VPS a Supabase...');
console.log('📡 Obteniendo grabaciones desde VPS:', VPS_API_URL);

async function getRecordingsFromVPS() {
  try {
    console.log('📡 Obteniendo grabaciones del VPS...');
    const response = await axios.get(VPS_API_URL);
    
    if (response.data && response.data.files) {
      console.log(`✅ Encontradas ${response.data.files.length} grabaciones en el VPS`);
      return response.data.files;
    } else {
      console.log('⚠️  No se encontraron grabaciones en el VPS');
      return [];
    }
  } catch (error) {
    console.error('❌ Error obteniendo grabaciones del VPS:', error.message);
    return [];
  }
}

async function getRadioData(radioId) {
  try {
    console.log(`🔍 Buscando datos para radio: ${radioId}`);
    const response = await axios.get(`http://localhost:3000/api/radios-direct?id=${radioId}`);
    
    if (response.data && response.data.length > 0) {
      const radio = response.data[0];
      console.log(`✅ Datos encontrados para ${radioId}: ${radio.name}`);
      return {
        id: radio.id,
        name: radio.name,
        region: radio.region,
        city: radio.metadata?.city || null
      };
    } else {
      console.log(`⚠️  No se encontraron datos para radio: ${radioId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error obteniendo datos para radio ${radioId}:`, error.message);
    return null;
  }
}

function parseRecordingData(filename) {
  // Parsear el nombre del archivo para extraer información
  // Formato esperado: radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3
  const parts = filename.split('_');
  
  if (parts.length >= 4) {
    const radioId = `${parts[0]}_${parts[1]}_${parts[2]}`;
    const datePart = parts[3]; // 20251202
    const timePart = parts[4]; // 004618
    
    // Construir timestamp ISO
    const year = datePart.substring(0, 4);
    const month = datePart.substring(4, 6);
    const day = datePart.substring(6, 8);
    const hour = timePart.substring(0, 2);
    const minute = timePart.substring(2, 4);
    const second = timePart.substring(4, 6);
    
    const recordedAt = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    
    return {
      radioId,
      recordedAt,
      filename
    };
  }
  
  return null;
}

async function saveRecordingToSupabase(recording, radioData) {
  try {
    const recordingData = {
      radio_id: radioData.id,
      radio_name: radioData.name,
      radio_region: radioData.region,
      radio_city: radioData.city,
      filename: recording.name,
      file_path: `${VPS_RECORDINGS_URL}/${recording.name}`,
      file_size: recording.size,
      duration_seconds: recording.duration || 0,
      recorded_at: recording.recordedAt,
      metadata: {
        original_path: recording.path,
        vps_created_at: recording.created_at,
        size_bytes: recording.size,
        radio_metadata: radioData
      },
      status: 'active'
    };

    console.log(`💾 Guardando grabación: ${recording.name}`);
    
    const response = await axios.post(LOCAL_API_URL, {
      recordings: [recordingData]
    });

    if (response.data && response.data.success) {
      console.log(`✅ Grabación guardada exitosamente: ${recording.name}`);
      return true;
    } else {
      console.error(`❌ Error guardando grabación: ${recording.name}`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error guardando grabación ${recording.name}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando sincronización VPS -> Supabase');
    console.log('=' .repeat(50));
    
    // Obtener grabaciones del VPS
    const vpsRecordings = await getRecordingsFromVPS();
    
    if (vpsRecordings.length === 0) {
      console.log('⚠️  No hay grabaciones para sincronizar');
      return;
    }
    
    console.log(`\n📊 Procesando ${vpsRecordings.length} grabaciones...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Procesar cada grabación
    for (const recording of vpsRecordings) {
      try {
        console.log(`\n📄 Procesando: ${recording.name}`);
        
        // Parsear datos del archivo
        const parsedData = parseRecordingData(recording.name);
        
        if (!parsedData) {
          console.error(`❌ No se pudo parsear el nombre del archivo: ${recording.name}`);
          errorCount++;
          continue;
        }
        
        // Obtener datos de la radio
        const radioData = await getRadioData(parsedData.radioId);
        
        if (!radioData) {
          console.error(`❌ No se encontraron datos para la radio: ${parsedData.radioId}`);
          errorCount++;
          continue;
        }
        
        // Agregar datos parseados al objeto de grabación
        recording.radioId = parsedData.radioId;
        recording.recordedAt = parsedData.recordedAt;
        
        // Guardar en Supabase
        const success = await saveRecordingToSupabase(recording, radioData);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error procesando grabación ${recording.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE SINCRONIZACIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Grabaciones sincronizadas exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Total procesadas: ${vpsRecordings.length}`);
    
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