#!/usr/bin/env node

/**
 * Script para verificar si las grabaciones "fantasmas" realmente existen en el VPS
 * 
 * Este script verifica la existencia real de los archivos que aparecen en los logs
 * pero que el usuario no puede descargar.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DE GRABACIONES FANTASMA');
console.log('=====================================\n');

// Lista de grabaciones que aparecen en los logs pero no se pueden descargar
const grabacionesFantasma = [
  'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
  'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
  'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
];

// URLs del VPS para verificar
const VPS_BASE_URL = 'http://167.250.186.26:8000';
const RECORDINGS_ENDPOINT = `${VPS_BASE_URL}/recordings`;

async function verificarGrabacionExistente(filename) {
  try {
    console.log(`📡 Verificando: ${filename}`);
    
    // Intentar acceder al archivo directamente
    const fileUrl = `${RECORDINGS_ENDPOINT}/${filename}`;
    console.log(`   URL: ${fileUrl}`);
    
    const response = await fetch(fileUrl, {
      method: 'HEAD',
      timeout: 5000
    });
    
    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      console.log(`   ✅ Archivo encontrado`);
      console.log(`   📏 Tamaño: ${contentLength || 'desconocido'} bytes`);
      console.log(`   📄 Tipo: ${contentType || 'desconocido'}`);
      
      return {
        existe: true,
        tamaño: contentLength,
        tipo: contentType,
        status: response.status
      };
    } else {
      console.log(`   ❌ Archivo no encontrado (HTTP ${response.status})`);
      return {
        existe: false,
        status: response.status,
        error: `HTTP ${response.status}`
      };
    }
    
  } catch (error) {
    console.log(`   🚫 Error al verificar: ${error.message}`);
    return {
      existe: false,
      error: error.message
    };
  }
}

async function verificarListaGrabaciones() {
  try {
    console.log('📋 Verificando lista completa de grabaciones en VPS...\n');
    
    const response = await fetch(RECORDINGS_ENDPOINT, {
      method: 'GET',
      timeout: 10000
    });
    
    if (!response.ok) {
      console.log(`❌ Error al obtener lista: HTTP ${response.status}`);
      return;
    }
    
    const grabaciones = await response.json();
    console.log(`✅ Lista obtenida: ${grabaciones.length} grabaciones encontradas\n`);
    
    // Mostrar todas las grabaciones encontradas
    console.log('📁 GRABACIONES REALES ENCONTRADAS:');
    console.log('==================================');
    
    grabaciones.forEach((grabacion, index) => {
      console.log(`${index + 1}. ${grabacion.filename}`);
      console.log(`   📅 Fecha: ${grabacion.created_at || 'desconocida'}`);
      console.log(`   📏 Tamaño: ${grabacion.size || 'desconocido'} bytes`);
      console.log('');
    });
    
    return grabaciones;
    
  } catch (error) {
    console.log(`🚫 Error al verificar lista: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('🚀 Iniciando verificación de grabaciones fantasma...\n');
  
  // 1. Verificar lista completa de grabaciones
  const grabacionesReales = await verificarListaGrabaciones();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 2. Verificar cada grabación "fantasma" específicamente
  console.log('🎭 VERIFICANDO GRABACIONES FANTASMA:\n');
  
  for (const filename of grabacionesFantasma) {
    const resultado = await verificarGrabacionExistente(filename);
    console.log('');
    
    // Buscar en la lista real
    const existeEnLista = grabacionesReales.some(g => g.filename === filename);
    
    if (resultado.existe) {
      console.log(`   ✅ CONFIRMADO: La grabación SÍ existe en el VPS`);
    } else if (existeEnLista) {
      console.log(`   ⚠️  APARECE EN LISTA pero no accesible directamente`);
    } else {
      console.log(`   👻 CONFIRMADO: Es una grabación FANTASMA (no existe)`);
    }
    
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('📊 RESUMEN:');
  console.log('===========');
  
  const fantasmasConfirmados = [];
  const grabacionesRealesConfirmadas = [];
  
  for (const filename of grabacionesFantasma) {
    const resultado = await verificarGrabacionExistente(filename);
    if (!resultado.existe) {
      fantasmasConfirmados.push(filename);
    } else {
      grabacionesRealesConfirmadas.push(filename);
    }
  }
  
  console.log(`👻 Grabaciones fantasma confirmadas: ${fantasmasConfirmados.length}`);
  console.log(`✅ Grabaciones reales confirmadas: ${grabacionesRealesConfirmadas.length}`);
  console.log(`📁 Total grabaciones en VPS: ${grabacionesReales.length}`);
  
  if (fantasmasConfirmados.length > 0) {
    console.log('\n🚨 PROBLEMA DETECTADO:');
    console.log('Las siguientes grabaciones aparecen en los logs pero NO existen:');
    fantasmasConfirmados.forEach(f => console.log(`   - ${f}`));
  }
  
  console.log('\n🔍 ANÁLISIS:');
  console.log('===========');
  console.log('1. La API /api/recordings-from-supabase está reportando grabaciones que no existen');
  console.log('2. Esto sugiere un problema en el proceso de guardado de grabaciones');
  console.log('3. Posible causa: Los archivos se crean pero fallan al guardarse completamente');
  console.log('4. Recomendación: Revisar el proceso de grabación y guardado en el VPS');
}

// Ejecutar verificación
main().catch(console.error);