#!/usr/bin/env node

/**
 * Script para filtrar grabaciones del VPS que realmente existen
 * Elimina de la lista del VPS las grabaciones que no tienen archivos físicos
 */

const VPS_API_URL = 'http://167.250.186.26:5000';

async function verificarExistenciaArchivoVPS(filename) {
  try {
    const response = await fetch(`${VPS_API_URL}/recordings/${filename}`, {
      method: 'HEAD'
    });
    
    const existe = response.ok && response.status === 200;
    console.log(`  ${existe ? '✅' : '❌'} ${filename}: ${existe ? 'EXISTE' : 'NO EXISTE'}`);
    
    return existe;
  } catch (error) {
    console.log(`  ❌ ${filename}: ERROR - ${error.message}`);
    return false;
  }
}

async function obtenerGrabacionesVPS() {
  try {
    console.log('📡 Obteniendo lista de grabaciones del VPS...');
    
    const response = await fetch(`${VPS_API_URL}/api/recordings`);
    
    if (!response.ok) {
      throw new Error(`Error del VPS: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Total de grabaciones en VPS: ${data.recordings?.length || 0}`);
    
    return data.recordings || [];
  } catch (error) {
    console.error('❌ Error obteniendo grabaciones del VPS:', error);
    return [];
  }
}

async function filtrarGrabacionesReales() {
  console.log('🔍 INICIANDO FILTRADO DE GRABACIONES REALES');
  console.log('=' * 50);
  
  // Obtener todas las grabaciones del VPS
  const todasGrabaciones = await obtenerGrabacionesVPS();
  
  if (todasGrabaciones.length === 0) {
    console.log('⚠️ No hay grabaciones en el VPS');
    return;
  }
  
  console.log(`\n🔍 Verificando existencia de ${todasGrabaciones.length} archivos...`);
  console.log('=' * 50);
  
  const grabacionesReales = [];
  const grabacionesFantasma = [];
  
  // Verificar cada archivo
  for (const recording of todasGrabaciones) {
    const filename = recording.filename;
    const existe = await verificarExistenciaArchivoVPS(filename);
    
    if (existe) {
      grabacionesReales.push(recording);
    } else {
      grabacionesFantasma.push(recording);
    }
    
    // Pausa pequeña para no sobrecargar el VPS
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 RESUMEN DEL FILTRADO');
  console.log('=' * 50);
  console.log(`✅ Grabaciones reales: ${grabacionesReales.length}`);
  console.log(`❌ Grabaciones fantasma: ${grabacionesFantasma.length}`);
  console.log(`📁 Total original: ${todasGrabaciones.length}`);
  
  if (grabacionesFantasma.length > 0) {
    console.log('\n🚫 GRABACIONES FANTASMA DETECTADAS:');
    console.log('=' * 50);
    grabacionesFantasma.forEach((recording, index) => {
      console.log(`${index + 1}. ${recording.filename}`);
    });
    
    console.log('\n💡 SOLUCIONES POSIBLES:');
    console.log('=' * 50);
    console.log('1. 🔧 Modificar API del VPS para filtrar archivos inexistentes');
    console.log('2. 🗑️ Eliminar registros fantasma del VPS directamente');
    console.log('3. 🛡️ Filtrar en el frontend solo grabaciones que existen');
    console.log('4. 🔄 Sincronizar lista del VPS con archivos físicos');
    
  } else {
    console.log('\n✅ Todas las grabaciones del VPS existen físicamente');
  }
  
  if (grabacionesReales.length > 0) {
    console.log('\n✅ GRABACIONES REALES DISPONIBLES:');
    console.log('=' * 50);
    grabacionesReales.forEach((recording, index) => {
      console.log(`${index + 1}. ${recording.filename}`);
    });
  }
  
  return {
    totalOriginal: todasGrabaciones.length,
    grabacionesReales,
    grabacionesFantasma
  };
}

// Función para generar script de limpieza del VPS
function generarScriptLimpiezaVPS(grabacionesFantasma) {
  if (grabacionesFantasma.length === 0) {
    return null;
  }
  
  const filenames = grabacionesFantasma.map(r => r.filename);
  
  return `
// SCRIPT PARA LIMPIAR VPS
// Ejecutar en el servidor VPS para eliminar grabaciones fantasma

const fs = require('fs');
const path = require('path');

const GRABACIONES_FANTASMA = ${JSON.stringify(filenames, null, 2)};

function eliminarGrabacionesFantasma() {
  console.log('🗑️ Eliminando grabaciones fantasma del VPS...');
  
  GRABACIONES_FANTASMA.forEach(filename => {
    const filePath = path.join('/path/to/recordings', filename);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('✅ Eliminado:', filename);
      } catch (error) {
        console.log('❌ Error eliminando:', filename, error.message);
      }
    } else {
      console.log('⚠️ Archivo no encontrado:', filename);
    }
  });
  
  console.log('🎉 Limpieza completada');
}

eliminarGrabacionesFantasma();
`;
}

// Ejecutar el filtrado
if (require.main === module) {
  filtrarGrabacionesReales()
    .then(resultado => {
      if (resultado && resultado.grabacionesFantasma.length > 0) {
        const script = generarScriptLimpiezaVPS(resultado.grabacionesFantasma);
        if (script) {
          console.log('\n📝 SCRIPT DE LIMPIEZA GENERADO:');
          console.log('=' * 50);
          console.log(script);
        }
      }
    })
    .catch(error => {
      console.error('❌ Error durante el filtrado:', error);
      process.exit(1);
    });
}

module.exports = {
  filtrarGrabacionesReales,
  verificarExistenciaArchivoVPS,
  generarScriptLimpiezaVPS
};