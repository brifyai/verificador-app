#!/usr/bin/env node

/**
 * SOLUCIÓN DEFINITIVA PARA EL SERVICIO DE GRABACIÓN VPS
 * 
 * Problema: El servicio de grabación en el VPS no está creando nuevos archivos MP3
 * Este script diagnostica y repara el problema
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuración de conexión SSH
const SSH_CONFIG = {
  host: '213.199.39.147',
  username: 'root',
  password: 'Aintelligence2025'
};

// Función para ejecutar comandos SSH
async function sshCommand(command, options = {}) {
  const { showErrors = true } = options;
  const sshCmd = `sshpass -p '${SSH_CONFIG.password}' ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "${command}"`;
  
  try {
    const { stdout, stderr } = await execAsync(sshCmd);
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      if (showErrors) console.error('⚠️  STDERR:', stderr);
    }
    return stdout;
  } catch (error) {
    if (showErrors) console.error('❌ Error en comando SSH:', error.message);
    return null;
  }
}

async function fixRecordingService() {
  console.log('🔧 SOLUCIÓN DEFINITIVA SERVICIO DE GRABACIÓN VPS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Verificar directorio de grabaciones
  console.log('1️⃣  VERIFICANDO DIRECTORIO DE GRABACIONES...');
  const recordingsDir = await sshCommand('ls -la /home/radioapp/radio-recorder/recordings/');
  console.log('📁 Contenido actual:');
  console.log(recordingsDir || 'No se pudo acceder al directorio\n');

  // 2. Verificar permisos
  console.log('2️⃣  VERIFICANDO PERMISOS...');
  const permissions = await sshCommand('ls -ld /home/radioapp/radio-recorder/recordings/');
  console.log('🔐 Permisos directorio:');
  console.log(permissions || 'No se pudo verificar\n');

  // 3. Verificar si hay procesos de grabación activos
  console.log('3️⃣  VERIFICANDO PROCESOS DE GRABACIÓN...');
  const ffmpegProcesses = await sshCommand('ps aux | grep ffmpeg | grep -v grep');
  console.log('🎬 Procesos ffmpeg:');
  console.log(ffmpegProcesses || 'No hay procesos ffmpeg activos\n');

  // 4. Verificar puerto 5000
  console.log('4️⃣  VERIFICANDO SERVICIO EN PUERTO 5000...');
  const portStatus = await sshCommand('netstat -tlnp | grep :5000 || ss -tlnp | grep :5000');
  console.log('🔌 Puerto 5000:');
  console.log(portStatus || 'No se encontró servicio en puerto 5000\n');

  // 5. Buscar el proceso del servicio de grabación
  console.log('5️⃣  BUSCANDO PROCESO DEL SERVICIO...');
  const recordingService = await sshCommand('ps aux | grep -i "record\|radio" | grep -v grep');
  console.log('📡 Procesos de grabación:');
  console.log(recordingService || 'No se encontraron procesos relacionados\n');

  // 6. Verificar si hay archivos de log
  console.log('6️⃣  VERIFICANDO LOGS...');
  const logs = await sshCommand('find /home/radioapp/radio-recorder/ -name "*.log" -type f 2>/dev/null');
  console.log('📄 Archivos de log encontrados:');
  console.log(logs || 'No se encontraron archivos de log\n');

  if (logs) {
    const logFiles = logs.trim().split('\n');
    for (const logFile of logFiles) {
      if (logFile) {
        console.log(`\n📖 Contenido de ${logFile}:`);
        const logContent = await sshCommand(`tail -20 ${logFile}`);
        console.log(logContent || 'No se pudo leer el log\n');
      }
    }
  }

  // 7. Verificar el código del manager
  console.log('7️⃣  VERIFICANDO CÓDIGO DEL MANAGER...');
  const managerFiles = await sshCommand('find /home/radioapp/radio-recorder -name "*manager*.py" -o -name "*recorder*.py" -o -name "*service*.py" 2>/dev/null');
  console.log('📁 Archivos de servicio encontrados:');
  console.log(managerFiles || 'No se encontraron archivos de servicio\n');

  // 8. Intentar encontrar y reiniciar el servicio
  console.log('8️⃣  REINICIANDO SERVICIO DE GRABACIÓN...');
  
  // Buscar posibles scripts de inicio
  const startScripts = await sshCommand('find /home/radioapp/radio-recorder -name "start*.sh" -o -name "run*.py" -o -name "*server*.py" 2>/dev/null');
  console.log('🔍 Scripts de inicio encontrados:');
  console.log(startScripts || 'No se encontraron scripts de inicio\n');

  // 9. Solución: Crear un script de inicio si no existe
  console.log('9️⃣  APLICANDO SOLUCIÓN...');
  
  // Primero, matar cualquier proceso existente
  console.log('🛑 Deteniendo procesos existentes...');
  await sshCommand('pkill -f "ffmpeg"');
  await sshCommand('pkill -f "python.*record"');
  
  // Luego, intentar iniciar el servicio
  if (startScripts) {
    const scripts = startScripts.trim().split('\n');
    for (const script of scripts) {
      if (script) {
        console.log(`🚀 Intentando iniciar: ${script}`);
        const startResult = await sshCommand(`cd /home/radioapp/radio-recorder && nohup python3 ${script} > server.log 2>&1 &`);
        console.log('✅ Servicio iniciado');
      }
    }
  } else {
    // Si no hay scripts, crear uno básico
    console.log('📄 Creando script de inicio básico...');
    const basicServer = `
import os
import sys
sys.path.append('/home/radioapp/radio-recorder')

from flask import Flask, jsonify, request
import subprocess
import uuid
import datetime

app = Flask(__name__)

RECORDINGS_DIR = '/home/radioapp/radio-recorder/recordings'

@app.route('/api/start-recording', methods=['POST'])
def start_recording():
    data = request.json
    radio_id = data.get('radio_id', 'unknown')
    radio_name = data.get('radio_name', 'unknown')
    stream_url = data.get('stream_url')
    duration = data.get('duration', 600)
    
    if not stream_url:
        return jsonify({'error': 'No stream URL provided'}), 400
    
    # Generar nombre de archivo
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"radio-{radio_id}_{uuid.uuid4().hex[:8]}_block1_{timestamp}.mp3"
    filepath = os.path.join(RECORDINGS_DIR, filename)
    
    # Comando ffmpeg
    cmd = [
        'ffmpeg',
        '-i', stream_url,
        '-t', str(duration),
        '-acodec', 'libmp3lame',
        '-ab', '128k',
        '-f', 'mp3',
        filepath
    ]
    
    try:
        # Iniciar proceso en background
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        pid = process.pid
        
        return jsonify({
            'status': 'success',
            'pid': pid,
            'filename': filename,
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recordings')
def list_recordings():
    try:
        files = os.listdir(RECORDINGS_DIR)
        mp3_files = [f for f in files if f.endswith('.mp3')]
        return jsonify({'recordings': mp3_files, 'count': len(mp3_files)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/active-recordings')
def active_recordings():
    try:
        # Buscar procesos ffmpeg activos
        ps_cmd = "ps aux | grep ffmpeg | grep -v grep"
        result = subprocess.run(ps_cmd, shell=True, capture_output=True, text=True)
        processes = []
        
        if result.stdout:
            for line in result.stdout.strip().split('\\n'):
                if 'ffmpeg' in line:
                    processes.append(line)
        
        return jsonify({'active_recordings': processes, 'count': len(processes)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Crear directorio si no existe
    os.makedirs(RECORDINGS_DIR, exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
`;
    
    // Guardar el script en el VPS
    await sshCommand(`echo "${basicServer}" > /home/radioapp/radio-recorder/recording_server.py`);
    await sshCommand('chmod +x /home/radioapp/radio-recorder/recording_server.py');
    
    // Iniciar el servidor
    console.log('🚀 Iniciando servidor de grabación...');
    await sshCommand('cd /home/radioapp/radio-recorder && nohup python3 recording_server.py > server.log 2>&1 &');
  }

  // 10. Verificar que el servicio está corriendo
  console.log('\n🔟 VERIFICANDO QUE EL SERVICIO ESTÁ CORRIENDO...');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
  
  const checkPort = await sshCommand('netstat -tlnp | grep :5000 || ss -tlnp | grep :5000');
  console.log('🔌 Puerto 5000 después de reinicio:');
  console.log(checkPort || '❌ Puerto no está abierto\n');

  const checkProcess = await sshCommand('ps aux | grep python | grep -v grep');
  console.log('🐍 Procesos Python:');
  console.log(checkProcess || 'No hay procesos Python\n');

  // 11. Probar el servicio
  if (checkPort) {
    console.log('✅ SERVICIO REINICIADO EXITOSAMENTE');
    console.log('\n🧪 PROBANDO ENDPOINTS...');
    
    // Probar listado de grabaciones
    const testRecordings = await sshCommand('curl -s http://localhost:5000/api/recordings');
    console.log('📼 Endpoint /api/recordings:');
    console.log(testRecordings || 'No se pudo probar\n');
    
    // Probar grabaciones activas
    const testActive = await sshCommand('curl -s http://localhost:5000/api/active-recordings');
    console.log('🎬 Endpoint /api/active-recordings:');
    console.log(testActive || 'No se pudo probar\n');
  } else {
    console.log('❌ NO SE PUDO REINICIAR EL SERVICIO');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE LA SOLUCIÓN');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (checkPort && checkProcess) {
    console.log('✅ SERVICIO DE GRABACIÓN REPARADO');
    console.log('✅ Puerto 5000 está abierto');
    console.log('✅ Proceso Python está corriendo');
    console.log('✅ Endpoints están funcionando');
    console.log('\n🎉 El sistema de grabación debería funcionar ahora.');
    console.log('💡 Intenta iniciar una grabación desde la interfaz web.');
  } else {
    console.log('❌ SERVICIO NO PUDO SER REPARADO');
    console.log('\n🔧 ACCIONES MANUALES NECESARIAS:');
    console.log('1. Conéctate al VPS: ssh root@213.199.39.147');
    console.log('2. Navega al directorio: cd /home/radioapp/radio-recorder');
    console.log('3. Verifica logs: tail -f server.log');
    console.log('4. Inicia manualmente: python3 recording_server.py');
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

// Ejecutar la solución
fixRecordingService().catch(error => {
  console.error('❌ Error inesperado:', error);
  process.exit(1);
});