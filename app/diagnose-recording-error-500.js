#!/usr/bin/env node

/**
 * Diagnóstico de error HTTP 500 al grabar
 * Analiza el problema cuando se hace clic en "Grabar" y falla con error 500
 */

const https = require('https');
const http = require('http');

// Configuración
const VPS_URL = 'http://213.199.39.147:5000';
const TEST_RADIO = {
  name: 'Radio Contagio',
  streamUrl: 'http://stream5.eltelar.com:8064/stream',
  id: 'test-radio-1'
};

console.log('🔍 DIAGNÓSTICO DE ERROR HTTP 500 AL GRABAR');
console.log('==========================================');
console.log('');

async function testRecordingEndpoint() {
  console.log('📡 Probando endpoint de grabación del VPS...');
  
  const recordingData = {
    radio_id: TEST_RADIO.id,
    radio_name: TEST_RADIO.name,
    stream_url: TEST_RADIO.streamUrl,
    duration: 30 // 30 segundos de prueba
  };

  try {
    console.log('📋 Datos a enviar:', JSON.stringify(recordingData, null, 2));
    
    const response = await fetch(`${VPS_URL}/api/start-recording`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordingData)
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Status Text: ${response.statusText}`);
    
    const responseData = await response.text();
    console.log(`📨 Response: ${responseData}`);
    
    if (!response.ok) {
      console.log(`❌ Error HTTP: ${response.status}`);
      return false;
    }
    
    console.log('✅ Grabación iniciada exitosamente');
    return true;
    
  } catch (error) {
    console.log(`💥 Error de conexión: ${error.message}`);
    return false;
  }
}

async function testVPSHealth() {
  console.log('');
  console.log('🏥 Verificando salud del VPS...');
  
  const endpoints = [
    '/api/health',
    '/api/status',
    '/api/recordings',
    '/api/active-recordings'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Probando: ${endpoint}`);
      const response = await fetch(`${VPS_URL}${endpoint}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Datos: ${JSON.stringify(data).substring(0, 200)}...`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    console.log('');
  }
}

async function testStreamBeforeRecording() {
  console.log('🎵 Probando stream antes de grabación...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(TEST_RADIO.streamUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📊 Stream Status: ${response.status}`);
    console.log(`📄 Stream Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    return response.ok;
    
  } catch (error) {
    console.log(`💥 Error verificando stream: ${error.message}`);
    return false;
  }
}

async function analyzeVPSLogs() {
  console.log('');
  console.log('📋 Análisis de posibles causas del error 500:');
  console.log('');
  
  console.log('1. 🔄 Verificación de grabaciones activas...');
  try {
    const response = await fetch(`${VPS_URL}/api/active-recordings`);
    const data = await response.json();
    console.log(`   📊 Grabaciones activas: ${data.count}`);
    
    if (data.count > 0) {
      console.log('   ⚠️  Hay grabaciones activas - podría haber límite de concurrencia');
      console.log('   💡 Posible solución: Detener grabaciones antiguas');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  console.log('2. 🔍 Verificando espacio en disco...');
  console.log('   💡 El VPS podría tener poco espacio disponible');
  
  console.log('');
  console.log('3. 🐛 Verificando logs del VPS...');
  console.log('   💡 Comando útil: ssh usuario@vps "docker logs radio-recorder"');
  
  console.log('');
  console.log('4. ⚙️  Verificando configuración del VPS...');
  console.log('   💡 El VPS podría tener límites de memoria/CPU');
}

async function runFullDiagnosis() {
  console.log('🚀 Iniciando diagnóstico completo...');
  console.log('');
  
  // 1. Verificar salud del VPS
  await testVPSHealth();
  
  // 2. Probar el stream
  console.log('');
  const streamOk = await testStreamBeforeRecording();
  
  // 3. Probar grabación
  console.log('');
  const recordingOk = await testRecordingEndpoint();
  
  // 4. Análisis adicional
  await analyzeVPSLogs();
  
  console.log('');
  console.log('📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('==========================');
  console.log(`🎵 Stream accesible: ${streamOk ? '✅ SÍ' : '❌ NO'}`);
  console.log(`📹 Grabación funcional: ${recordingOk ? '✅ SÍ' : '❌ NO'}`);
  
  if (!streamOk) {
    console.log('');
    console.log('🔧 SOLUCIONES RECOMENDADAS:');
    console.log('1. Verificar que el stream URL esté correcto');
    console.log('2. Verificar que el stream esté activo');
    console.log('3. Probar con otros streams');
  }
  
  if (!recordingOk) {
    console.log('');
    console.log('🔧 SOLUCIONES PARA ERROR 500:');
    console.log('1. 🐛 Revisar logs del VPS: docker logs radio-recorder');
    console.log('2. 💾 Verificar espacio en disco: df -h');
    console.log('3. 🔧 Reiniciar servicio del VPS: docker restart radio-recorder');
    console.log('4. 📊 Verificar límites de recursos: docker stats');
    console.log('5. 🔍 Verificar configuración del VPS');
    console.log('6. 🧹 Limpiar grabaciones antiguas del VPS');
  }
}

// Ejecutar diagnóstico
runFullDiagnosis().catch(console.error);