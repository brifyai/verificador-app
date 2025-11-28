#!/usr/bin/env node

/**
 * Script para verificar el estado del servicio de grabación en el VPS
 * 
 * Verifica:
 * 1. Estado del servicio (status endpoint)
 * 2. Espacio en disco
 * 3. Permisos de escritura en el directorio de grabaciones
 * 4. Logs recientes de errores
 */

const VPS_API_BASE = 'http://213.199.39.147:5000/api';

console.log('🔍 VERIFICANDO ESTADO DEL SERVICIO DE GRABACIÓN EN VPS');
console.log('=====================================================\n');

async function checkVPSServerStatus() {
  console.log('1️⃣ ESTADO DEL SERVIDOR VPS');
  console.log(`   URL: ${VPS_API_BASE}/status`);
  
  try {
    const response = await fetch(`${VPS_API_BASE}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`   ❌ Error HTTP: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Servidor VPS está respondiendo');
    console.log(`   Status: ${data.status || 'unknown'}`);
    console.log(`   Mensaje: ${data.message || 'N/A'}`);
    
    if (data.uptime) {
      console.log(`   Uptime: ${data.uptime}`);
    }
    
    if (data.version) {
      console.log(`   Versión: ${data.version}`);
    }
    
    return data;
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return null;
  }
}

async function checkVPSDiskSpace() {
  console.log('\n2️⃣ VERIFICANDO ESPACIO EN DISCO DEL VPS');
  console.log(`   URL: ${VPS_API_BASE}/disk-space`);
  
  try {
    const response = await fetch(`${VPS_API_BASE}/disk-space`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`   ⚠️ Endpoint disk-space no disponible (${response.status})`);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Información de disco obtenida');
    
    if (data.total && data.used && data.free) {
      const totalGB = (data.total / (1024 * 1024 * 1024)).toFixed(2);
      const usedGB = (data.used / (1024 * 1024 * 1024)).toFixed(2);
      const freeGB = (data.free / (1024 * 1024 * 1024)).toFixed(2);
      const percentage = ((data.used / data.total) * 100).toFixed(1);
      
      console.log(`   Total: ${totalGB} GB`);
      console.log(`   Usado: ${usedGB} GB (${percentage}%)`);
      console.log(`   Libre: ${freeGB} GB`);
      
      if (percentage > 90) {
        console.log('   🚨 ALERTA: Disco casi lleno!');
      } else if (percentage > 80) {
        console.log('   ⚠️  ADVERTENCIA: Disco con poco espacio');
      } else {
        console.log('   ✅ Espacio en disco suficiente');
      }
    }
    
    return data;
  } catch (error) {
    console.log(`   ⚠️  No se pudo obtener información de disco: ${error.message}`);
    return null;
  }
}

async function checkVPSRecordingDirectory() {
  console.log('\n3️⃣ VERIFICANDO DIRECTORIO DE GRABACIONES');
  console.log(`   URL: ${VPS_API_BASE}/recording-directory`);
  
  try {
    const response = await fetch(`${VPS_API_BASE}/recording-directory`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`   ⚠️ Endpoint recording-directory no disponible (${response.status})`);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Información del directorio obtenida');
    
    if (data.path) {
      console.log(`   Directorio: ${data.path}`);
    }
    
    if (data.exists !== undefined) {
      console.log(`   Existe: ${data.exists ? '✅' : '❌'}`);
    }
    
    if (data.writable !== undefined) {
      console.log(`   Escritura: ${data.writable ? '✅' : '❌'}`);
      if (!data.writable) {
        console.log('   🚨 CRÍTICO: No se puede escribir en el directorio de grabaciones!');
      }
    }
    
    if (data.file_count !== undefined) {
      console.log(`   Archivos: ${data.file_count}`);
    }
    
    return data;
  } catch (error) {
    console.log(`   ⚠️  No se pudo obtener información del directorio: ${error.message}`);
    return null;
  }
}

async function checkVPSRecentErrors() {
  console.log('\n4️⃣ VERIFICANDO LOGS DE ERRORES RECIENTES');
  console.log(`   URL: ${VPS_API_BASE}/recent-errors`);
  
  try {
    const response = await fetch(`${VPS_API_BASE}/recent-errors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`   ⚠️ Endpoint recent-errors no disponible (${response.status})`);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Logs de errores obtenidos');
    
    if (data.errors && data.errors.length > 0) {
      console.log(`   Errores encontrados: ${data.errors.length}`);
      console.log('\n   📋 ÚLTIMOS 5 ERRORES:');
      
      data.errors.slice(0, 5).forEach((error, i) => {
        console.log(`\n   ${i + 1}. ${error.timestamp || 'N/A'}`);
        console.log(`      Mensaje: ${error.message || 'N/A'}`);
        if (error.stack) {
          console.log(`      Stack: ${error.stack.substring(0, 100)}...`);
        }
      });
    } else {
      console.log('   ✅ No se encontraron errores recientes');
    }
    
    return data;
  } catch (error) {
    console.log(`   ⚠️  No se pudo obtener logs de errores: ${error.message}`);
    return null;
  }
}

async function checkVPSRecordingProcess() {
  console.log('\n5️⃣ VERIFICANDO PROCESO DE GRABACIÓN');
  console.log(`   URL: ${VPS_API_BASE}/recording-process`);
  
  try {
    const response = await fetch(`${VPS_API_BASE}/recording-process`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`   ⚠️ Endpoint recording-process no disponible (${response.status})`);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Estado del proceso de grabación obtenido');
    
    if (data.is_running !== undefined) {
      console.log(`   En ejecución: ${data.is_running ? '✅' : '❌'}`);
    }
    
    if (data.pid) {
      console.log(`   PID: ${data.pid}`);
    }
    
    if (data.recent_recordings !== undefined) {
      console.log(`   Grabaciones recientes: ${data.recent_recordings}`);
      if (data.recent_recordings === 0) {
        console.log('   ⚠️  No se han realizado grabaciones recientes');
      }
    }
    
    if (data.last_recording) {
      console.log(`   Última grabación: ${data.last_recording}`);
      const lastDate = new Date(data.last_recording);
      const diffMinutes = Math.floor((Date.now() - lastDate.getTime()) / 1000 / 60);
      console.log(`   Hace: ${diffMinutes} minutos`);
    }
    
    return data;
  } catch (error) {
    console.log(`   ⚠️  No se pudo obtener estado del proceso: ${error.message}`);
    return null;
  }
}

// Ejecutar verificaciones
async function runChecks() {
  console.log('Iniciando verificaciones del VPS...\n');
  
  await checkVPSServerStatus();
  await checkVPSDiskSpace();
  await checkVPSRecordingDirectory();
  await checkVPSRecentErrors();
  await checkVPSRecordingProcess();
  
  console.log('\n📋 RESUMEN DE VERIFICACIÓN');
  console.log('==========================');
  console.log('Si los endpoints no están disponibles, es posible que el VPS');
  console.log('no tenga implementadas estas rutas de diagnóstico.');
  console.log('\nPróximos pasos recomendados:');
  console.log('1. Conectar por SSH al VPS: ssh root@213.199.39.147');
  console.log('2. Verificar servicio: systemctl status radio-recorder');
  console.log('3. Verificar logs: journalctl -u radio-recorder -f');
  console.log('4. Verificar disco: df -h');
  console.log('5. Verificar directorio: ls -la /home/radioapp/radio-recorder/recordings/');
}

runChecks().catch(console.error);