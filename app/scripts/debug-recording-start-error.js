#!/usr/bin/env node

// Diagnóstico específico del error al iniciar grabación
const axios = require('axios');

const VPS_URL = 'http://213.199.39.147:5000/api';
const RADIO_ID = 'radio-1';
const RADIO_NAME = 'Bio-Bio Santiago';

console.log('🔍 Diagnóstico del Error al Iniciar Grabación');
console.log('==============================================\n');

async function debugRecordingStartError() {
  console.log('📋 Analizando el error completo al iniciar grabación...\n');

  try {
    // 1. Verificar que la radio esté disponible y activa
    console.log('1️⃣ VERIFICANDO ESTADO DE LA RADIO:');
    const radiosResponse = await axios.get(`${VPS_URL}/radios`, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    
    console.log('   ✅ Radios disponibles:', JSON.stringify(radiosResponse.data, null, 2));
    
    const targetRadio = radiosResponse.data.radios?.find(radio => radio.id === RADIO_ID);
    if (targetRadio) {
      console.log(`   📻 Radio encontrada: ${targetRadio.name}`);
      console.log(`      📊 Estado: ${targetRadio.status}`);
      console.log(`      🔗 URL: ${targetRadio.stream_url}`);
      
      if (targetRadio.status !== 'ACTIVE') {
        console.log('   ⚠️  PROBLEMA: La radio no está activa');
        return;
      }
    } else {
      console.log('   ❌ ERROR: Radio no encontrada en la lista');
      return;
    }

    // 2. Verificar grabaciones activas actuales
    console.log('\n2️⃣ VERIFICANDO GRABACIONES ACTIVAS ACTUALES:');
    const activeResponse = await axios.get(`${VPS_URL}/active-recordings`, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    
    console.log('   ✅ Grabaciones activas:', JSON.stringify(activeResponse.data, null, 2));
    
    // 3. Intentar iniciar grabación (simulando el error)
    console.log('\n3️⃣ INTENTANDO INICIAR GRABACIÓN (simulando el flujo de la app):');
    console.log(`   📍 Radio: ${RADIO_NAME} (${RADIO_ID})`);
    console.log(`   🎯 Endpoint: ${VPS_URL}/start-recording`);
    
    try {
      const startResponse = await axios.post(`${VPS_URL}/start-recording`, {
        radio_id: RADIO_ID,
        radio_name: RADIO_NAME
      }, {
        timeout: 15000, // 15 segundos de timeout
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      
      console.log('   ✅ GRABACIÓN INICIADA EXITOSAMENTE:', JSON.stringify(startResponse.data, null, 2));
      
      if (startResponse.data.status === 'success') {
        console.log('   🎉 ÉXITO: La grabación se inició correctamente');
        console.log(`   📅 Tiempo de inicio: ${startResponse.data.start_time}`);
        console.log(`   🆔 ID de grabación: ${startResponse.data.recording_id}`);
      } else {
        console.log('   ⚠️  ADVERTENCIA: El servidor respondió pero con estado no exitoso');
        console.log(`   💬 Mensaje: ${startResponse.data.message}`);
      }
      
    } catch (error) {
      console.log('   ❌ ERROR AL INICIAR GRABACIÓN:', error.message);
      
      if (error.response) {
        // Error de respuesta del servidor
        console.log('   📡 RESPUESTA DEL SERVIDOR:');
        console.log(`      📊 Código: ${error.response.status}`);
        console.log(`      💬 Mensaje: ${error.response.data?.message || 'Sin mensaje'}`);
        console.log(`      📋 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
        
        // Análisis específico de errores comunes
        if (error.response.status === 400) {
          console.log('   🔍 DIAGNÓSTICO: Error 400 - Solicitud inválida');
          console.log('      💡 Posibles causas:');
          console.log('         - radio_id inválido');
          console.log('         - radio_name vacío');
          console.log('         - Radio inactiva');
          console.log('         - Parámetros mal formateados');
        } else if (error.response.status === 404) {
          console.log('   🔍 DIAGNÓSTICO: Error 404 - Endpoint no encontrado');
          console.log('      💡 Posibles causas:');
          console.log('         - URL incorrecta');
          console.log('         - Endpoint no implementado');
        } else if (error.response.status === 500) {
          console.log('   🔍 DIAGNÓSTICO: Error 500 - Error interno del servidor');
          console.log('      💡 Posibles causas:');
          console.log('         - Problema en el VPS');
          console.log('         - Error en el proceso de grabación');
          console.log('         - Recursos insuficientes');
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   🔍 DIAGNÓSTICO: Conexión rechazada');
        console.log('      💡 El servidor VPS no está escuchando en el puerto 5000');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('   🔍 DIAGNÓSTICO: Timeout de conexión');
        console.log('      💡 El servidor no responde dentro del tiempo límite');
      } else if (error.code === 'ENOTFOUND') {
        console.log('   🔍 DIAGNÓSTICO: Host no encontrado');
        console.log('      💡 La IP del servidor no es accesible');
      } else {
        console.log('   🔍 DIAGNÓSTICO: Error de red general');
        console.log(`      💡 Código: ${error.code}`);
        console.log(`      💡 Mensaje: ${error.message}`);
      }
    }

    // 4. Verificar el resultado después de iniciar
    console.log('\n4️⃣ VERIFICANDO RESULTADO DESPUÉS DE INICIAR:');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
    
    const newActiveResponse = await axios.get(`${VPS_URL}/active-recordings`, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    
    console.log('   ✅ Nuevo estado de grabaciones activas:', JSON.stringify(newActiveResponse.data, null, 2));
    
    if (newActiveResponse.data.active_recordings && Object.keys(newActiveResponse.data.active_recordings).length > 0) {
      console.log('   🎉 VERIFICACIÓN: La grabación está activa correctamente');
    } else {
      console.log('   ⚠️  ADVERTENCIA: No hay grabaciones activas después de iniciar');
    }

  } catch (error) {
    console.log('❌ Error durante el diagnóstico:', error.message);
    console.error('Error completo:', error);
  }

  console.log('\n✅ DIAGNÓSTICO COMPLETO FINALIZADO');
  console.log('=====================================');
  console.log('🎯 Si el error persiste, revisa:');
  console.log('   1. Conexión al VPS: curl http://213.199.39.147:5000/api/status');
  console.log('   2. Logs del servidor VPS');
  console.log('   3. Configuración de la radio en el VPS');
  console.log('   4. Recursos disponibles en el servidor');
}

// Ejecutar diagnóstico
debugRecordingStartError().catch(console.error);