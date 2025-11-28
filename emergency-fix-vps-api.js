#!/usr/bin/env node

/**
 * Script de emergencia para restaurar el API Server de Flask en el VPS
 * 
 * PROBLEMA IDENTIFICADO:
 * - El archivo api_server.py está corrupto con código insertado incorrectamente
 * - El entorno virtual puede estar dañado
 * - El servicio está en ciclo de fallo constante
 * 
 * SOLUCIÓN:
 * 1. Detener el servicio
 * 2. Verificar y restaurar api_server.py
 * 3. Verificar entorno virtual
 * 4. Reiniciar servicio
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const VPS_HOST = '213.199.39.147';
const VPS_USER = 'root';
const VPS_PASSWORD = 'Aintelligence2025';
const REMOTE_DIR = '/home/radioapp/radio-recorder';
const SCRIPTS_DIR = `${REMOTE_DIR}/scripts`;

// Código limpio para api_server.py
const CLEAN_API_SERVER_CODE = `#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from radio_manager import RadioManager
import os
import logging
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('/home/radioapp/radio-recorder/.env')

app = Flask(__name__)
CORS(app)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Inicializar manager
manager = RadioManager()

# Configuración
RECORDINGS_DIR = os.getenv('RECORDINGS_DIR')
API_HOST = os.getenv('API_HOST', '0.0.0.0')
API_PORT = int(os.getenv('API_PORT', 5000))

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "radio-recorder"})

@app.route('/api/radios', methods=['GET'])
def get_radios():
    """Obtener lista de radios disponibles"""
    try:
        radios = manager.get_available_radios()
        return jsonify({
            "status": "success",
            "radios": radios,
            "count": len(radios)
        })
    except Exception as e:
        logging.error(f"Error obteniendo radios: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/start-recording', methods=['POST'])
def start_recording():
    """Iniciar grabación de una radio"""
    try:
        data = request.json
        radio_id = data.get('radio_id')
        
        if not radio_id:
            return jsonify({"status": "error", "message": "radio_id es requerido"}), 400
        
        result = manager.start_recording(radio_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error iniciando grabación: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/pause-recording', methods=['POST'])
def pause_recording():
    """Pausar grabación de una radio"""
    try:
        data = request.json
        radio_id = data.get('radio_id')
        
        if not radio_id:
            return jsonify({"status": "error", "message": "radio_id es requerido"}), 400
        
        result = manager.pause_recording(radio_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error pausando grabación: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/resume-recording', methods=['POST'])
def resume_recording():
    """Reanudar grabación de una radio"""
    try:
        data = request.json
        radio_id = data.get('radio_id')
        
        if not radio_id:
            return jsonify({"status": "error", "message": "radio_id es requerido"}), 400
        
        result = manager.resume_recording(radio_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error reanudando grabación: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/stop-recording', methods=['POST'])
def stop_recording():
    """Detener grabación de una radio"""
    try:
        data = request.json
        radio_id = data.get('radio_id')
        
        if not radio_id:
            return jsonify({"status": "error", "message": "radio_id es requerido"}), 400
        
        result = manager.stop_recording(radio_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error deteniendo grabación: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/active-recordings', methods=['GET'])
def get_active_recordings():
    """Obtener grabaciones activas"""
    try:
        recordings = manager.get_active_recordings()
        return jsonify({
            "status": "success",
            "active_recordings": recordings,
            "count": len(recordings)
        })
    except Exception as e:
        logging.error(f"Error obteniendo grabaciones activas: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/recordings', methods=['GET'])
def get_recordings():
    """Obtener lista de grabaciones disponibles"""
    try:
        recordings = manager.get_recordings_list()
        return jsonify({
            "status": "success",
            "recordings": recordings,
            "count": len(recordings)
        })
    except Exception as e:
        logging.error(f"Error obteniendo grabaciones: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_recording(filename):
    """Descargar archivo de grabación"""
    try:
        # Validar nombre de archivo
        if '..' in filename or '/' in filename:
            return jsonify({"status": "error", "message": "Nombre de archivo inválido"}), 400
        
        filepath = os.path.join(RECORDINGS_DIR, filename)
        
        if not os.path.exists(filepath):
            return jsonify({"status": "error", "message": "Archivo no encontrado"}), 404
        
        return send_file(filepath, as_attachment=True)
        
    except Exception as e:
        logging.error(f"Error descargando archivo: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Obtener estado del servidor"""
    try:
        active_recordings = manager.get_active_recordings()
        return jsonify({
            "status": "success",
            "server": "running",
            "active_recordings_count": len(active_recordings),
            "active_recordings": active_recordings
        })
    except Exception as e:
        logging.error(f"Error obteniendo estado: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

if __name__ == '__main__':
    logging.info(f"🚀 Iniciando servidor Radio Recorder en {API_HOST}:{API_PORT}")
    app.run(host=API_HOST, port=API_PORT, debug=False)
`;

// Función para ejecutar comandos SSH
function sshCommand(command) {
  const fullCommand = `sshpass -p '${VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${command}"`;
  console.log(`\n🔍 Ejecutando: ${command}`);
  try {
    const result = execSync(fullCommand, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ Éxito: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
    return { success: true, output: result };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.stdout) console.log(`stdout: ${error.stdout}`);
    if (error.stderr) console.log(`stderr: ${error.stderr}`);
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

// Función para ejecutar comandos SSH con stdin
function sshCommandWithStdin(command, stdinContent) {
  const fullCommand = `echo '${stdinContent.replace(/'/g, "'\\''")}' | sshpass -p '${VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${command}"`;
  console.log(`\n🔍 Ejecutando comando con stdin`);
  try {
    const result = execSync(fullCommand, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ Éxito`);
    return { success: true, output: result };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

console.log('🚨 EMERGENCY FIX: Restauración del API Server de Flask');
console.log('=====================================================');

// Paso 1: Detener el servicio
console.log('\n📍 Paso 1: Deteniendo el servicio radio-recorder');
const stopResult = sshCommand('systemctl stop radio-recorder');
if (!stopResult.success) {
  console.log('⚠️  No se pudo detener el servicio, puede que ya esté detenido');
}

// Paso 2: Verificar el archivo actual
console.log('\n📍 Paso 2: Verificando archivo api_server.py actual');
const checkResult = sshCommand(`head -50 ${SCRIPTS_DIR}/api_server.py`);

// Paso 3: Crear archivo limpio
console.log('\n📍 Paso 3: Creando archivo api_server.py limpio');
const createResult = sshCommandWithStdin(`cat > ${SCRIPTS_DIR}/api_server.py`, CLEAN_API_SERVER_CODE);
if (!createResult.success) {
  console.log('❌ Error creando archivo limpio');
  process.exit(1);
}

// Verificar que el archivo se creó correctamente
console.log('\n📍 Verificando archivo creado');
const verifyResult = sshCommand(`head -30 ${SCRIPTS_DIR}/api_server.py`);
if (!verifyResult.success || !verifyResult.output.includes('Flask')) {
  console.log('❌ El archivo no se creó correctamente');
  process.exit(1);
}

// Paso 4: Verificar permisos
console.log('\n📍 Paso 4: Verificando permisos');
sshCommand(`chown radioapp:radioapp ${SCRIPTS_DIR}/api_server.py`);
sshCommand(`chmod 755 ${SCRIPTS_DIR}/api_server.py`);

// Paso 5: Verificar entorno virtual
console.log('\n📍 Paso 5: Verificando entorno virtual');
const venvCheck = sshCommand(`test -d ${REMOTE_DIR}/venv && echo "EXISTS" || echo "MISSING"`);
if (venvCheck.output && venvCheck.output.includes('MISSING')) {
  console.log('❌ Entorno virtual no encontrado, necesita reinstalación');
  console.log('📦 Por favor ejecute manualmente:');
  console.log(`   cd ${REMOTE_DIR} && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`);
} else {
  console.log('✅ Entorno virtual existe');
  
  // Verificar dependencias clave
  console.log('\n📍 Verificando dependencias');
  const depsCheck = sshCommand(`${REMOTE_DIR}/venv/bin/pip list | grep -E "(flask|flask-cors|python-dotenv|supabase)"`);
  if (!depsCheck.success) {
    console.log('⚠️  Algunas dependencias pueden faltar');
    console.log('📦 Reinstalando dependencias...');
    sshCommand(`cd ${REMOTE_DIR} && source venv/bin/activate && pip install flask flask-cors python-dotenv supabase`);
  }
}

// Paso 6: Reiniciar servicio
console.log('\n📍 Paso 6: Reiniciando servicio');
const restartResult = sshCommand('systemctl restart radio-recorder && sleep 3 && systemctl status radio-recorder --no-pager');
if (!restartResult.success) {
  console.log('❌ Error reiniciando servicio');
  
  // Intentar iniciar manualmente para ver el error
  console.log('\n📍 Intentando iniciar manualmente para debug:');
  sshCommand(`cd ${REMOTE_DIR} && source venv/bin/activate && python3 scripts/api_server.py > /tmp/flask_debug.log 2>&1 &`);
  sshCommand('sleep 2 && cat /tmp/flask_debug.log');
} else {
  console.log('✅ Servicio reiniciado exitosamente');
}

// Paso 7: Verificar que el endpoint funciona
console.log('\n📍 Paso 7: Verificando endpoint /api/recordings');
setTimeout(() => {
  const testResult = sshCommand('curl -s http://localhost:5000/api/recordings || echo "CURL_FAILED"');
  if (testResult.output && testResult.output.includes('CURL_FAILED')) {
    console.log('⚠️  No se pudo conectar al endpoint, verificando si el puerto está abierto');
    sshCommand('netstat -tlnp | grep :5000 || ss -tlnp | grep :5000');
  } else if (testResult.success) {
    console.log('✅ Endpoint responde correctamente');
    console.log(`Respuesta: ${testResult.output.substring(0, 100)}...`);
  }
}, 5000);

console.log('\n🎯 Proceso de emergencia completado');
console.log('====================================');
console.log('Próximos pasos:');
console.log('1. Verifique los logs: journalctl -u radio-recorder -f');
console.log('2. Pruebe el endpoint: curl http://213.199.39.147:5000/api/recordings');
console.log('3. Revise el frontend para ver si las grabaciones aparecen');