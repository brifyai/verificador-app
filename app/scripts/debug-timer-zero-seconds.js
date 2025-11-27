#!/usr/bin/env node

// Diagnóstico del problema del temporizador mostrando "0s"
const axios = require('axios');

const VPS_URL = 'http://213.199.39.147:5000/api';
const RADIO_ID = 'radio-1';

console.log('🔍 Diagnóstico del Temporizador Mostrando "0s"');
console.log('==============================================\n');

async function debugTimerZeroSeconds() {
  console.log('📋 Analizando por qué el temporizador muestra 0 segundos...\n');

  try {
    // Paso 1: Obtener información de la grabación activa
    console.log('1️⃣ VERIFICANDO GRABACIÓN ACTIVA:');
    const activeResponse = await axios.get(`${VPS_URL}/active-recordings`);
    console.log('   ✅ Grabaciones activas:', JSON.stringify(activeResponse.data, null, 2));
    
    const activeRecording = activeResponse.data.active_recordings?.[RADIO_ID];
    if (!activeRecording) {
      console.log('   ❌ No hay grabación activa para esta radio');
      return;
    }

    console.log(`   📻 Radio: ${activeRecording.radio_name}`);
    console.log(`   🆔 ID: ${activeRecording.recording_id}`);
    console.log(`   ⏰ Hora de inicio: ${activeRecording.start_time}`);
    console.log(`   📊 Estado: ${activeRecording.status}`);

    // Paso 2: Calcular tiempo transcurrido
    console.log('\n2️⃣ CALCULANDO TIEMPO TRANSCURRIDO:');
    const startTime = new Date(activeRecording.start_time);
    const currentTime = new Date();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    
    console.log(`   📅 Hora de inicio (UTC): ${startTime.toISOString()}`);
    console.log(`   📅 Hora actual (UTC): ${currentTime.toISOString()}`);
    console.log(`   📅 Diferencia: ${elapsedSeconds} segundos`);
    console.log(`   ⏱️  Tiempo formateado: ${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`);

    // Paso 3: Verificar zona horaria y posibles problemas
    console.log('\n3️⃣ ANÁLISIS DE ZONA HORARIA:');
    console.log(`   🌍 Zona horaria del sistema: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`   🕐 Offset UTC: ${new Date().getTimezoneOffset()} minutos`);
    
    // Verificar si hay un problema de zona horaria
    const startTimeLocal = new Date(activeRecording.start_time);
    const startTimeUTC = new Date(startTimeLocal.getTime() + (startTimeLocal.getTimezoneOffset() * 60000));
    console.log(`   📍 Inicio (local): ${startTimeLocal.toLocaleString()}`);
    console.log(`   📍 Inicio (UTC): ${startTimeUTC.toISOString()}`);

    // Paso 4: Simular el cálculo que hace la app
    console.log('\n4️⃣ SIMULANDO CÁLCULO DE LA APP:');
    
    // Calcular como lo hace la app (basado en el código que vimos)
    const now = Date.now();
    const start = new Date(activeRecording.start_time).getTime();
    const diff = now - start;
    
    console.log(`   🧮 Now timestamp: ${now}`);
    console.log(`   🧮 Start timestamp: ${start}`);
    console.log(`   🧮 Diferencia (ms): ${diff}`);
    console.log(`   🧮 Diferencia (segundos): ${Math.floor(diff / 1000)}`);
    
    if (diff < 0) {
      console.log('   ⚠️  PROBLEMA DETECTADO: El tiempo de inicio está en el futuro!');
      console.log(`      Esto causaría que el temporizador muestre 0s o tiempo negativo`);
    } else if (diff < 1000) {
      console.log('   ⚠️  PROBLEMA DETECTADO: La diferencia es menor a 1 segundo');
      console.log(`      El temporizador redondearía a 0s`);
    } else {
      console.log('   ✅ El cálculo debería funcionar correctamente');
    }

    // Paso 5: Verificar el formato de start_time del VPS
    console.log('\n5️⃣ VERIFICANDO FORMATO DE FECHA DEL VPS:');
    const vpsTime = activeRecording.start_time;
    console.log(`   📅 Raw start_time: "${vpsTime}"`);
    console.log(`   📅 Tipo: ${typeof vpsTime}`);
    console.log(`   📅 Longitud: ${vpsTime.length}`);
    
    // Verificar si tiene el formato correcto ISO 8601
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (isoRegex.test(vpsTime)) {
      console.log('   ✅ Formato ISO 8601 válido detectado');
    } else {
      console.log('   ⚠️  Formato de fecha inesperado');
    }

    // Paso 6: Probar diferentes formas de parsear la fecha
    console.log('\n6️⃣ PROBANDO PARSEO DE FECHA:');
    const date1 = new Date(vpsTime);
    const date2 = new Date(Date.parse(vpsTime));
    const date3 = new Date(vpsTime.replace(' ', 'T') + 'Z');
    
    console.log(`   📅 new Date(): ${date1.toISOString()} (válido: ${!isNaN(date1.getTime())})`);
    console.log(`   📅 Date.parse(): ${date2.toISOString()} (válido: ${!isNaN(date2.getTime())})`);
    console.log(`   📅 Manual parse: ${date3.toISOString()} (válido: ${!isNaN(date3.getTime())})`);

    // Paso 7: Verificar si hay actualización del temporizador
    console.log('\n7️⃣ VERIFICANDO ACTUALIZACIÓN DEL TEMPORIZADOR:');
    console.log('   La app debería actualizar el temporizador cada segundo...');
    console.log('   Si el cálculo inicial es 0s, puede que:');
    console.log('   1. El temporizador no se esté actualizando');
    console.log('   2. El cálculo inicial sea incorrecto');
    console.log('   3. Haya un problema de zona horaria');

  } catch (error) {
    console.log('❌ Error durante el diagnóstico:', error.message);
    console.error('Error completo:', error);
  }

  console.log('\n✅ CONCLUSIÓN DEL ANÁLISIS:');
  console.log('=====================================');
  console.log('🎯 Posibles causas del temporizador mostrando "0s":');
  console.log('   1. ✅ Diferencia de zona horaria entre VPS y cliente');
  console.log('   2. ✅ El tiempo de inicio está en el futuro (UTC vs local)');
  console.log('   3. ✅ Problema de redondeo en el cálculo inicial');
  console.log('   4. ✅ El temporizador no se actualiza correctamente');
  console.log('');
  console.log('💡 SOLUCIÓN SUGERIDA:');
  console.log('   - Ajustar el cálculo del temporizador para manejar UTC/local');
  console.log('   - Asegurar que el temporizador se actualice cada segundo');
  console.log('   - Manejar casos donde el tiempo transcurrido sea < 1 segundo');
}

// Ejecutar diagnóstico
debugTimerZeroSeconds().catch(console.error);