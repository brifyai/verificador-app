#!/usr/bin/env node

// Script para verificar la conexión real con el VPS de grabación
const axios = require('axios');

const VPS_URL = 'http://213.199.39.147:5000/api';
const VPS_AUDIO_URL = 'http://173.249.26.38/api';

console.log('🔍 Verificación de Conexión con VPS');
console.log('====================================\n');

async function testConnection() {
  try {
    console.log(`📡 Probando conexión con VPS Grabaciones: ${VPS_URL}`);
    
    // Test 1: Verificar estado del servidor
    console.log('\n1️⃣ Test - Estado del servidor:');
    try {
      const statusResponse = await axios.get(`${VPS_URL}/status`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('✅ Servidor de grabaciones RESPONDE:', statusResponse.data);
    } catch (error) {
      console.log('❌ Error con servidor de grabaciones:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('   ⚠️  Conexión rechazada - El servidor no está escuchando en ese puerto');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('   ⏰ Timeout - El servidor no responde (puede estar caído)');
      } else if (error.code === 'ENOTFOUND') {
        console.log('   🔍 Host no encontrado - La IP no existe o no es accesible');
      }
    }

    // Test 2: Verificar grabaciones activas
    console.log('\n2️⃣ Test - Grabaciones activas:');
    try {
      const activeResponse = await axios.get(`${VPS_URL}/active-recordings`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('✅ Endpoint de grabaciones activas FUNCIONA:', activeResponse.data);
    } catch (error) {
      console.log('❌ Error con grabaciones activas:', error.message);
    }

    // Test 3: Verificar lista de grabaciones
    console.log('\n3️⃣ Test - Lista de grabaciones disponibles:');
    try {
      const recordingsResponse = await axios.get(`${VPS_URL}/recordings`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('✅ Endpoint de grabaciones FUNCIONA:', recordingsResponse.data);
      if (recordingsResponse.data.recordings) {
        console.log(`   📁 Encontradas ${recordingsResponse.data.recordings.length} grabaciones`);
      }
    } catch (error) {
      console.log('❌ Error con lista de grabaciones:', error.message);
    }

    // Test 4: Verificar radios disponibles
    console.log('\n4️⃣ Test - Radios disponibles:');
    try {
      const radiosResponse = await axios.get(`${VPS_URL}/radios`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('✅ Endpoint de radios FUNCIONA:', radiosResponse.data);
      if (radiosResponse.data.radios) {
        console.log(`   📻 Encontradas ${radiosResponse.data.radios.length} radios`);
      }
    } catch (error) {
      console.log('❌ Error con radios:', error.message);
    }

    // Test 5: Verificar VPS de audios
    console.log(`\n📡 Probando conexión con VPS Audios: ${VPS_AUDIO_URL}`);
    console.log('\n5️⃣ Test - Audios disponibles:');
    try {
      const audiosResponse = await axios.get(`${VPS_AUDIO_URL}/audios?limit=10`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('✅ Servidor de audios RESPONDE:', audiosResponse.data);
      if (audiosResponse.data.audios) {
        console.log(`   🎵 Encontrados ${audiosResponse.data.audios.length} audios`);
      }
    } catch (error) {
      console.log('❌ Error con servidor de audios:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('   ⚠️  Conexión rechazada - El servidor no está escuchando');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('   ⏰ Timeout - El servidor no responde');
      }
    }

    // Test 6: Verificar acceso desde el navegador (CORS)
    console.log('\n6️⃣ Test - Verificación de CORS:');
    try {
      const corsResponse = await axios.get(`${VPS_URL}/status`, {
        timeout: 5000,
        headers: {
          'Origin': 'http://localhost:3000',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('✅ CORS parece estar configurado correctamente');
    } catch (error) {
      console.log('⚠️  Posible problema de CORS:', error.message);
    }

  } catch (error) {
    console.log('❌ Error general:', error);
  }

  console.log('\n📋 RESUMEN DE CONEXIÓN:');
  console.log('========================');
  console.log('VPS Grabaciones: http://213.199.39.147:5000/api');
  console.log('VPS Audios: http://173.249.26.38/api');
  console.log('\nSi algún endpoint falla, el problema está en el servidor VPS.');
  console.log('Las grabaciones aparecerán en la app cuando los servidores respondan correctamente.');
}

// Ejecutar el test
testConnection().catch(console.error);