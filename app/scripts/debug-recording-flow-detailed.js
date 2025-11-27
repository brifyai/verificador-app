#!/usr/bin/env node

// Diagnóstico detallado del flujo de grabaciones
const axios = require('axios');

const VPS_URL = 'http://213.199.39.147:5000/api';

console.log('🔍 Diagnóstico Detallado del Flujo de Grabaciones');
console.log('=================================================\n');

async function debugRecordingFlow() {
  try {
    console.log('📋 ANALIZANDO FLUJO COMPLETO DE GRABACIONES...\n');

    // 1. Verificar grabaciones activas (funciona en ambas páginas)
    console.log('1️⃣ VERIFICANDO GRABACIONES ACTIVAS (funciona en ambas páginas):');
    const activeResponse = await axios.get(`${VPS_URL}/active-recordings`, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    
    console.log('   ✅ Grabaciones activas:', JSON.stringify(activeResponse.data, null, 2));
    
    // 2. Verificar grabaciones finalizadas (el problema está aquí)
    console.log('\n2️⃣ VERIFICANDO GRABACIONES FINALIZADAS (problema identificado):');
    const recordingsResponse = await axios.get(`${VPS_URL}/recordings`, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    
    console.log('   ✅ Todas las grabaciones:', JSON.stringify(recordingsResponse.data, null, 2));
    
    if (recordingsResponse.data.recordings && recordingsResponse.data.recordings.length > 0) {
      console.log('\n   📊 ANÁLISIS DE LAS GRABACIONES:');
      recordingsResponse.data.recordings.forEach((recording, index) => {
        console.log(`\n   📁 Grabación ${index + 1}:`);
        console.log(`      📛 Nombre: ${recording.filename}`);
        console.log(`      📅 Fecha: ${recording.created_at}`);
        console.log(`      📏 Tamaño: ${(recording.size / 1024 / 1024).toFixed(2)} MB`);
        
        // VERIFICAR SI CONTIENE IDENTIFICADOR DE RADIO
        const radioId = 'radio-1'; // ID de Bio-Bio Santiago
        const radioName = 'Bio-Bio Santiago';
        const containsId = recording.filename.includes(radioId);
        const containsName = recording.filename.includes(radioName.replace(/\s+/g, '_'));
        
        console.log(`      🔍 Contiene ID '${radioId}': ${containsId ? '✅ SÍ' : '❌ NO'}`);
        console.log(`      🔍 Contiene nombre '${radioName}': ${containsName ? '✅ SÍ' : '❌ NO'}`);
      });
    } else {
      console.log('   📭 No hay grabaciones finalizadas');
    }

    // 3. Verificar radios disponibles
    console.log('\n3️⃣ VERIFICANDO RADIOS DISPONIBLES:');
    const radiosResponse = await axios.get(`${VPS_URL}/radios`, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    
    console.log('   ✅ Radios disponibles:', JSON.stringify(radiosResponse.data, null, 2));

    // 4. Simular el filtrado que hace RadioRecording.tsx
    console.log('\n4️⃣ SIMULANDO FILTRADO DE RadioRecording.tsx:');
    if (recordingsResponse.data.recordings) {
      const radioId = 'radio-1';
      const radioName = 'Bio-Bio Santiago';
      
      const filteredRecordings = recordingsResponse.data.recordings.filter((recording) => 
        recording.filename.includes(radioId) || recording.filename.includes(radioName.replace(/\s+/g, '_'))
      );
      
      console.log(`   🔍 Grabaciones filtradas para ${radioName} (${radioId}): ${filteredRecordings.length}`);
      console.log('   📋 Grabaciones filtradas:', JSON.stringify(filteredRecordings, null, 2));
      
      if (filteredRecordings.length === 0) {
        console.log('   ⚠️  PROBLEMA IDENTIFICADO: No hay coincidencias en los nombres de archivo');
        console.log('   💡 SOLUCIÓN: Verificar el formato real de los nombres de archivo');
      }
    }

    // 5. Verificar formato de nombres de archivo
    console.log('\n5️⃣ ANÁLISIS DEL FORMATO DE NOMBRES DE ARCHIVO:');
    if (recordingsResponse.data.recordings) {
      console.log('   📋 Todos los nombres de archivo:');
      recordingsResponse.data.recordings.forEach((recording, index) => {
        console.log(`      ${index + 1}. "${recording.filename}"`);
        
        // Análisis detallado del nombre
        const analysis = analyzeFilename(recording.filename);
        console.log(`         📊 Análisis: ${analysis}`);
      });
    }

    // 6. Verificar el flujo completo
    console.log('\n6️⃣ FLUJO COMPLETO IDENTIFICADO:');
    console.log('   📍 PASO 1: Usuario inicia grabación en /radios');
    console.log('   📍 PASO 2: RadioRecording.tsx llama a recordingService.startRecording()');
    console.log('   📍 PASO 3: El VPS crea archivo y devuelve recording_id');
    console.log('   📍 PASO 4: RadioRecording.tsx se suscribe a RecordingStateManager');
    console.log('   📍 PASO 5: RecordingStateManager actualiza cada 10 segundos desde /active-recordings');
    console.log('   📍 PASO 6: Cuando termina, el VPS mueve el archivo a /recordings');
    console.log('   📍 PASO 7: RadioRecording.tsx filtra por filename.includes(radio.id) o filename.includes(radioName)');
    console.log('   ❌ PROBLEMA: El filtrado no encuentra coincidencias');

    // 7. Solución propuesta
    console.log('\n7️⃣ SOLUCIÓN PROPUESTA:');
    console.log('   ✅ Opción 1: Modificar el formato de nombres de archivo del VPS');
    console.log('   ✅ Opción 2: Cambiar la lógica de filtrado en RadioRecording.tsx');
    console.log('   ✅ Opción 3: Usar un identificador más confiable (como recording_id)');
    console.log('   ✅ Opción 4: Implementar categorización por radio en el servidor');

  } catch (error) {
    console.log('❌ Error durante el diagnóstico:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️  El servidor VPS no está respondiendo');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   ⏰ Timeout al conectar con el servidor');
    }
  }
}

function analyzeFilename(filename) {
  const patterns = [];
  
  // Buscar patrones comunes
  if (filename.includes('radio')) patterns.push('contiene "radio"');
  if (filename.includes('bio')) patterns.push('contiene "bio"');
  if (filename.includes('santiago')) patterns.push('contiene "santiago"');
  if (filename.includes('2025')) patterns.push('contiene año');
  if (filename.includes('2024')) patterns.push('contiene año');
  if (filename.includes('.mp3')) patterns.push('formato MP3');
  if (filename.includes('.wav')) patterns.push('formato WAV');
  if (filename.includes('_')) patterns.push('usa guiones bajos');
  if (filename.includes('-')) patterns.push('usa guiones');
  
  return patterns.length > 0 ? patterns.join(', ') : 'sin patrones identificados';
}

// Ejecutar diagnóstico
debugRecordingFlow().catch(console.error);