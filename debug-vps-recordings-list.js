#!/usr/bin/env node

const { spawn } = require('child_process');

// Función para ejecutar comandos SSH
function sshCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 ${description}...`);
    console.log(`   Comando: ${command}`);
    
    const ssh = spawn('sshpass', [
      '-p', 'Aintelligence2025',
      'ssh',
      '-o', 'StrictHostKeyChecking=no',
      'root@213.199.39.147',
      command
    ]);

    let stdout = '';
    let stderr = '';

    ssh.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ssh.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ssh.on('close', (code) => {
      if (code !== 0) {
        console.error(`   ❌ Error (código ${code}): ${stderr}`);
        reject(new Error(stderr));
      } else {
        console.log(`   ✅ Completado`);
        if (stdout.trim()) {
          console.log(`   Resultado:\n${stdout}`);
        }
        resolve(stdout);
      }
    });

    ssh.on('error', (err) => {
      console.error(`   ❌ Error de conexión: ${err.message}`);
      reject(err);
    });
  });
}

async function debugRecordingsList() {
  try {
    console.log('🚀 INICIANDO DEBUG DE ENDPOINT /api/recordings');
    console.log('=' .repeat(60));

    // 1. Verificar método get_recordings_list() en radio_manager.py
    console.log('\n📄 1. Verificando implementación de get_recordings_list()...');
    await sshCommand(
      'grep -A 30 "def get_recordings_list" /home/radioapp/radio-recorder/scripts/radio_manager.py',
      'Buscando método get_recordings_list'
    );

    // 2. Verificar logs recientes del endpoint
    console.log('\n📊 2. Verificando logs del endpoint /api/recordings...');
    await sshCommand(
      'journalctl -u radio-recorder --no-pager -n 100 | grep -E "(get_recordings_list|/api/recordings)" | tail -20',
      'Buscando logs del endpoint'
    );

    // 3. Ejecutar método manualmente con Python
    console.log('\n🐍 3. Ejecutando get_recordings_list() manualmente...');
    const pythonCode = `
cd /home/radioapp/radio-recorder
source venv/bin/activate
python3 -c "
import sys
sys.path.append('/home/radioapp/radio-recorder/scripts')
from radio_manager import RadioRecorderManager
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.DEBUG)

# Crear manager
manager = RadioRecorderManager()

# Ejecutar método
print('=== INICIANDO get_recordings_list() ===')
recordings = manager.get_recordings_list()
print(f'=== RESULTADO: {len(recordings)} grabaciones encontradas ===')

# Mostrar detalles de cada grabación
for i, rec in enumerate(recordings, 1):
    print(f'{i}. {rec[\\\"filename\\\"]} - {rec.get(\\\"size\\\", 0)} bytes')

# Verificar directorio manualmente
print('\\\\n=== VERIFICACIÓN MANUAL DE DIRECTORIO ===')
recordings_dir = os.getenv('RECORDINGS_DIR', '/home/radioapp/radio-recorder/recordings')
print(f'Directorio: {recordings_dir}')
print(f'Existe: {os.path.exists(recordings_dir)}')

# Listar todos los archivos MP3 manualmente
print('\\\\n=== LISTADO MANUAL DE ARCHIVOS MP3 ===')
all_files = []
for root, dirs, files in os.walk(recordings_dir):
    for file in files:
        if file.endswith('.mp3'):
            file_path = os.path.join(root, file)
            try:
                stat = os.stat(file_path)
                all_files.append({
                    'filename': file,
                    'path': file_path,
                    'size': stat.st_size,
                    'created': stat.st_mtime
                })
                print(f'✓ {file} - {stat.st_size} bytes - {os.path.getmtime(file_path)}')
            except Exception as e:
                print(f'✗ Error con {file_path}: {e}')

print(f'\\\\n=== TOTAL MANUAL: {len(all_files)} archivos MP3 ===')
"
`;
    await sshCommand(pythonCode, 'Ejecutando método manualmente');

    // 4. Verificar permisos del directorio
    console.log('\n🔒 4. Verificando permisos del directorio...');
    await sshCommand(
      'ls -ld /home/radioapp/radio-recorder/recordings',
      'Permisos del directorio de grabaciones'
    );

    // 5. Verificar si hay archivos ocultos o en subdirectorios
    console.log('\n🔍 5. Buscando archivos MP3 en subdirectorios...');
    await sshCommand(
      'find /home/radioapp/radio-recorder/recordings -type f -name "*.mp3" -exec ls -lh {} \\;',
      'Buscando todos los MP3 recursivamente'
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ DEBUG COMPLETADO');

  } catch (error) {
    console.error('\n❌ Error durante el debug:', error.message);
    process.exit(1);
  }
}

debugRecordingsList();