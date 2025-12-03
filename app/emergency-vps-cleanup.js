#!/usr/bin/env node

/**
 * LIMPIEZA DE EMERGENCIA DEL VPS
 * Solución drástica para eliminar archivos fantasma del VPS
 */

const axios = require('axios');
const colors = require('colors');

// Configuración
const VPS_URL = 'http://213.199.39.147:5000';

// Función para hacer request directo al VPS
async function vpsRequest(endpoint, options = {}) {
  const url = `${VPS_URL}${endpoint}`;
  try {
    const response = await axios({
      method: options.method || 'GET',
      url,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...options.headers
      },
      data: options.data,
      params: options.params,
      timeout: 10000
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status,
      data: error.response?.data 
    };
  }
}

// Función para limpiar directorio de grabaciones en el VPS
async function cleanVPSRecordings() {
  console.log(colors.cyan.bold('\n🚨 LIMPIEZA DE EMERGENCIA DEL VPS 🚨\n'));
  
  try {
    // 1. Verificar estado actual del VPS
    console.log(colors.cyan.bold('📊 PASO 1: VERIFICANDO ESTADO ACTUAL\n'));
    
    const recordingsResponse = await vpsRequest('/api/recordings');
    if (recordingsResponse.success) {
      const recordings = recordingsResponse.data.recordings || [];
      console.log(colors.yellow(`⚠️ VPS devuelve ${recordings.length} grabaciones:`));
      recordings.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.filename}`);
      });
    } else {
      console.log(colors.red(`❌ Error verificando VPS: ${recordingsResponse.error}`));
    }
    
    // 2. Intentar limpiar directorio de grabaciones
    console.log(colors.cyan.bold('\n🗑️ PASO 2: LIMPIANDO DIRECTORIO /recordings/\n'));
    
    // Intentar diferentes métodos de limpieza
    const cleanupMethods = [
      { method: 'DELETE', endpoint: '/api/recordings/cleanup' },
      { method: 'POST', endpoint: '/api/recordings/clear' },
      { method: 'DELETE', endpoint: '/recordings/*' },
      { method: 'POST', endpoint: '/api/maintenance/clear-recordings' }
    ];
    
    for (const cleanupMethod of cleanupMethods) {
      console.log(colors.bold(`Probando: ${cleanupMethod.method} ${cleanupMethod.endpoint}`));
      
      const cleanupResponse = await vpsRequest(cleanupMethod.endpoint, {
        method: cleanupMethod.method
      });
      
      if (cleanupResponse.success) {
        console.log(colors.green(`   ✅ Limpieza exitosa: ${JSON.stringify(cleanupResponse.data)}`));
        break;
      } else {
        console.log(colors.red(`   ❌ Falló: ${cleanupResponse.error}`));
      }
    }
    
    // 3. Reiniciar servicio de grabaciones si es posible
    console.log(colors.cyan.bold('\n🔄 PASO 3: REINICIANDO SERVICIO\n'));
    
    const restartMethods = [
      { method: 'POST', endpoint: '/api/restart' },
      { method: 'POST', endpoint: '/api/service/restart' },
      { method: 'POST', endpoint: '/restart-recordings' }
    ];
    
    for (const restartMethod of restartMethods) {
      console.log(colors.bold(`Probando: ${restartMethod.method} ${restartMethod.endpoint}`));
      
      const restartResponse = await vpsRequest(restartMethod.endpoint, {
        method: restartMethod.method
      });
      
      if (restartResponse.success) {
        console.log(colors.green(`   ✅ Reinicio exitoso: ${JSON.stringify(restartResponse.data)}`));
        break;
      } else {
        console.log(colors.red(`   ❌ Falló: ${restartResponse.error}`));
      }
    }
    
    // 4. Esperar y verificar limpieza
    console.log(colors.cyan.bold('\n⏳ PASO 4: ESPERANDO Y VERIFICANDO\n'));
    
    console.log('Esperando 10 segundos para que los cambios surtan efecto...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 5. Verificación final
    console.log(colors.cyan.bold('\n✅ PASO 5: VERIFICACIÓN FINAL\n'));
    
    const finalResponse = await vpsRequest('/api/recordings');
    if (finalResponse.success) {
      const finalRecordings = finalResponse.data.recordings || [];
      console.log(colors.green(`✅ VPS ahora devuelve ${finalRecordings.length} grabaciones`));
      
      if (finalRecordings.length === 0) {
        console.log(colors.green.bold('🎉 LIMPIEZA EXITOSA - VPS LIMPIO'));
      } else {
        console.log(colors.red.bold('❌ LIMPIEZA FALLIDA - VPS AÚN TIENE DATOS'));
        finalRecordings.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.filename}`);
        });
      }
    } else {
      console.log(colors.red(`❌ Error en verificación final: ${finalResponse.error}`));
    }
    
    // 6. Forzar limpieza de archivos específicos si es necesario
    if (finalResponse.success && (finalResponse.data.recordings?.length || 0) > 0) {
      console.log(colors.cyan.bold('\n🗑️ PASO 6: LIMPIEZA FORZADA DE ARCHIVOS\n'));
      
      const problematicFiles = [
        'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
        'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
        'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
      ];
      
      for (const filename of problematicFiles) {
        console.log(colors.bold(`Eliminando archivo: ${filename}`));
        
        // Intentar eliminar archivo específico
        const deleteResponse = await vpsRequest(`/api/recordings/${encodeURIComponent(filename)}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.success) {
          console.log(colors.green(`   ✅ Archivo eliminado: ${filename}`));
        } else {
          console.log(colors.red(`   ❌ No se pudo eliminar: ${filename}`));
        }
      }
    }
    
  } catch (error) {
    console.log(colors.red(`Error en limpieza de emergencia: ${error.message}`));
    console.error(error);
  }
}

// Función para verificar todos los endpoints del VPS
async function checkAllVPSEndpoints() {
  console.log(colors.cyan.bold('\n🔍 VERIFICANDO TODOS LOS ENDPOINTS DEL VPS\n'));
  
  const endpoints = [
    '/api/recordings',
    '/api/recordings/list',
    '/api/recordings/active',
    '/recordings',
    '/api/vps/recordings',
    '/api/grabaciones',
    '/grabaciones',
    '/files',
    '/api/files',
    '/api/storage/recordings'
  ];
  
  for (const endpoint of endpoints) {
    console.log(colors.bold(`Probando: ${endpoint}`));
    
    const response = await vpsRequest(endpoint);
    
    if (response.success) {
      const data = response.data;
      const count = Array.isArray(data) ? data.length : 
                   (data.recordings?.length || data.count || data.files?.length || 0);
      console.log(colors.green(`   ✅ Respuesta: ${count} elementos`));
      
      if (count > 0) {
        console.log(colors.yellow(`   ⚠️ ENDPOINT CON DATOS: ${endpoint}`));
        console.log(`   📄 Datos:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
      }
    } else {
      console.log(colors.red(`   ❌ Error: ${response.error}`));
    }
    console.log('');
  }
}

