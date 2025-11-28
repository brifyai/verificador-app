#!/usr/bin/env node

/**
 * Diagnóstico completo del sistema de almacenamiento de grabaciones
 * Identifica por qué los archivos MP3 no se están guardando a pesar de que el estado es "RECORDING"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const VPS_HOST = '213.199.39.147';
const VPS_USER = 'root';
const VPS_PASS = 'Aintelligence2025';
const RECORDING_SCRIPT_PATH = '/home/radioapp/radio-recorder/scripts/record_radio.sh';
const RECORDINGS_DIR = '/home/radioapp/radio-recorder/recordings';
const LOGS_DIR = '/home/radioapp/radio-recorder/logs';

// Función para ejecutar comandos SSH
function sshCommand(command, description) {
  console.log(`\n🔍 ${description}...`);
  try {
    const fullCommand = `sshpass -p '${VPS_PASS}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${command}"`;
    const result = execSync(fullCommand, { encoding: 'utf8' });
    console.log(`✅ ${description}:`, result.trim());
    return result.trim();
  } catch (error) {
    console.log(`❌ ${description} - Error:`, error.message);
    return null;
  }
}

// Función para verificar archivo remoto
function checkRemoteFile(filePath, description) {
  console.log(`\n📄 ${description}...`);
  const result = sshCommand(`test -f ${filePath} && echo "EXISTS" || echo "NOT_FOUND"`, `Verificando ${filePath}`);
  return result === 'EXISTS';
}

// Función para leer archivo remoto
function readRemoteFile(filePath, description) {
  console.log(`\n📖 ${description}...`);
  return sshCommand(`cat ${filePath}`, `Leyendo ${filePath}`);
}

// Función principal de diagnóstico
async function diagnoseRecordingStorage() {
  console.log('🚨 DIAGNÓSTICO DE ALMACENAMIENTO DE GRABACIONES');
  console.log('===========================================');
  console.log('Fecha:', new Date().toISOString());
  console.log('VPS:', VPS_HOST);
  console.log('ID de Grabación Actual: 0dd240b7-0b37-41c9-ae46-3f91d1092a6a');
  
  // 1. Verificar proceso FFmpeg real
  console.log('\n🎬 1. VERIFICANDO PROCESO FFMPEG REAL');
  console.log('--------------------------------------');
  const ffmpegProcesses = sshCommand(
    "ps aux | grep -E 'ffmpeg.*radio-1.*arica' | grep -v grep",
    'Buscando proceso FFmpeg para radio-1'
  );
  
  if (!ffmpegProcesses || ffmpegProcesses.length === 0) {
    console.log('❌ CRÍTICO: No se encontró ningún proceso FFmpeg activo para radio-1');
    console.log('   El sistema reporta "RECORDING" pero FFmpeg no está ejecutándose');
  } else {
    console.log('✅ Proceso FFmpeg encontrado:', ffmpegProcesses);
    
    // Extraer detalles del comando FFmpeg
    const ffmpegCommand = ffmpegProcesses;
    if (ffmpegCommand.includes('output')) {
      const outputMatch = ffmpegCommand.match(/output\s+(\S+)/);
      if (outputMatch) {
        console.log('📁 Archivo de salida esperado:', outputMatch[1]);
      }
    }
  }

  // 2. Verificar script de grabación
  console.log('\n📝 2. VERIFICANDO SCRIPT DE GRABACIÓN');
  console.log('--------------------------------------');
  
  // Verificar si el script existe
  const scriptExists = checkRemoteFile(RECORDING_SCRIPT_PATH, 'Script de grabación');
  if (!scriptExists) {
    console.log('❌ CRÍTICO: El script de grabación no existe');
  } else {
    // Leer el script
    const scriptContent = readRemoteFile(RECORDING_SCRIPT_PATH, 'Contenido del script');
    if (scriptContent) {
      console.log('Contenido del script:');
      console.log(scriptContent);
      
      // Verificar shebang
      if (!scriptContent.startsWith('#!/bin/bash')) {
        console.log('❌ CRÍTICO: El shebang no está en la primera línea');
      } else {
        console.log('✅ Shebang correcto');
      }
      
      // Verificar comandos FFmpeg
      if (!scriptContent.includes('ffmpeg')) {
        console.log('❌ CRÍTICO: No se encontró comando ffmpeg en el script');
      } else {
        console.log('✅ Comando ffmpeg encontrado en el script');
      }
    }
  }

  // 3. Verificar directorios de grabación
  console.log('\n📂 3. VERIFICANDO DIRECTORIOS DE GRABACIÓN');
  console.log('------------------------------------------');
  
  // Verificar existencia del directorio principal
  const recordingsDirExists = sshCommand(
    `test -d ${RECORDINGS_DIR} && echo "EXISTS" || echo "NOT_FOUND"`,
    'Directorio de grabaciones'
  ) === 'EXISTS';
  
  if (!recordingsDirExists) {
    console.log('❌ CRÍTICO: El directorio de grabaciones no existe');
  } else {
    console.log('✅ Directorio de grabaciones existe');
    
    // Verificar permisos
    const dirPermissions = sshCommand(
      `ls -ld ${RECORDINGS_DIR}`,
      'Permisos del directorio'
    );
    console.log('Permisos:', dirPermissions);
    
    // Verificar espacio en disco
    const diskSpace = sshCommand(
      `df -h ${RECORDINGS_DIR}`,
      'Espacio en disco'
    );
    console.log('Espacio en disco:\n', diskSpace);
    
    // Verificar archivos recientes (últimos 30 minutos)
    console.log('\n📅 Buscando archivos MP3 recientes...');
    const recentFiles = sshCommand(
      `find ${RECORDINGS_DIR} -name "*.mp3" -mmin -30 -ls 2>/dev/null || echo "No files found"`,
      'Archivos MP3 de los últimos 30 minutos'
    );
    
    if (recentFiles && recentFiles !== 'No files found') {
      console.log('✅ Archivos MP3 recientes encontrados:');
      console.log(recentFiles);
    } else {
      console.log('❌ CRÍTICO: No se encontraron archivos MP3 en los últimos 30 minutos');
      console.log('   Esto confirma que las grabaciones no se están guardando');
    }
    
    // Verificar estructura de directorios
    console.log('\n📁 Estructura de directorios:');
    const dirStructure = sshCommand(
      `find ${RECORDINGS_DIR} -type d | head -20`,
      'Estructura de directorios'
    );
    console.log(dirStructure);
  }

  // 4. Verificar logs de grabación
  console.log('\n🪵 4. VERIFICANDO LOGS DE GRABACIÓN');
  console.log('------------------------------------');
  
  const logsDirExists = sshCommand(
    `test -d ${LOGS_DIR} && echo "EXISTS" || echo "NOT_FOUND"`,
    'Directorio de logs'
  ) === 'EXISTS';
  
  if (!logsDirExists) {
    console.log('❌ CRÍTICO: El directorio de logs no existe');
  } else {
    console.log('✅ Directorio de logs existe');
    
    // Verificar log del recording_id actual
    const currentLogPath = `${LOGS_DIR}/0dd240b7-0b37-41c9-ae46-3f91d1092a6a.log`;
    const logExists = checkRemoteFile(currentLogPath, 'Log de grabación actual');
    
    if (logExists) {
      const logContent = readRemoteFile(currentLogPath, 'Contenido del log');
      console.log('Contenido del log:');
      console.log(logContent);
      
      // Buscar errores en el log
      if (logContent && logContent.includes('error')) {
        console.log('❌ Se encontraron errores en el log');
      } else {
        console.log('✅ No se encontraron errores en el log');
      }
    } else {
      console.log('❌ CRÍTICO: No existe el log para la grabación actual');
      console.log('   Esto indica que el script de grabación nunca se ejecutó correctamente');
    }
    
    // Verificar logs recientes
    console.log('\n📅 Logs recientes:');
    const recentLogs = sshCommand(
      `ls -lt ${LOGS_DIR}/*.log 2>/dev/null | head -5`,
      'Logs recientes'
    );
    console.log(recentLogs || 'No logs found');
  }

  // 5. Verificar permisos y ejecutabilidad
  console.log('\n🔐 5. VERIFICANDO PERMISOS Y EJECUTABILIDAD');
  console.log('-------------------------------------------');
  
  // Verificar permisos del script
  const scriptPermissions = sshCommand(
    `ls -l ${RECORDING_SCRIPT_PATH}`,
    'Permisos del script'
  );
  console.log('Permisos del script:', scriptPermissions);
  
  // Verificar si el script es ejecutable
  const isExecutable = sshCommand(
    `test -x ${RECORDING_SCRIPT_PATH} && echo "YES" || echo "NO"`,
    'Script es ejecutable'
  ) === 'YES';
  
  if (!isExecutable) {
    console.log('❌ CRÍTICO: El script no es ejecutable');
  } else {
    console.log('✅ El script es ejecutable');
  }
  
  // Verificar permisos de directorios
  const canWriteToRecordings = sshCommand(
    `sudo -u radioapp test -w ${RECORDINGS_DIR} && echo "YES" || echo "NO"`,
    'Usuario radioapp puede escribir en grabaciones'
  ) === 'YES';
  
  if (!canWriteToRecordings) {
    console.log('❌ CRÍTICO: El usuario radioapp no puede escribir en el directorio de grabaciones');
  } else {
    console.log('✅ El usuario radioapp puede escribir en el directorio de grabaciones');
  }

  // 6. Verificar servicio Flask
  console.log('\n🐍 6. VERIFICANDO SERVICIO FLASK');
  console.log('---------------------------------');
  
  const flaskProcess = sshCommand(
    "ps aux | grep -E 'python.*app\\.py' | grep -v grep",
    'Proceso Flask'
  );
  
  if (!flaskProcess) {
    console.log('❌ CRÍTICO: El servicio Flask no está ejecutándose');
  } else {
    console.log('✅ Servicio Flask ejecutándose:', flaskProcess);
  }

  // 7. Verificar conectividad del stream
  console.log('\n🌐 7. VERIFICANDO CONECTIVIDAD DEL STREAM');
  console.log('------------------------------------------');
  
  const streamUrl = 'https://radio.digitalfm.cl:8000/arica';
  const streamCheck = sshCommand(
    `timeout 10 ffmpeg -i "${streamUrl}" -t 1 -f null - 2>&1 | grep -E 'Input|error|Invalid'`,
    'Verificando stream de radio'
  );
  
  if (streamCheck && streamCheck.includes('error')) {
    console.log('❌ CRÍTICO: Error conectando al stream de radio');
    console.log('Stream check result:', streamCheck);
  } else {
    console.log('✅ Stream de radio accesible');
  }

  // 8. Resumen y recomendaciones
  console.log('\n📋 8. RESUMEN DEL DIAGNÓSTICO');
  console.log('==============================');
  
  console.log('\n🔍 PROBLEMAS IDENTIFICADOS:');
  console.log('   1. El sistema reporta "RECORDING" pero no hay archivos MP3');
  console.log('   2. Posibles causas:');
  console.log('      a) FFmpeg no está ejecutándose realmente');
  console.log('      b) El script de grabación falla antes de crear el archivo');
  console.log('      c) Problemas de permisos en el directorio de salida');
  console.log('      d) El stream de audio no está siendo capturado');
  console.log('      e) El script tiene errores de sintaxis');
  
  console.log('\n💡 PRÓXIMOS PASOS RECOMENDADOS:');
  console.log('   1. Ejecutar el script manualmente para ver errores en tiempo real');
  console.log('   2. Verificar logs del sistema: journalctl -u radio-recorder');
  console.log('   3. Probar comando FFmpeg manualmente');
  console.log('   4. Verificar permisos de directorio con ls -laR');
  console.log('   5. Revisar el shebang y sintaxis del script');

  console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
  console.log('==========================');
}

// Ejecutar diagnóstico
diagnoseRecordingStorage().catch(console.error);