#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO DEL SISTEMA DE GRABACIÓN
 * 
 * Este script diagnostica el problema de grabación sin necesidad de acceso SSH directo
 * Utiliza la API del VPS para obtener información del sistema
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración
const VPS_IP = '213.199.39.147';
const VPS_PORT = 5000;
const BASE_URL = `http://${VPS_IP}:${VPS_PORT}`;

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function info(message) { log(colors.cyan, 'INFO', message); }
function success(message) { log(colors.green, '✓', message); }
function error(message) { log(colors.red, '✗', message); }
function warning(message) { log(colors.yellow, '⚠', message); }
function section(message) { 
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}${message}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
}

// Función para hacer peticiones HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

// 1. Verificar conectividad con el VPS
async function checkVPSConnection() {
  section('1. VERIFICANDO CONECTIVIDAD CON EL VPS');
  
  try {
    info(`Intentando conectar con ${BASE_URL}...`);
    const response = await makeRequest(`${BASE_URL}/api/recordings`);
    
    if (response.status === 200) {
      success(`VPS responde correctamente (Status: ${response.status})`);
      return true;
    } else {
      warning(`VPS responde con status inesperado: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`No se puede conectar con el VPS: ${err.message}`);
    error('Asegúrate de que el servidor esté corriendo en el VPS');
    return false;
  }
}

// 2. Verificar grabaciones activas
async function checkActiveRecordings() {
  section('2. VERIFICANDO GRABACIONES ACTIVAS');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/active-recordings`);
    
    if (response.status === 200 && response.data) {
      const active = response.data.active_recordings || {};
      const count = response.data.count || 0;
      
      if (count === 0) {
        warning('No hay grabaciones activas actualmente');
        return null;
      } else {
        success(`Hay ${count} grabación(es) activa(s):`);
        Object.entries(active).forEach(([radioId, recording]) => {
          console.log(`  📻 ${radioId}:`);
          console.log(`     - PID: ${recording.pid}`);
          console.log(`     - Radio: ${recording.radio_name}`);
          console.log(`     - URL: ${recording.radio_url}`);
          console.log(`     - ID Grabación: ${recording.recording_id}`);
          console.log(`     - Inicio: ${recording.start_time}`);
          console.log(`     - Estado: ${recording.status}`);
        });
        return active;
      }
    } else {
      error('Error al obtener grabaciones activas');
      return null;
    }
  } catch (err) {
    error(`Error: ${err.message}`);
    return null;
  }
}

// 3. Verificar archivos grabados
async function checkRecordedFiles() {
  section('3. VERIFICANDO ARCHIVOS GRABADOS');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/recordings`);
    
    if (response.status === 200 && Array.isArray(response.data)) {
      const files = response.data;
      
      if (files.length === 0) {
        warning('No hay archivos grabados en el sistema');
        info('Esto confirma el problema: las grabaciones se inician pero no generan archivos');
      } else {
        success(`Hay ${files.length} archivo(s) grabado(s):`);
        files.slice(-5).forEach(file => {
          console.log(`  📁 ${file.filename} (${file.size || 'N/A'}) - ${file.date || 'N/A'}`);
        });
      }
      
      return files;
    } else {
      error('Error al obtener lista de archivos');
      return [];
    }
  } catch (err) {
    error(`Error: ${err.message}`);
    return [];
  }
}

// 4. Probar una grabación manual
async function testManualRecording() {
  section('4. PROBANDO GRABACIÓN MANUAL (30 segundos)');
  
  const testData = {
    radio_id: 'test-diagnostic',
    radio_url: 'https://radio.digitalfm.cl:8000/arica',
    radio_name: 'Radio Test Diagnóstico',
    duration: 30 // 30 segundos
  };
  
  try {
    info('Iniciando grabación de prueba...');
    const startResponse = await makeRequest(`${BASE_URL}/api/start-recording`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (startResponse.status === 200) {
      success('Grabación iniciada correctamente');
      console.log(`   ID: ${startResponse.data.recording_id}`);
      console.log(`   PID: ${startResponse.data.pid}`);
      
      // Esperar 35 segundos
      info('Esperando 35 segundos para que se complete la grabación...');
      await new Promise(resolve => setTimeout(resolve, 35000));
      
      // Verificar si se creó el archivo
      const filesResponse = await makeRequest(`${BASE_URL}/api/recordings`);
      const files = filesResponse.data || [];
      
      const testFile = files.find(f => f.filename && f.filename.includes('test-diagnostic'));
      
      if (testFile) {
        success('✅ ARCHIVO CREADO CORRECTAMENTE!');
        console.log(`   📁 ${testFile.filename}`);
        console.log(`   📊 Tamaño: ${testFile.size || 'N/A'}`);
      } else {
        error('❌ NO SE CREÓ EL ARCHIVO - ESTE ES EL PROBLEMA PRINCIPAL');
        info('El proceso se inicia pero ffmpeg falla al crear el archivo');
      }
      
      return testFile;
    } else {
      error(`Error al iniciar grabación: ${startResponse.status}`);
      return null;
    }
  } catch (err) {
    error(`Error durante la prueba: ${err.message}`);
    return null;
  }
}

// 5. Verificar logs del sistema
async function checkSystemLogs() {
  section('5. VERIFICANDO LOGS DEL SISTEMA');
  
  try {
    // Intentar obtener el último log de error
    const response = await makeRequest(`${BASE_URL}/api/recordings`);
    const files = response.data || [];
    
    // Buscar archivos log recientes
    const logFiles = files.filter(f => f.filename && f.filename.endsWith('.log'));
    
    if (logFiles.length > 0) {
      info(`Encontrados ${logFiles.length} archivos log`);
      // Mostrar el más reciente
      const latestLog = logFiles.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
      })[0];
      
      console.log(`   Último log: ${latestLog.filename}`);
      
      // Intentar descargar el log
      try {
        const logContent = await makeRequest(`${BASE_URL}/api/download/${latestLog.filename}`);
        if (logContent.data) {
          console.log(`   Contenido del log:`);
          console.log(`   ${'-'.repeat(60)}`);
          const lines = String(logContent.data).split('\n').slice(-10);
          lines.forEach(line => console.log(`   ${line}`));
          console.log(`   ${'-'.repeat(60)}`);
        }
      } catch (e) {
        warning('No se pudo descargar el contenido del log');
      }
    } else {
      warning('No se encontraron archivos log');
      info('Esto sugiere que el script ni siquiera llega a crear los logs');
    }
  } catch (err) {
    error(`Error al verificar logs: ${err.message}`);
  }
}

// 6. Verificar el script de grabación
async function checkRecordingScript() {
  section('6. VERIFICANDO SCRIPT DE GRABACIÓN');
  
  info('El problema más común es que el script record_radio.sh:');
  console.log('   1. No tiene el flag -k en ffmpeg');
  console.log('   2. Tiene errores de sintaxis');
  console.log('   3. No tiene permisos de ejecución');
  console.log('   4. No puede crear archivos en el directorio recordings/');
  console.log('');
  
  warning('Para verificar esto, necesitas ejecutar comandos en el VPS:');
  console.log('');
  console.log('   🔧 COMANDOS A EJECUTAR EN EL VPS:');
  console.log('   ' + '-'.repeat(60));
  console.log('   ssh radioapp@213.199.39.147');
  console.log('   cd /home/radioapp/radio-recorder');
  console.log('   # Verificar permisos del script');
  console.log('   ls -la scripts/record_radio.sh');
  console.log('   # Verificar contenido del script');
  console.log('   grep "ffmpeg" scripts/record_radio.sh');
  console.log('   # Verificar directorio de grabaciones');
  console.log('   ls -ld recordings/');
  console.log('   # Probar comando ffmpeg manualmente');
  console.log('   timeout 10 ffmpeg -k -i "https://radio.digitalfm.cl:8000/arica" -t 10 -c copy -y test.mp3');
  console.log('   # Verificar si se creó el archivo');
  console.log('   ls -lh test.mp3');
  console.log('   ' + '-'.repeat(60));
}

// Función principal
async function main() {
  console.log(`${colors.green}
╔═══════════════════════════════════════════════════════════════╗
║       DIAGNÓSTICO COMPLETO - SISTEMA DE GRABACIÓN            ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  // Paso 1: Conectividad
  const isConnected = await checkVPSConnection();
  if (!isConnected) {
    error('No se puede continuar sin conexión al VPS');
    process.exit(1);
  }
  
  // Paso 2: Grabaciones activas
  const activeRecordings = await checkActiveRecordings();
  
  // Paso 3: Archivos grabados
  const recordedFiles = await checkRecordedFiles();
  
  // Paso 4: Si no hay archivos, probar grabación manual
  if (recordedFiles.length === 0) {
    warning('No hay archivos grabados. Procediendo con prueba manual...');
    await testManualRecording();
  }
  
  // Paso 5: Verificar logs
  await checkSystemLogs();
  
  // Paso 6: Instrucciones para verificar script
  await checkRecordingScript();
  
  // Resumen final
  section('📋 RESUMEN DEL DIAGNÓSTICO');
  
  if (recordedFiles.length === 0) {
    error('❌ PROBLEMA CONFIRMADO: Las grabaciones se inician pero NO generan archivos');
    console.log('');
    console.log('${colors.yellow}Causas más probables:${colors.reset}');
    console.log('1. El script record_radio.sh NO tiene el flag -k en ffmpeg');
    console.log('2. Error de sintaxis en el script');
    console.log('3. Problemas de permisos en el directorio recordings/');
    console.log('');
    console.log('${colors.cyan}Solución inmediata:${colors.reset}');
    console.log('Ejecuta los comandos mostrados en el Paso 6 para verificar el script');
    console.log('Luego edita el script para asegurar que ffmpeg tenga el flag -k:');
    console.log('${colors.green}timeout $BLOCK_DURATION ffmpeg -k -i "$RADIO_URL" ...${colors.reset}');
  } else {
    success('✅ El sistema de grabación está funcionando correctamente');
    console.log('Los archivos se están creando en el VPS');
  }
  
  console.log('');
  success('Diagnóstico completado. Revisa los resultados anteriores.');
}

// Ejecutar diagnóstico
main().catch(err => {
  error(`Error inesperado: ${err.message}`);
  process.exit(1);
});