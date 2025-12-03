#!/usr/bin/env node

/**
 * LIMPIAR: Archivos fantasma de la base de datos
 * Elimina registros de grabaciones que no tienen archivos físicos en el VPS
 */

const axios = require('axios');
const colors = require('colors');
const fs = require('fs');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

// Función para hacer request a Supabase
async function supabaseRequest(query, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${query}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  };

  try {
    const response = await axios({
      method: options.method || 'GET',
      url,
      headers,
      data: options.data,
      params: options.params
    });
    return response.data;
  } catch (error) {
    console.log(colors.red(`Error en request Supabase: ${error.message}`));
    if (error.response) {
      console.log(colors.red(`Status: ${error.response.status}`));
      console.log(colors.red(`Data: ${JSON.stringify(error.response.data, null, 2)}`));
    }
    throw error;
  }
}

// Función para verificar si un archivo existe en el VPS
async function checkFileExists(filename) {
  const vpsUrl = `http://213.199.39.147:5000/recordings/${filename}`;
  
  try {
    const response = await axios.head(vpsUrl, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Función para obtener todas las grabaciones de la base de datos
async function getAllRecordings() {
  console.log(colors.cyan('📊 Obteniendo todas las grabaciones de la base de datos...'));
  
  try {
    const recordings = await supabaseRequest('recordings?select=*');
    console.log(colors.green(`✅ ${recordings.length} grabaciones encontradas en la base de datos`));
    return recordings;
  } catch (error) {
    console.log(colors.red('❌ Error obteniendo grabaciones'));
    throw error;
  }
}

// Función para eliminar una grabación de la base de datos
async function deleteRecording(recordingId) {
  try {
    await supabaseRequest(`recordings?id=eq.${recordingId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.log(colors.red(`❌ Error eliminando grabación ${recordingId}: ${error.message}`));
    return false;
  }
}

// Función para limpiar archivos fantasma
async function cleanPhantomRecordings() {
  console.log(colors.cyan.bold('\n=== LIMPIEZA DE ARCHIVOS FANTASMA ===\n'));
  
  try {
    // 1. Obtener todas las grabaciones
    const recordings = await getAllRecordings();
    
    if (recordings.length === 0) {
      console.log(colors.yellow('⚠️ No hay grabaciones en la base de datos para limpiar'));
      return;
    }
    
    // 2. Verificar cada archivo
    console.log(colors.cyan.bold('\n🔍 Verificando existencia de archivos...\n'));
    
    const phantomRecordings = [];
    const existingRecordings = [];
    
    for (let i = 0; i < recordings.length; i++) {
      const recording = recordings[i];
      const filename = recording.filename;
      
      console.log(colors.bold(`Verificando ${i + 1}/${recordings.length}: ${filename}`));
      
      const exists = await checkFileExists(filename);
      
      if (exists) {
        existingRecordings.push(recording);
        console.log(colors.green(`   ✅ Existe`));
      } else {
        phantomRecordings.push(recording);
        console.log(colors.red(`   ❌ No existe (FANTASMA)`));
      }
      
      // Pausa pequeña para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 3. Mostrar resumen
    console.log(colors.cyan.bold('\n=== RESUMEN ===\n'));
    console.log(`📊 Total grabaciones: ${recordings.length}`);
    console.log(`✅ Archivos que existen: ${existingRecordings.length}`);
    console.log(`👻 Archivos fantasma: ${phantomRecordings.length}`);
    
    if (phantomRecordings.length > 0) {
      console.log(colors.cyan.bold('\n👻 ARCHIVOS FANTASMA ENCONTRADOS:\n'));
      phantomRecordings.forEach((recording, index) => {
        console.log(`${index + 1}. ${recording.filename}`);
        console.log(`   ID: ${recording.id}`);
        console.log(`   Radio ID: ${recording.radio_id}`);
        console.log(`   Fecha: ${recording.created_at || 'No especificada'}`);
        console.log('');
      });
      
      // 4. Confirmar limpieza
      console.log(colors.yellow.bold('⚠️ ¿Deseas eliminar estos archivos fantasma de la base de datos?'));
      console.log('Esta acción NO se puede deshacer.');
      console.log('');
      
      // Para automatización, eliminamos directamente
      console.log(colors.cyan('🧹 Eliminando archivos fantasma...'));
      
      let deletedCount = 0;
      for (const phantom of phantomRecordings) {
        const success = await deleteRecording(phantom.id);
        if (success) {
          deletedCount++;
          console.log(colors.green(`   ✅ Eliminado: ${phantom.filename}`));
        } else {
          console.log(colors.red(`   ❌ Error eliminando: ${phantom.filename}`));
        }
      }
      
      console.log(colors.cyan.bold('\n=== LIMPIEZA COMPLETADA ===\n'));
      console.log(`🗑️ Archivos fantasma eliminados: ${deletedCount}/${phantomRecordings.length}`);
      console.log(`✅ Archivos reales conservados: ${existingRecordings.length}`);
      
      if (deletedCount === phantomRecordings.length) {
        console.log(colors.green.bold('✅ LIMPIEZA EXITOSA - Todos los archivos fantasma fueron eliminados'));
      } else {
        console.log(colors.yellow.bold('⚠️ LIMPIEZA PARCIAL - Algunos archivos no pudieron eliminarse'));
      }
      
    } else {
      console.log(colors.green.bold('✅ NO HAY ARCHIVOS FANTASMA - Todas las grabaciones tienen archivos físicos'));
    }
    
    // 5. Verificar limpieza
    console.log(colors.cyan.bold('\n🔍 Verificando limpieza...\n'));
    const remainingRecordings = await getAllRecordings();
    console.log(colors.green(`✅ Grabaciones restantes en la base de datos: ${remainingRecordings.length}`));
    
  } catch (error) {
    console.log(colors.red(`Error en limpieza: ${error.message}`));
    console.error(error);
  }
}

// Función para mostrar información de las grabaciones restantes
async function showRemainingRecordings() {
  console.log(colors.cyan.bold('\n=== GRABACIONES REALES RESTANTES ===\n'));
  
  try {
    const recordings = await getAllRecordings();
    
    if (recordings.length === 0) {
      console.log(colors.yellow('No hay grabaciones en la base de datos'));
      return;
    }
    
    // Agrupar por radio
    const byRadio = {};
    recordings.forEach(recording => {
      if (!byRadio[recording.radio_id]) {
        byRadio[recording.radio_id] = [];
      }
      byRadio[recording.radio_id].push(recording);
    });
    
    console.log(`📊 Total grabaciones: ${recordings.length}`);
    console.log(`📻 Radios con grabaciones: ${Object.keys(byRadio).length}`);
    console.log('');
    
    for (const [radioId, radioRecordings] of Object.entries(byRadio)) {
      console.log(colors.bold(`Radio ID: ${radioId} (${radioRecordings.length} grabaciones)`));
      radioRecordings.forEach(recording => {
        console.log(`   - ${recording.filename}`);
        console.log(`     Creado: ${recording.created_at || 'No especificada'}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.log(colors.red(`Error mostrando grabaciones: ${error.message}`));
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n🧹 LIMPIADOR DE ARCHIVOS FANTASMA 🧹\n'));
  
  try {
    await cleanPhantomRecordings();
    await showRemainingRecordings();
    
    console.log(colors.cyan.bold('\n=== PROCESO COMPLETADO ===\n'));
    console.log('💡 Recomendaciones:');
    console.log('1. Verificar el proceso de grabación en el VPS');
    console.log('2. Implementar verificación de existencia antes de guardar metadatos');
    console.log('3. Organizar archivos según estructura día/radio/grabaciones');
    console.log('4. Monitorear regularmente para evitar nuevos archivos fantasma');
    
  } catch (err) {
    console.log(colors.red(`Error inesperado: ${err.message}`));
    console.error(err);
  }
}

// Ejecutar
main().catch(err => {
  console.log(colors.red(`Error fatal: ${err.message}`));
  console.error(err);
});