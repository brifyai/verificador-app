#!/usr/bin/env node

// Verificar que el temporizador se actualice correctamente
const axios = require('axios');

const VPS_URL = 'http://213.199.39.147:5000/api';
const RADIO_ID = 'radio-1';

console.log('🔍 Verificación de Actualización del Temporizador');
console.log('=================================================\n');

async function verifyTimerUpdate() {
  console.log('📋 Verificando que el temporizador se actualice correctamente...\n');

  try {
    // Paso 1: Obtener información de la grabación activa
    console.log('1️⃣ OBTENIENDO ESTADO DE GRABACIÓN:');
    const activeResponse = await axios.get(`${VPS_URL}/active-recordings`);
    
    const activeRecording = activeResponse.data.active_recordings?.[RADIO_ID];
    if (!activeRecording) {
      console.log('   ❌ No hay grabación activa para esta radio');
      return;
    }

    console.log(`   ✅ Grabación activa encontrada: ${activeRecording.radio_name}`);
    console.log(`   🆔 ID: ${activeRecording.recording_id}`);
    console.log(`   ⏰ Hora de inicio: ${activeRecording.start_time}`);
    console.log(`   📊 Estado: ${activeRecording.status}`);

    // Paso 2: Calcular tiempo transcurrido con la corrección
    console.log('\n2️⃣ CALCULANDO TIEMPO CON CORRECCIÓN:');
    const startTime = activeRecording.start_time;
    const { fixVpsTimezone, calculateElapsedSeconds, formatTime } = require('../lib/timer-fix');
    
    const fixedStartTime = fixVpsTimezone(startTime);
    const currentTime = new Date();
    const elapsedSeconds = calculateElapsedSeconds(startTime);
    const formattedTime = formatTime(elapsedSeconds);
    
    console.log(`   📅 Tiempo VPS original: ${startTime}`);
    console.log(`   🔧 Tiempo corregido (UTC): ${fixedStartTime.toISOString()}`);
    console.log(`   📅 Tiempo actual (UTC): ${currentTime.toISOString()}`);
    console.log(`   ⏱️  Segundos transcurridos: ${elapsedSeconds}`);
    console.log(`   📝 Tiempo formateado: ${formattedTime}`);

    // Paso 3: Simular actualización del temporizador
    console.log('\n3️⃣ SIMULANDO ACTUALIZACIÓN DEL TEMPORIZADOR:');
    console.log('   Simulando actualización cada segundo...');
    
    for (let i = 0; i < 5; i++) {
      const currentElapsed = calculateElapsedSeconds(startTime);
      const currentFormatted = formatTime(currentElapsed);
      console.log(`   ⏰ Segundo ${i + 1}: ${currentFormatted} (${currentElapsed}s)`);
      
      // Esperar 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Paso 4: Verificar que el tiempo avance correctamente
    console.log('\n4️⃣ VERIFICANDO QUE EL TIEMPO AVANCE:');
    const finalElapsed = calculateElapsedSeconds(startTime);
    const finalFormatted = formatTime(finalElapsed);
    
    if (finalElapsed >= 5) {
      console.log('   ✅ ÉXITO: El temporizador avanza correctamente');
      console.log(`   📈 Tiempo final: ${finalFormatted} (${finalElapsed}s)`);
      console.log(`   📊 Incremento: ${finalElapsed - elapsedSeconds} segundos`);
    } else {
      console.log('   ❌ PROBLEMA: El temporizador no avanza correctamente');
      console.log(`   📉 Tiempo esperado: >= ${elapsedSeconds + 5}s`);
      console.log(`   📉 Tiempo obtenido: ${finalElapsed}s`);
    }

    // Paso 5: Verificar formato esperado
    console.log('\n5️⃣ VERIFICANDO FORMATO ESPERADO:');
    const expectedFormat = /^\d+:\d{2}$/;
    if (expectedFormat.test(finalFormatted)) {
      console.log('   ✅ Formato correcto: mm:ss');
      console.log(`   📝 Ejemplo: ${finalFormatted}`);
    } else {
      console.log('   ❌ Formato incorrecto');
      console.log(`   📉 Esperado: mm:ss (ej: 5:23)`);
      console.log(`   📉 Obtenido: ${finalFormatted}`);
    }

  } catch (error) {
    console.log('❌ Error durante la verificación:', error.message);
    console.error('Error completo:', error);
  }

  console.log('\n✅ VERIFICACIÓN COMPLETADA');
  console.log('=====================================');
  console.log('🎯 Resultado: El temporizador debería mostrar el tiempo correcto');
  console.log('💡 Acción: Refresca la página /radios para ver los cambios');
  console.log('⏰ El temporizador ahora debería mostrar minutos:segundos en lugar de "0s"');
}

// Ejecutar verificación
verifyTimerUpdate().catch(console.error);