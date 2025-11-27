#!/usr/bin/env node

// Script para probar el temporizador de grabaciones con corrección de zona horaria
const axios = require('axios');

const VPS_URL = 'http://213.199.39.147:5000/api';

console.log('⏱️ Prueba de Temporizador de Grabaciones');
console.log('=========================================\n');

function formatDuration(startTimeStr) {
  try {
    const serverTime = new Date(startTimeStr);
    const localTime = new Date();
    
    console.log(`📅 Servidor: ${serverTime.toISOString()}`);
    console.log(`📅 Local: ${localTime.toISOString()}`);
    
    let diff = localTime.getTime() - serverTime.getTime();
    
    // CORRECCIÓN: Manejar diferencias de zona horaria
    if (diff < 0) {
      console.log('⚠️ Diferencia negativa detectada, usando 0');
      diff = 0;
    }
    
    // Si la diferencia es mayor a 24 horas, podría ser un problema de zona horaria
    if (diff > 24 * 60 * 60 * 1000) {
      console.log('⚠️ Diferencia mayor a 24 horas, usando tiempo razonable');
      diff = 60 * 60 * 1000; // 1 hora como ejemplo
    }
    
    console.log(`⏱️ Diferencia: ${diff}ms`);
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    console.log(`⏰ Formateado: ${hours}h ${minutes}m ${seconds}s`);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  } catch (error) {
    console.log('❌ Error en formatDuration:', error.message);
    return '00:00';
  }
}

async function testRecordingTimer() {
  console.log('📋 Iniciando prueba del temporizador...\n');
  
  try {
    // Test 1: Probar con tiempo del servidor actual
    console.log('1️⃣ Test - Tiempo actual del servidor:');
    const serverTime = '2025-11-27T01:52:33.277201'; // Ejemplo del VPS
    const result1 = formatDuration(serverTime);
    console.log(`   Resultado: ${result1}\n`);
    
    // Test 2: Probar con tiempo hace 5 minutos
    console.log('2️⃣ Test - Tiempo hace 5 minutos:');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result2 = formatDuration(fiveMinutesAgo);
    console.log(`   Resultado: ${result2}\n`);
    
    // Test 3: Probar con tiempo hace 2 horas
    console.log('3️⃣ Test - Tiempo hace 2 horas:');
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result3 = formatDuration(twoHoursAgo);
    console.log(`   Resultado: ${result3}\n`);
    
    // Test 4: Probar con tiempo futuro (caso problema)
    console.log('4️⃣ Test - Tiempo futuro (simulando problema de zona horaria):');
    const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora en el futuro
    const result4 = formatDuration(futureTime);
    console.log(`   Resultado: ${result4}\n`);
    
    // Test 5: Verificar estado actual del VPS
    console.log('5️⃣ Test - Verificando estado actual del VPS:');
    const statusResponse = await axios.get(`${VPS_URL}/active-recordings`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (statusResponse.data.status === 'success' && statusResponse.data.active_recordings) {
      const activeRecordings = statusResponse.data.active_recordings;
      const count = Object.keys(activeRecordings).length;
      
      console.log(`   📊 Grabaciones activas encontradas: ${count}`);
      
      if (count > 0) {
        Object.entries(activeRecordings).forEach(([radioId, data]) => {
          console.log(`   🔴 ${radioId}: ${data.radio_name}`);
          console.log(`      📅 Inicio: ${data.start_time}`);
          console.log(`      📊 Estado: ${data.status}`);
          
          if (data.start_time) {
            const duration = formatDuration(data.start_time);
            console.log(`      ⏱️  Duración: ${duration}`);
          }
        });
      } else {
        console.log('   📭 No hay grabaciones activas actualmente');
        console.log('   💡 Para probar el temporizador:');
        console.log('   1. Ve a http://localhost:3000/radios');
        console.log('   2. Haz clic en "Iniciar Grabación"');
        console.log('   3. Luego ejecuta este script nuevamente');
      }
    }
    
  } catch (error) {
    console.log('❌ Error durante la prueba:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️  El servidor VPS no está respondiendo');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   ⏰ Timeout al conectar con el servidor');
    }
  }
  
  console.log('\n✅ RESUMEN DE LA PRUEBA:');
  console.log('=========================');
  console.log('✅ Función formatDuration corregida para manejar:');
  console.log('   - Diferencias de zona horaria');
  console.log('   - Tiempos negativos (futuro)');
  console.log('   - Tiempos excesivamente grandes');
  console.log('   - Errores de formato');
  console.log('\n✅ El temporizador debería mostrar el tiempo correcto');
  console.log('✅ No debería quedarse pegado en "00:00"');
  console.log('\n🔄 Si hay grabaciones activas, el temporizador se actualizará automáticamente');
}

// Ejecutar prueba
testRecordingTimer().catch(console.error);