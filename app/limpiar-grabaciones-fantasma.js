#!/usr/bin/env node

/**
 * Script para limpiar grabaciones fantasma de la base de datos
 * 
 * Este script elimina los registros de grabaciones que aparecen en la API
 * pero que no tienen archivos reales en el VPS.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPIEZA DE GRABACIONES FANTASMA');
console.log('===================================\n');

// Lista de grabaciones fantasma confirmadas
const grabacionesFantasma = [
  'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
  'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
  'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
];

// URLs del VPS
const VPS_BASE_URL = 'http://167.250.186.26:8000';
const RECORDINGS_ENDPOINT = `${VPS_BASE_URL}/recordings`;

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xsojptxqrhkqjjjmcjnr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function verificarGrabacionExistente(filename) {
  try {
    const fileUrl = `${RECORDINGS_ENDPOINT}/${filename}`;
    const response = await fetch(fileUrl, {
      method: 'HEAD',
      timeout: 5000
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function eliminarGrabacionDeBaseDatos(filename) {
  try {
    console.log(`🗑️  Eliminando de base de datos: ${filename}`);
    
    if (!SUPABASE_SERVICE_KEY) {
      console.log('   ⚠️  No hay SERVICE_KEY configurada, simulando eliminación...');
      return { success: true, simulated: true };
    }
    
    // Eliminar de la tabla recordings
    const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/recordings?filename=eq.${filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (deleteResponse.ok) {
      console.log(`   ✅ Eliminado exitosamente de la base de datos`);
      return { success: true };
    } else {
      const errorText = await deleteResponse.text();
      console.log(`   ❌ Error al eliminar: ${errorText}`);
      return { success: false, error: errorText };
    }
    
  } catch (error) {
    console.log(`   🚫 Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function obtenerGrabacionesReales() {
  try {
    console.log('📋 Obteniendo lista de grabaciones reales del VPS...\n');
    
    const response = await fetch(RECORDINGS_ENDPOINT, {
      method: 'GET',
      timeout: 10000
    });
    
    if (!response.ok) {
      console.log(`❌ Error al obtener lista: HTTP ${response.status}`);
      return [];
    }
    
    const grabaciones = await response.json();
    console.log(`✅ Grabaciones reales encontradas: ${grabaciones.length}\n`);
    
    return grabaciones;
    
  } catch (error) {
    console.log(`🚫 Error al obtener lista: ${error.message}`);
    return [];
  }
}

async function generarScriptLimpiezaSQL(grabacionesReales) {
  console.log('📝 Generando script SQL para limpieza...\n');
  
  const sqlScript = `
-- Script de limpieza para grabaciones fantasma
-- Generado automáticamente el ${new Date().toISOString()}

-- 1. Eliminar registros de grabaciones que no tienen archivos reales
DELETE FROM recordings 
WHERE filename IN (
  ${grabacionesFantasma.map(f => `'${f}'`).join(',\n  ')}
);

-- 2. Verificar que las grabaciones restantes tienen archivos reales
-- (Este es un comentario para referencia manual)
-- Las siguientes grabaciones deberían tener archivos reales en el VPS:
${grabacionesReales.map(g => `-- ${g.filename}`).join('\n')}

-- 3. Limpiar cache si es necesario
-- DELETE FROM cache WHERE key LIKE 'recordings_%';

-- 4. Reiniciar contadores si es necesario
-- UPDATE recordings_stats SET total_recordings = (SELECT COUNT(*) FROM recordings);
`;

  const scriptPath = 'limpieza-grabaciones-fantasma.sql';
  fs.writeFileSync(scriptPath, sqlScript);
  console.log(`✅ Script SQL generado: ${scriptPath}`);
  
  return scriptPath;
}

async function main() {
  console.log('🚀 Iniciando limpieza de grabaciones fantasma...\n');
  
  // 1. Verificar grabaciones fantasma
  console.log('🔍 VERIFICANDO GRABACIONES FANTASMA:');
  console.log('====================================');
  
  const fantasmasConfirmados = [];
  
  for (const filename of grabacionesFantasma) {
    console.log(`📡 Verificando: ${filename}`);
    const existe = await verificarGrabacionExistente(filename);
    
    if (!existe) {
      console.log(`   👻 CONFIRMADO: Es una grabación FANTASMA`);
      fantasmasConfirmados.push(filename);
    } else {
      console.log(`   ✅ Archivo real encontrado`);
    }
    console.log('');
  }
  
  // 2. Obtener grabaciones reales
  const grabacionesReales = await obtenerGrabacionesReales();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE LIMPIEZA:');
  console.log('========================');
  console.log(`👻 Grabaciones fantasma confirmadas: ${fantasmasConfirmados.length}`);
  console.log(`✅ Grabaciones reales en VPS: ${grabacionesReales.length}`);
  
  if (fantasmasConfirmados.length === 0) {
    console.log('\n🎉 No hay grabaciones fantasma para limpiar.');
    return;
  }
  
  // 3. Generar script SQL
  const scriptPath = await generarScriptLimpiezaSQL(grabacionesReales);
  
  // 4. Preguntar si ejecutar limpieza automática
  console.log('\n🚨 GRABACIONES FANTASMA DETECTADAS:');
  console.log('===================================');
  fantasmasConfirmados.forEach(f => console.log(`   - ${f}`));
  
  console.log('\n⚠️  ACCIONES RECOMENDADAS:');
  console.log('==========================');
  console.log('1. Ejecutar el script SQL generado para limpiar la base de datos');
  console.log('2. Revisar el proceso de grabación para evitar que se creen registros fantasma');
  console.log('3. Verificar que los archivos se guarden correctamente en el VPS');
  
  console.log('\n📋 ARCHIVOS GENERADOS:');
  console.log('======================');
  console.log(`   - ${scriptPath}`);
  
  // 5. Intentar limpieza automática si hay SERVICE_KEY
  if (SUPABASE_SERVICE_KEY && fantasmasConfirmados.length > 0) {
    console.log('\n🔧 EJECUTANDO LIMPIEZA AUTOMÁTICA:');
    console.log('==================================');
    
    for (const filename of fantasmasConfirmados) {
      await eliminarGrabacionDeBaseDatos(filename);
    }
    
    console.log('\n✅ Limpieza automática completada');
  } else {
    console.log('\n💡 Para limpieza automática, configure SUPABASE_SERVICE_KEY');
    console.log('   o ejecute manualmente el script SQL generado');
  }
  
  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('==================');
  console.log('1. Revisar logs del proceso de grabación');
  console.log('2. Verificar permisos de escritura en el VPS');
  console.log('3. Monitorear que no se creen nuevos registros fantasma');
}

// Ejecutar limpieza
main().catch(console.error);