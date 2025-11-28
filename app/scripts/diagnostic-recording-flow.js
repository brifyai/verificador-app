#!/usr/bin/env node

/**
 * Diagnóstico del flujo de grabaciones usando fetch nativo
 * Verifica el sistema a través de los endpoints HTTP
 */

const VPS_API_BASE = 'http://213.199.39.147:5000/api';
const LOCAL_API_BASE = 'http://localhost:3000/api';

async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return await response.json();
  } catch (error) {
    throw new Error(`HTTP Error: ${error.message}`);
  }
}

async function checkRecordingFlow() {
  console.log('🔍 DIAGNÓSTICO DE FLUJO DE GRABACIONES');
  console.log('=' .repeat(60));
  
  // 1. Verificar endpoint VPS /recordings
  console.log('\n1️⃣  VERIFICANDO ENDPOINT VPS /recordings');
  try {
    const data = await fetchJSON(`${VPS_API_BASE}/recordings`);
    if (data.status === 'success') {
      const count = data.recordings ? data.recordings.length : 0;
      console.log(`   ✅ Endpoint funciona correctamente`);
      console.log(`   📊 Grabaciones encontradas: ${count}`);
      
      if (count > 0) {
        console.log('\n   📋 Últimas 5 grabaciones:');
        data.recordings.slice(0, 5).forEach((rec, i) => {
          const date = new Date(rec.created || rec.created_at);
          const sizeMB = rec.size ? (rec.size / 1024 / 1024).toFixed(2) : 'N/A';
          console.log(`      ${i + 1}. ${rec.filename} (${sizeMB} MB) - ${date.toLocaleString()}`);
        });
      }
    } else {
      console.log(`   ❌ Error: ${data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Error conectando: ${error.message}`);
  }

  // 2. Verificar endpoint VPS /active-recordings
  console.log('\n2️⃣  VERIFICANDO ENDPOINT VPS /active-recordings');
  try {
    const data = await fetchJSON(`${VPS_API_BASE}/active-recordings`);
    if (data.status === 'success') {
      const activeCount = Object.keys(data.active_recordings || {}).length;
      console.log(`   ✅ Endpoint funciona correctamente`);
      console.log(`   📊 Grabaciones activas: ${activeCount}`);
      
      if (activeCount > 0) {
        console.log('\n   📋 Grabaciones activas:');
        Object.entries(data.active_recordings).forEach(([id, rec]) => {
          const startTime = new Date(rec.start_time);
          console.log(`      ${id}: ${rec.radio_name} (inició ${startTime.toLocaleString()})`);
        });
      }
    } else {
      console.log(`   ❌ Error: ${data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Error conectando: ${error.message}`);
  }

  // 3. Verificar endpoint local /api/recordings
  console.log('\n3️⃣  VERIFICANDO ENDPOINT LOCAL /api/recordings');
  try {
    const data = await fetchJSON(`${LOCAL_API_BASE}/recordings`);
    if (data.status === 'success') {
      const count = data.recordings ? data.recordings.length : 0;
      console.log(`   ✅ Endpoint local funciona`);
      console.log(`   📊 Grabaciones encontradas: ${count}`);
    } else {
      console.log(`   ⚠️  Endpoint local responde pero con datos inválidos`);
    }
  } catch (error) {
    console.log(`   ❌ Error con endpoint local: ${error.message}`);
  }

  // 4. Probar inicio de grabación (simulado)
  console.log('\n4️⃣  PROBANDO INICIO DE GRABACIÓN');
  console.log('   📍 Nota: Esto es una prueba de conectividad del endpoint');
  try {
    // Intentar un POST al endpoint de inicio
    const response = await fetch(`${VPS_API_BASE}/start-recording`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (response.status === 400) {
      console.log(`   ✅ Endpoint /start-recording existe y responde (error 400 es normal sin datos)`);
    } else if (response.status === 404) {
      console.log(`   ❌ Endpoint /start-recording no encontrado (404)`);
    } else {
      console.log(`   ⚠️  Endpoint responde con status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error conectando al endpoint: ${error.message}`);
  }

  // 5. Verificar conectividad general
  console.log('\n5️⃣  VERIFICANDO CONECTIVIDAD GENERAL');
  try {
    const healthResponse = await fetch(`${VPS_API_BASE}/status`).catch(() => null);
    if (healthResponse && healthResponse.ok) {
      console.log(`   ✅ VPS responde a /status`);
    } else {
      console.log(`   ⚠️  VPS no responde a /status (puede no estar implementado)`);
    }
  } catch (error) {
    console.log(`   ⚠️  No se pudo verificar health check: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DEL DIAGNÓSTICO');
  console.log('='.repeat(60));
  
  console.log('\n🔍 Si ves grabaciones en el paso 1 pero no aparecen en la app:');
  console.log('   • El problema está en el frontend o en la conexión frontend-VPS');
  console.log('   • Verifica CORS en el VPS');
  console.log('   • Verifica que el frontend use la URL correcta del VPS');
  
  console.log('\n🔍 Si NO ves grabaciones en el paso 1:');
  console.log('   • Las grabaciones realmente no se están guardando');
  console.log('   • El problema está en el servicio de grabación del VPS');
  console.log('   • Verifica permisos, espacio en disco, FFmpeg');
  
  console.log('\n🔍 Si el paso 4 muestra error 404:');
  console.log('   • El endpoint /start-recording no existe');
  console.log('   • Verifica el código del API server en el VPS');
  
  console.log('\n🔍 Próximos pasos recomendados:');
  console.log('   1. Verifica que el VPS tenga FFmpeg instalado');
  console.log('   2. Verifica permisos del directorio de grabaciones');
  console.log('   3. Revisa los logs del API server en el VPS');
  console.log('   4. Prueba iniciar una grabación manualmente en el VPS');
  
  console.log('\n💡 Para revisar logs en el VPS (si tienes acceso):');
  console.log('   tail -f /home/radioapp/radio-recorder/server.log');
  
  console.log('\n🧪 Para probar FFmpeg manualmente en VPS:');
  console.log('   ffmpeg -i "URL_DE_RADIO" -t 30 -f mp3 test.mp3');
}

// Ejecutar diagnóstico
checkRecordingFlow()
  .then(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch(error => {
    console.log('\n💥 Error inesperado:', error.message);
    process.exit(1);
  });