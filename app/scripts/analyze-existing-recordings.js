#!/usr/bin/env node

/**
 * Script para analizar las 22 grabaciones existentes y entender cómo se crearon
 * 
 * Busca patrones en:
 * 1. Nombres de archivo (formato, radio_id, timestamps)
 * 2. Fechas y horas de creación
 * 3. Tamaños de archivos
 * 4. Intervalos entre grabaciones
 */

const VPS_API_BASE = 'http://213.199.39.147:5000/api';

console.log('🔍 ANALIZANDO LAS 22 GRABACIONES EXISTENTES');
console.log('==========================================\n');

async function analyzeRecordings() {
  console.log('1️⃣ OBTENIENDO LISTA COMPLETA DE GRABACIONES');
  console.log(`   URL: ${VPS_API_BASE}/recordings`);
  
  try {
    const response = await fetch(`${VPS_API_BASE}/recordings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    if (!response.ok) {
      console.log(`   ❌ Error HTTP: ${response.status}`);
      return;
    }

    const data = await response.json();
    
    if (!data.recordings || data.recordings.length === 0) {
      console.log('   ❌ No hay grabaciones para analizar');
      return;
    }

    console.log(`   ✅ Encontradas ${data.recordings.length} grabaciones\n`);
    
    // Análisis detallado
    await analyzeFilenamePatterns(data.recordings);
    await analyzeTimestamps(data.recordings);
    await analyzeRecordingIntervals(data.recordings);
    await identifyRadioAndSource(data.recordings);
    
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
  }
}

function analyzeFilenamePatterns(recordings) {
  console.log('\n2️⃣ ANÁLISIS DE PATRONES EN NOMBRES DE ARCHIVO');
  console.log('   ===========================================');
  
  recordings.forEach((rec, i) => {
    console.log(`\n   ${i + 1}. ${rec.filename}`);
    
    // Parsear el nombre del archivo
    // Formato: radio-1_05c3585e-0cf3-45f9-b0ee-d1950c8b2f9b_block21_20251127_204008.mp3
    const parts = rec.filename.split('_');
    
    if (parts.length >= 4) {
      const radioPart = parts[0]; // radio-1
      const uuidPart = parts[1]; // 05c3585e-0cf3-45f9-b0ee-d1950c8b2f9b
      const blockPart = parts[2]; // block21
      const datePart = parts[3]; // 20251127
      const timePart = parts[4]?.replace('.mp3', ''); // 204008
      
      console.log(`      📻 Radio: ${radioPart}`);
      console.log(`      🔑 UUID: ${uuidPart}`);
      console.log(`      📦 Block: ${blockPart}`);
      console.log(`      📅 Fecha: ${datePart}`);
      console.log(`      🕐 Hora: ${timePart}`);
    }
    
    console.log(`      📏 Tamaño: ${(rec.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`      📂 Path: ${rec.path}`);
  });
}

function analyzeTimestamps(recordings) {
  console.log('\n\n3️⃣ ANÁLISIS DE TIMESTAMPS');
  console.log('   =======================');
  
  const timestamps = recordings.map(rec => ({
    filename: rec.filename,
    created_at: rec.created_at,
    parsed: new Date(rec.created_at)
  }));
  
  // Ordenar por fecha
  timestamps.sort((a, b) => a.parsed - b.parsed);
  
  console.log('\n   📋 ORDEN CRONOLÓGICO:');
  timestamps.forEach((ts, i) => {
    console.log(`   ${i + 1}. ${ts.parsed.toISOString()} - ${ts.filename}`);
  });
  
  // Identificar primera y última grabación
  const first = timestamps[0];
  const last = timestamps[timestamps.length - 1];
  
  console.log(`\n   🎯 Primera grabación: ${first.parsed.toISOString()}`);
  console.log(`   🎯 Última grabación: ${last.parsed.toISOString()}`);
}

function analyzeRecordingIntervals(recordings) {
  console.log('\n\n4️⃣ ANÁLISIS DE INTERVALOS ENTRE GRABACIONES');
  console.log('   ========================================');
  
  const sorted = [...recordings].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );
  
  console.log('\n   ⏱️  INTERVALOS (minutos):');
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].created_at);
    const curr = new Date(sorted[i].created_at);
    const diffMinutes = (curr - prev) / 1000 / 60;
    
    console.log(`   ${i}. Entre ${sorted[i - 1].filename.split('_')[2]} y ${sorted[i].filename.split('_')[2]}: ${diffMinutes.toFixed(1)} min`);
  }
  
  // Calcular intervalo promedio
  const totalDiff = new Date(sorted[sorted.length - 1].created_at) - new Date(sorted[0].created_at);
  const avgInterval = totalDiff / 1000 / 60 / (sorted.length - 1);
  
  console.log(`\n   📊 Intervalo promedio: ${avgInterval.toFixed(1)} minutos`);
}

function identifyRadioAndSource(recordings) {
  console.log('\n\n5️⃣ IDENTIFICACIÓN DE RADIO Y FUENTE');
  console.log('   =================================');
  
  // Extraer radio_id de los nombres
  const radioIds = new Set();
  const uuids = new Set();
  
  recordings.forEach(rec => {
    const parts = rec.filename.split('_');
    if (parts.length >= 2) {
      radioIds.add(parts[0]); // radio-1
      uuids.add(parts[1]); // UUID
    }
  });
  
  console.log(`\n   📻 Radio IDs encontrados: ${Array.from(radioIds).join(', ')}`);
  console.log(`   🔑 UUIDs encontrados: ${Array.from(uuids).join(', ')}`);
  
  // Buscar el UUID en Supabase para identificar la radio
  console.log(`\n   💡 Para identificar la radio real, ejecuta:`);
  console.log(`      supabase.from('radios').select('*').eq('id', '${Array.from(uuids)[0]}')`);
}

// Ejecutar análisis
analyzeRecordings().catch(console.error);