#!/usr/bin/env node

/**
 * VERIFICAR: Si los archivos de grabación realmente existen en el VPS
 * Para diagnosticar si son archivos fantasma
 */

const axios = require('axios');
const colors = require('colors');

// Función para obtener grabaciones
async function getRecordings() {
  console.log(colors.cyan.bold('\n=== OBTENIENDO GRABACIONES ===\n'));
  
  try {
    const response = await axios.get('http://localhost:3000/api/recordings-from-supabase', {
      timeout: 10000
    });
    
    if (response.data && response.data.recordings) {
      return response.data.recordings;
    } else {
      console.log(colors.red('✗ No se pudieron obtener las grabaciones'));
      return [];
    }
  } catch (err) {
    console.log(colors.red(`✗ Error obteniendo grabaciones: ${err.message}`));
    return [];
  }
}

// Función para verificar si un archivo existe en el VPS
async function checkFileExists(filename) {
  const vpsUrl = `http://213.199.39.147:5000/recordings/${filename}`;
  
  try {
    console.log(`🔍 Verificando: ${filename}`);
    console.log(`   URL: ${vpsUrl}`);
    
    const response = await axios.head(vpsUrl, {
      timeout: 5000,
      validateStatus: (status) => status < 500 // Aceptar códigos 4xx también
    });
    
    if (response.status === 200) {
      const size = response.headers['content-length'] || 'Desconocido';
      const type = response.headers['content-type'] || 'Desconocido';
      console.log(`   ✅ ARCHIVO EXISTE`);
      console.log(`   📏 Tamaño: ${size} bytes`);
      console.log(`   📄 Tipo: ${type}`);
      return { exists: true, status: response.status, size, type };
    } else if (response.status === 404) {
      console.log(`   ❌ ARCHIVO NO EXISTE (404)`);
      return { exists: false, status: response.status };
    } else {
      console.log(`   ⚠️ CÓDIGO HTTP: ${response.status}`);
      return { exists: false, status: response.status };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`   🚫 VPS NO ACCESIBLE (Conexión rechazada)`);
      return { exists: false, error: 'VPS_NO_ACCESSIBLE' };
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`   ⏰ TIMEOUT - VPS muy lento o inaccesible`);
      return { exists: false, error: 'TIMEOUT' };
    } else {
      console.log(`   ❌ ERROR: ${error.message}`);
      return { exists: false, error: error.message };
    }
  }
}

// Función para probar descarga directa
async function testDirectDownload(filename) {
  const vpsUrl = `http://213.199.39.147:5000/recordings/${filename}`;
  
  try {
    console.log(`\n📥 Probando descarga directa: ${filename}`);
    
    const response = await axios.get(vpsUrl, {
      timeout: 10000,
      responseType: 'arraybuffer',
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      const size = response.data.byteLength;
      console.log(`   ✅ DESCARGA EXITOSA`);
      console.log(`   📏 Tamaño descargado: ${size} bytes`);
      return { downloadSuccess: true, size };
    } else {
      console.log(`   ❌ DESCARGA FALLÓ - Código: ${response.status}`);
      return { downloadSuccess: false, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ ERROR EN DESCARGA: ${error.message}`);
    return { downloadSuccess: false, error: error.message };
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== DIAGNÓSTICO: ARCHIVOS FANTASMA EN VPS ===\n'));
  
  try {
    // 1. Obtener grabaciones
    const recordings = await getRecordings();
    
    if (recordings.length === 0) {
      console.log(colors.yellow('⚠️ No hay grabaciones para verificar'));
      return;
    }
    
    console.log(colors.green(`✓ Encontradas ${recordings.length} grabaciones para verificar\n`));
    
    // 2. Verificar cada archivo
    const results = [];
    
    for (const recording of recordings) {
      console.log(colors.bold(`\n--- GRABACIÓN ${results.length + 1} ---`));
      console.log(`📁 Archivo: ${recording.filename}`);
      console.log(`🎵 Radio: ${recording.radio_name}`);
      console.log(`📅 Fecha: ${recording.recorded_at}`);
      console.log(`🔗 URL: ${recording.download_url}`);
      
      const result = await checkFileExists(recording.filename);
      results.push({
        filename: recording.filename,
        radio_name: recording.radio_name,
        download_url: recording.download_url,
        ...result
      });
      
      // Probar descarga directa para archivos que parecen existir
      if (result.exists && result.status === 200) {
        await testDirectDownload(recording.filename);
      }
      
      console.log(''); // Línea en blanco para separar
    }
    
    // 3. Resumen final
    console.log(colors.cyan.bold('\n=== RESUMEN FINAL ===\n'));
    
    const existing = results.filter(r => r.exists).length;
    const notExisting = results.filter(r => !r.exists).length;
    const errors = results.filter(r => r.error).length;
    
    console.log(`📊 Total grabaciones: ${results.length}`);
    console.log(`✅ Archivos que existen: ${existing}`);
    console.log(`❌ Archivos que NO existen: ${notExisting}`);
    console.log(`🚫 Errores de conexión: ${errors}`);
    
    if (notExisting > 0) {
      console.log(colors.yellow('\n⚠️ ARCHIVOS FANTASMA DETECTADOS'));
      console.log('Estos archivos tienen metadatos pero no existen físicamente:');
      
      results.filter(r => !r.exists).forEach(r => {
        console.log(`   - ${r.filename} (${r.radio_name})`);
        if (r.error) {
          console.log(`     Error: ${r.error}`);
        }
      });
      
      console.log(colors.cyan.bold('\n🔧 SOLUCIONES RECOMENDADAS:'));
      console.log('1. Verificar que el servicio de grabación esté funcionando en el VPS');
      console.log('2. Limpiar metadatos de archivos que no existen');
      console.log('3. Implementar verificación de existencia antes de mostrar URLs');
      console.log('4. Organizar archivos físicamente según la estructura día/radio/grabaciones');
    } else {
      console.log(colors.green('\n✅ Todos los archivos existen y son accesibles'));
    }
    
    console.log(colors.cyan.bold('\n=== FIN DEL DIAGNÓSTICO ===\n'));
    
  } catch (err) {
    console.log(colors.red(`Error en diagnóstico: ${err.message}`));
    console.error(err);
  }
}

// Ejecutar
main().catch(err => {
  console.log(colors.red(`Error inesperado: ${err.message}`));
  console.error(err);
});