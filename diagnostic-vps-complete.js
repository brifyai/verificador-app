#!/usr/bin/env node

/**
 * Script de diagnóstico COMPLETO para VPS y sistema de grabaciones
 * Identifica problemas de conectividad, permisos y configuración
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const VPS_HOST = '213.199.39.147';
const VPS_USER = 'root';
const VPS_KEY = path.join(process.env.HOME, '.ssh', 'id_rsa');
const VPS_DIR = '/home/radioapp/radio-recorder';

console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DEL SISTEMA DE GRABACIONES\n');

// Función para ejecutar comandos SSH
function sshCommand(command) {
  try {
    const fullCommand = `ssh -i ${VPS_KEY} ${VPS_USER}@${VPS_HOST} "${command}"`;
    return execSync(fullCommand, { encoding: 'utf8' }).trim();
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

// Función para ejecutar comandos locales
function localCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

// 1. Verificar conectividad con VPS
console.log('📡 1. VERIFICANDO CONECTIVIDAD CON VPS');
console.log('═══════════════════════════════════════');
try {
  const pingResult = localCommand(`ping -c 3 ${VPS_HOST}`);
  console.log('✅ VPS responde a ping');
} catch (error) {
  console.log('❌ VPS NO responde a ping');
}

const sshTest = sshCommand('echo "Conexión SSH exitosa"');
if (sshTest.includes('Conexión SSH exitosa')) {
  console.log('✅ Conexión SSH funciona correctamente');
} else {
  console.log('❌ Conexión SSH fallida:', sshTest);
}

// 2. Verificar estado del servicio Flask
console.log('\n🐍 2. VERIFICANDO SERVICIO FLASK');
console.log('═══════════════════════════════════════');
const flaskProcess = sshCommand('ps aux | grep -E "python.*api_server.py" | grep -v grep');
if (flaskProcess) {
  console.log('✅ Proceso Flask está corriendo:');
  console.log(flaskProcess.split('\n')[0]);
} else {
  console.log('❌ Proceso Flask NO está corriendo');
}

const portCheck = sshCommand('netstat -tlnp | grep :5000');
if (portCheck) {
  console.log('✅ Puerto 5000 está escuchando:');
  console.log(portCheck);
} else {
  console.log('❌ Puerto 5000 NO está escuchando');
}

// 3. Verificar directorio de grabaciones
console.log('\n📁 3. VERIFICANDO DIRECTORIO DE GRABACIONES');
console.log('═══════════════════════════════════════');
const recordingsDir = sshCommand(`ls -la ${VPS_DIR}/recordings/`);
console.log('Contenido del directorio de grabaciones:');
console.log(recordingsDir);

const fileCount = sshCommand(`find ${VPS_DIR}/recordings/ -name "*.mp3" -type f | wc -l`);
console.log(`\n📊 Número total de archivos MP3: ${fileCount}`);

// 4. Verificar permisos
console.log('\n🔐 4. VERIFICANDO PERMISOS');
console.log('═══════════════════════════════════════');
const permissions = sshCommand(`ls -ld ${VPS_DIR}/recordings/`);
console.log('Permisos del directorio:', permissions);

const userCheck = sshCommand('whoami');
console.log('Usuario actual en VPS:', userCheck);

// 5. Verificar logs del servicio
console.log('\n📝 5. VERIFICANDO LOGS DEL SERVICIO');
console.log('═══════════════════════════════════════');
const logs = sshCommand(`cd ${VPS_DIR} && tail -n 20 nohup.out 2>/dev/null || echo "No hay archivo nohup.out"`);
console.log('Últimas líneas de logs:');
console.log(logs);

// 6. Probar endpoints de la API
console.log('\n🌐 6. PROBANDO ENDPOINTS DE LA API');
console.log('═══════════════════════════════════════');

// Función para testear endpoint
function testEndpoint(endpoint) {
  try {
    const curlCommand = `curl -s -w "\\nHTTP_CODE:%{http_code}" http://${VPS_HOST}:5000${endpoint}`;
    const result = localCommand(curlCommand);
    const [body, httpCode] = result.split('HTTP_CODE:');
    return { body, httpCode: parseInt(httpCode) };
  } catch (error) {
    return { body: error.message, httpCode: 0 };
  }
}

console.log('Testing /api/recordings...');
const recordingsTest = testEndpoint('/api/recordings');
console.log(`Código HTTP: ${recordingsTest.httpCode}`);
if (recordingsTest.httpCode === 200) {
  try {
    const data = JSON.parse(recordingsTest.body);
    console.log(`✅ Endpoint funciona. Grabaciones encontradas: ${data.recordings?.length || 0}`);
  } catch (e) {
    console.log('❌ Respuesta inválida:', recordingsTest.body.substring(0, 200));
  }
} else {
  console.log('❌ Endpoint falló:', recordingsTest.body);
}

console.log('\nTesting /api/active-recordings...');
const activeTest = testEndpoint('/api/active-recordings');
console.log(`Código HTTP: ${activeTest.httpCode}`);
if (activeTest.httpCode === 200) {
  console.log('✅ Endpoint de grabaciones activas funciona');
} else {
  console.log('❌ Endpoint falló:', activeTest.body);
}

// 7. Verificar espacio en disco
console.log('\n💾 7. VERIFICANDO ESPACIO EN DISCO');
console.log('═══════════════════════════════════════');
const diskSpace = sshCommand('df -h /home');
console.log('Espacio en disco:');
console.log(diskSpace);

// 8. Verificar configuración de firewall
console.log('\n🔥 8. VERIFICANDO FIREWALL');
console.log('═══════════════════════════════════════');
const firewall = sshCommand('ufw status | grep 5000 || echo "Puerto 5000 no configurado en UFW"');
console.log('Estado del firewall:', firewall);

// 9. Resumen de problemas identificados
console.log('\n📋 9. RESUMEN DE PROBLEMAS IDENTIFICADOS');
console.log('═══════════════════════════════════════');

const issues = [];

if (!flaskProcess) issues.push('❌ Servicio Flask no está corriendo');
if (!portCheck) issues.push('❌ Puerto 5000 no está escuchando');
if (parseInt(fileCount) === 0) issues.push('❌ No hay archivos MP3 en el directorio');
if (recordingsTest.httpCode !== 200) issues.push('❌ Endpoint /api/recordings no responde');
if (activeTest.httpCode !== 200) issues.push('❌ Endpoint /api/active-recordings no responde');

if (issues.length === 0) {
  console.log('✅ No se identificaron problemas críticos');
} else {
  issues.forEach(issue => console.log(issue));
}

console.log('\n🔧 RECOMENDACIONES:');
console.log('═══════════════════════════════════════');
if (issues.includes('❌ Servicio Flask no está corriendo')) {
  console.log('1. Reiniciar servicio Flask:');
  console.log(`   cd ${VPS_DIR} && nohup python api_server.py > nohup.out 2>&1 &`);
}
if (issues.includes('❌ No hay archivos MP3 en el directorio')) {
  console.log('2. Verificar proceso FFmpeg y permisos de escritura');
}
if (issues.includes('❌ Endpoint /api/recordings no responde')) {
  console.log('3. Verificar logs del servicio para errores específicos');
}

console.log('\n📊 DIAGNÓSTICO COMPLETADO');
console.log('═══════════════════════════════════════');