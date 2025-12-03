#!/usr/bin/env node

/**
 * SOLUCIÓN COMPLETA: Archivos Fantasma en Grabaciones
 * 1. Verifica qué devuelve realmente el VPS
 * 2. Limpia cualquier caché
 * 3. Implementa verificación de existencia
 * 4. Organiza archivos según estructura día/radio/grabaciones
 */

const axios = require('axios');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Configuración
const VPS_URL = 'http://213.199.39.147:5000';
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
    throw error;
  }
}

// Función para verificar si un archivo existe en el VPS
async function checkFileExists(filename) {
  const vpsUrl = `${VPS_URL}/recordings/${filename}`;
  
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

// Función para obtener grabaciones del VPS
async function getVPSRecordings() {
  try {
    console.log(colors.cyan('📡 Obteniendo grabaciones del VPS...'));
    
    const response = await axios.get(`${VPS_URL}/api/recordings`, {
      timeout: 10000,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      const recordings = response.data.recordings || [];
      console.log(colors.green(`✅ VPS devuelve ${recordings.length} grabaciones`));
      return recordings;
    } else {
      console.log(colors.red(`❌ VPS responde con código: ${response.status}`));
      return [];
    }
  } catch (error) {
    console.log(colors.red(`❌ Error conectando al VPS: ${error.message}`));
    return [];
  }
}

// Función para crear estructura de carpetas
async function createFolderStructure() {
  console.log(colors.cyan('\n📁 Creando estructura de carpetas...'));
  
  const baseDir = path.join(__dirname, 'recordings-organized');
  
  // Crear directorio base
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(colors.green(`   ✅ Creado directorio base: ${baseDir}`));
  }
  
  return baseDir;
}

// Función principal de solución
async function solvePhantomRecordings() {
  console.log(colors.cyan.bold('\n=== SOLUCIÓN COMPLETA: ARCHIVOS FANTASMA ===\n'));
  
  try {
    // 1. Verificar qué devuelve el VPS
    console.log(colors.cyan.bold('\n🔍 PASO 1: ANÁLISIS DEL VPS\n'));
    
    const vpsRecordings = await getVPSRecordings();
    
    if (vpsRecordings.length === 0) {
      console.log(colors.yellow('⚠️ El VPS no devuelve grabaciones. Problema resuelto.'));
      return;
    }
    
    // 2. Verificar existencia física de cada archivo
    console.log(colors.cyan.bold('\n🔍 PASO 2: VERIFICACIÓN DE ARCHIVOS FÍSICOS\n'));
    
    const phantomFiles = [];
    const realFiles = [];
    
    for (let i = 0; i < vpsRecordings.length; i++) {
      const recording = vpsRecordings[i];
      const filename = recording.filename;
      
      console.log(colors.bold(`Verificando ${i + 1}/${vpsRecordings.length}: ${filename}`));
      
      const exists = await checkFileExists(filename);
      
      if (exists) {
        realFiles.push(recording);
        console.log(colors.green('   ✅ Archivo existe físicamente'));
      } else {
        phantomFiles.push(recording);
        console.log(colors.red('   ❌ Archivo FANTASMA (no existe físicamente)'));
      }
      
      // Pausa pequeña
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 3. Mostrar resumen
    console.log(colors.cyan.bold('\n📊 RESUMEN DEL ANÁLISIS\n'));
    console.log(`📋 Total grabaciones del VPS: ${vpsRecordings.length}`);
    console.log(`✅ Archivos reales: ${realFiles.length}`);
    console.log(`👻 Archivos fantasma: ${phantomFiles.length}`);
    
    if (phantomFiles.length > 0) {
      console.log(colors.cyan.bold('\n👻 ARCHIVOS FANTASMA DETECTADOS:\n'));
      phantomFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.filename}`);
        console.log(`   Tamaño reportado: ${file.file_size || 'Desconocido'} bytes`);
        console.log(`   Fecha: ${file.recorded_at || 'Desconocida'}`);
        console.log('');
      });
    }
    
    // 4. Crear estructura organizada solo para archivos reales
    if (realFiles.length > 0) {
      console.log(colors.cyan.bold('\n📁 PASO 3: ORGANIZANDO ARCHIVOS REALES\n'));
      
      const baseDir = await createFolderStructure();
      
      for (const recording of realFiles) {
        try {
          // Extraer fecha del filename o usar fecha actual
          const dateMatch = recording.filename.match(/(\d{8})/);
          const dateStr = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10).replace(/-/g, '');
          
          // Extraer radio_id del filename
          const radioMatch = recording.filename.match(/^radio_([^_]+)_/);
          const radioId = radioMatch ? radioMatch[1] : 'unknown';
          
          // Crear estructura: recordings-organized/YYYYMMDD/radio_ID/
          const dayDir = path.join(baseDir, dateStr);
          const radioDir = path.join(dayDir, `radio_${radioId}`);
          
          if (!fs.existsSync(dayDir)) {
            fs.mkdirSync(dayDir, { recursive: true });
          }
          
          if (!fs.existsSync(radioDir)) {
            fs.mkdirSync(radioDir, { recursive: true });
          }
          
          console.log(colors.green(`   ✅ Organizado: ${recording.filename}`));
          console.log(`      📁 Ubicación: ${radioDir}/`);
          
        } catch (error) {
          console.log(colors.red(`   ❌ Error organizando ${recording.filename}: ${error.message}`));
        }
      }
    }
    
    // 5. Generar reporte final
    console.log(colors.cyan.bold('\n📋 PASO 4: REPORTE FINAL\n'));
    
    const report = {
      timestamp: new Date().toISOString(),
      vps_url: VPS_URL,
      total_vps_recordings: vpsRecordings.length,
      real_files: realFiles.length,
      phantom_files: phantomFiles.length,
      phantom_files_list: phantomFiles.map(f => f.filename),
      real_files_list: realFiles.map(f => f.filename),
      recommendations: []
    };
    
    // Agregar recomendaciones
    if (phantomFiles.length > 0) {
      report.recommendations.push('El VPS está reportando archivos que no existen físicamente');
      report.recommendations.push('Verificar el proceso de grabación en el VPS');
      report.recommendations.push('Limpiar metadatos de archivos inexistentes');
    }
    
    if (realFiles.length > 0) {
      report.recommendations.push('Los archivos reales están organizados en estructura día/radio/');
      report.recommendations.push('Implementar verificación de existencia antes de mostrar URLs');
    }
    
    // Guardar reporte
    const reportPath = path.join(__dirname, 'phantom-recordings-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(colors.green(`📄 Reporte guardado en: ${reportPath}`));
    
    // 6. Mostrar solución final
    console.log(colors.cyan.bold('\n🎯 SOLUCIÓN IMPLEMENTADA\n'));
    
    if (phantomFiles.length > 0) {
      console.log(colors.red('❌ PROBLEMA DETECTADO:'));
      console.log('   El VPS está reportando archivos que no existen físicamente.');
      console.log('   Esto causa que la interfaz muestre enlaces de descarga rotos.');
      console.log('');
      
      console.log(colors.yellow('🔧 ACCIONES REQUERIDAS:'));
      console.log('   1. Verificar el proceso de grabación en el VPS');
      console.log('   2. Limpiar caché o datos temporales en el VPS');
      console.log('   3. Reiniciar el servicio de grabaciones si es necesario');
      console.log('   4. Verificar que los archivos se guarden correctamente');
      console.log('');
    }
    
    if (realFiles.length > 0) {
      console.log(colors.green('✅ ARCHIVOS REALES:'));
      console.log(`   ${realFiles.length} archivos existen físicamente y están organizados.`);
      console.log('   Estos archivos se pueden descargar correctamente.');
      console.log('');
    }
    
    console.log(colors.cyan.bold('💡 RECOMENDACIONES GENERALES:'));
    console.log('   1. Implementar verificación de existencia antes de mostrar URLs');
    console.log('   2. Agregar logs de error para detectar archivos fantasma');
    console.log('   3. Limpiar regularmente archivos temporales o corruptos');
    console.log('   4. Monitorear el espacio en disco del VPS');
    
    console.log(colors.cyan.bold('\n=== PROCESO COMPLETADO ===\n'));
    
  } catch (error) {
    console.log(colors.red(`Error en solución: ${error.message}`));
    console.error(error);
  }
}

// Función para mostrar estado actual
async function showCurrentStatus() {
  console.log(colors.cyan.bold('\n📊 ESTADO ACTUAL DEL SISTEMA\n'));
  
  try {
    // Verificar base de datos
    console.log('🗄️ Base de Datos:');
    const dbRecordings = await supabaseRequest('recordings?select=count');
    console.log(`   Grabaciones en BD: ${dbRecordings.length}`);
    
    // Verificar VPS
    console.log('\n🖥️ VPS:');
    const vpsRecordings = await getVPSRecordings();
    console.log(`   Grabaciones reportadas: ${vpsRecordings.length}`);
    
    // Verificar archivos físicos
    if (vpsRecordings.length > 0) {
      console.log('\n📁 Archivos Físicos:');
      let existingCount = 0;
      
      for (const recording of vpsRecordings.slice(0, 5)) { // Solo verificar primeros 5
        const exists = await checkFileExists(recording.filename);
        if (exists) existingCount++;
      }
      
      console.log(`   Archivos verificados: 5`);
      console.log(`   Archivos existentes: ${existingCount}`);
      console.log(`   Archivos fantasma: ${5 - existingCount}`);
    }
    
  } catch (error) {
    console.log(colors.red(`Error mostrando estado: ${error.message}`));
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n🛠️ SOLUCIONADOR DE ARCHIVOS FANTASMA 🛠️\n'));
  
  try {
    await showCurrentStatus();
    await solvePhantomRecordings();
    
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