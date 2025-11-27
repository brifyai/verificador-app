#!/usr/bin/env node

// Script para verificar el flujo completo de grabaciones desde la página
const axios = require('axios');

console.log('🔍 Verificación de Flujo de Grabaciones');
console.log('=========================================\n');

async function testGrabacionesFlow() {
  // Simular el flujo que hace la página /grabaciones
  console.log('📋 Simulando el flujo de la página /grabaciones...\n');

  // Paso 1: Verificar conexión con VPS (igual que hace la página)
  console.log('1️⃣ Verificando conexión con VPS de grabaciones...');
  const VPS_URL = 'http://213.199.39.147:5000/api';
  
  try {
    // Test de estado del servidor (como hace recordingService.getActiveRecordings)
    const statusResponse = await axios.get(`${VPS_URL}/active-recordings`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ VPS de grabaciones RESPONDE:', statusResponse.data);
    
    if (statusResponse.data.status === 'success') {
      console.log('   📊 Estado de grabaciones activas:', statusResponse.data.active_recordings);
      console.log('   📊 Cantidad:', statusResponse.data.count || 0);
    }

    // Paso 2: Obtener lista de grabaciones disponibles
    console.log('\n2️⃣ Obteniendo lista de grabaciones disponibles...');
    const recordingsResponse = await axios.get(`${VPS_URL}/recordings`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Lista de grabaciones:', recordingsResponse.data);
    
    if (recordingsResponse.data.status === 'success' && recordingsResponse.data.recordings) {
      console.log(`   📁 Encontradas ${recordingsResponse.data.recordings.length} grabaciones`);
      
      if (recordingsResponse.data.recordings.length > 0) {
        recordingsResponse.data.recordings.forEach((recording, index) => {
          console.log(`   📋 ${index + 1}. ${recording.filename} (${(recording.size / 1024 / 1024).toFixed(2)} MB) - ${new Date(recording.created_at).toLocaleString()}`);
        });
      } else {
        console.log('   📭 No hay grabaciones disponibles actualmente');
      }
    }

    // Paso 3: Obtener radios disponibles
    console.log('\n3️⃣ Obteniendo radios disponibles...');
    const radiosResponse = await axios.get(`${VPS_URL}/radios`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Radios disponibles:', radiosResponse.data);
    
    if (radiosResponse.data.status === 'success' && radiosResponse.data.radios) {
      console.log(`   📻 Encontradas ${radiosResponse.data.radios.length} radios`);
      
      radiosResponse.data.radios.forEach((radio, index) => {
        console.log(`   📻 ${index + 1}. ${radio.name} (${radio.id}) - Estado: ${radio.status}`);
        console.log(`       URL: ${radio.stream_url}`);
        console.log(`       Región: ${radio.region}`);
        console.log(`       Plataforma: ${radio.platform}`);
      });
    }

    // Paso 4: Verificar si hay grabaciones activas
    console.log('\n4️⃣ Verificando grabaciones activas...');
    const activeRecordings = statusResponse.data.active_recordings || {};
    const activeCount = Object.keys(activeRecordings).length;
    
    if (activeCount > 0) {
      console.log(`   🔴 Hay ${activeCount} grabaciones activas:`);
      Object.entries(activeRecordings).forEach(([radioId, data]) => {
        console.log(`   🔴 ${radioId}: ${data.radio_name} - Estado: ${data.status}`);
        if (data.start_time) {
          const duration = new Date() - new Date(data.start_time);
          const minutes = Math.floor(duration / 60000);
          const seconds = Math.floor((duration % 60000) / 1000);
          console.log(`      Duración: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      });
    } else {
      console.log('   ⏹️ No hay grabaciones activas actualmente');
    }

    console.log('\n🎯 RESUMEN DEL ESTADO ACTUAL:');
    console.log('==============================');
    console.log('✅ VPS de grabaciones está FUNCIONANDO');
    console.log(`✅ Hay ${radiosResponse.data.radios?.length || 0} radios disponibles`);
    console.log(`✅ Hay ${recordingsResponse.data.recordings?.length || 0} grabaciones disponibles`);
    console.log(`✅ Hay ${activeCount} grabaciones activas`);
    
    if (recordingsResponse.data.recordings?.length === 0 && activeCount === 0) {
      console.log('\n💡 Para ver grabaciones en la app:');
      console.log('   1. Inicia sesión como ADMIN');
      console.log('   2. Ve a /radios');
      console.log('   3. Haz clic en "Grabar" en alguna radio');
      console.log('   4. Luego ve a /grabaciones para ver las grabaciones');
    }

  } catch (error) {
    console.log('❌ Error conectando con VPS:', error.message);
    console.log('\n⚠️  El VPS de grabaciones no está accesible. Posibles causas:');
    console.log('   - El servidor está apagado');
    console.log('   - Problemas de red o firewall');
    console.log('   - La IP o puerto han cambiado');
    console.log('   - El servicio no está ejecutándose');
  }

  console.log('\n🔗 URLs de prueba directa:');
  console.log('   VPS Grabaciones: http://213.199.39.147:5000/api/status');
  console.log('   VPS Grabaciones: http://213.199.39.147:5000/api/recordings');
  console.log('   VPS Grabaciones: http://213.199.39.147:5000/api/active-recordings');
}

// Ejecutar el test
testGrabacionesFlow().catch(console.error);