// Función principal
async function main() {
  console.log(colors.red.bold('\n🚨 LIMPIEZA DE EMERGENCIA DEL VPS 🚨\n'));
  console.log('Esta operación limpiará todos los datos de grabaciones del VPS\n');
  
  try {
    await checkAllVPSEndpoints();
    await cleanVPSRecordings();
    
    console.log(colors.cyan.bold('\n💡 NOTAS IMPORTANTES:\n'));
    console.log('1. Si la limpieza falla, puede ser necesario:');
    console.log('   - Acceder al VPS directamente via SSH');
    console.log('   - Eliminar archivos manualmente del directorio /recordings/');
    console.log('   - Reiniciar el servicio de grabaciones');
    console.log('');
    console.log('2. Para evitar futuros problemas:');
    console.log('   - Implementar verificación de existencia antes de guardar');
    console.log('   - Agregar logs de error para detectar archivos fantasma');
    console.log('   - Limpiar regularmente archivos temporales');
    
    console.log(colors.cyan.bold('\n=== LIMPIEZA DE EMERGENCIA COMPLETADA ===\n'));
    
  } catch (error) {
    console.log(colors.red(`Error en limpieza de emergencia: ${error.message}`));
    console.error(error);
  }
}

// Ejecutar
main().catch(err => {
  console.log(colors.red(`Error fatal: ${err.message}`));
  console.error(err);
});