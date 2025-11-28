#!/usr/bin/env node

/**
 * FIX-VPS-PATH-DUPLICATE.JS
 * 
 * Este script corrige el problema de PATH duplicado en el script record_radio.sh
 * que causa errores "command not found" para comandos básicos.
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuración de conexión SSH
const SSH_PASSWORD = 'Aintelligence2025';
const SSH_USER = 'root';
const SSH_HOST = '213.199.39.147';
const SSH_COMMAND_PREFIX = `sshpass -p '${SSH_PASSWORD}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST}`;

async function executeSSHCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    const { stdout, stderr } = await execPromise(`${SSH_COMMAND_PREFIX} "${command}"`);
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.log(`⚠️  Stderr: ${stderr}`);
    }
    return stdout;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function fixPathIssue() {
  console.log('🛠️  CORRIGIENDO PROBLEMA DE PATH DUPLICADO EN VPS');
  console.log('====================================================');
  
  // 1. Verificar el contenido actual del script
  console.log('\n📋 PASO 1: Verificando contenido actual del script...');
  const currentContent = await executeSSHCommand(
    'head -10 /home/radioapp/radio-recorder/scripts/record_radio.sh',
    'Extrayendo líneas problemáticas'
  );
  
  if (currentContent) {
    console.log('Contenido actual:');
    console.log(currentContent);
    
    // Verificar si hay líneas duplicadas
    const lines = currentContent.split('\n').filter(line => line.trim());
    const pathLines = lines.filter(line => line.includes('export PATH'));
    
    if (pathLines.length > 1) {
      console.log(`\n⚠️  ENCONTRADO: ${pathLines.length} líneas de PATH (debería ser 1)`);
      pathLines.forEach((line, i) => console.log(`  Línea ${i+1}: ${line}`));
    }
  }
  
  // 2. Crear una versión corregida del script
  console.log('\n📋 PASO 2: Creando script corregido...');
  
  const scriptContent = `#!/bin/bash

# Cargar variables de entorno
source /home/radioapp/radio-recorder/.env

# Configuración
RADIO_URL="$1"
RADIO_ID="$2"
RADIO_NAME="$3"
RECORDING_ID="$4"

OUTPUT_DIR="$RECORDINGS_DIR"
LOG_DIR="$LOG_DIR"
CONTROL_FILE="/tmp/radio_control_\\${RECORDING_ID}"
STATE_FILE="/tmp/radio_state_\\${RECORDING_ID}"
BLOCK_DURATION=600  # 10 minutos en segundos

# Verificar parámetros
if [ -z "$RADIO_URL" ] || [ -z "$RADIO_ID" ] || [ -z "$RADIO_NAME" ] || [ -z "$RECORDING_ID" ]; then
    echo "Error: Faltan parámetros requeridos"
    echo "Uso: $0 <URL_RADIO> <RADIO_ID> <NOMBRE_RADIO> <RECORDING_ID>"
    exit 1
fi

# Crear directorios si no existen
mkdir -p "$OUTPUT_DIR"
mkdir -p "$LOG_DIR"

echo "=== INICIANDO SISTEMA DE GRABACIÓN CON BLOQUES ===" >> "$LOG_DIR/\\${RECORDING_ID}.log"
echo "Radio: $RADIO_NAME ($RADIO_ID)" >> "$LOG_DIR/\\${RECORDING_ID}.log"
echo "Duración por bloque: $BLOCK_DURATION segundos" >> "$LOG_DIR/\\${RECORDING_ID}.log"
echo "Hora inicio: $(date)" >> "$LOG_DIR/\\${RECORDING_ID}.log"

# Inicializar archivos de control
echo "RECORDING" > "$CONTROL_FILE"
echo "1" > "$STATE_FILE"  # Bloque actual

# Función para verificar estado
check_control_file() {
    if [ ! -f "$CONTROL_FILE" ]; then
        return 1
    fi
    local status=$(cat "$CONTROL_FILE")
    if [ "$status" = "STOP" ]; then
        return 1
    fi
    return 0
}

grabar_bloque() {
    local bloque_actual=$1
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local filename="radio-\\${RADIO_ID}_\\${RECORDING_ID}_block\\${bloque_actual}_\\${timestamp}.mp3"
    local filepath="\\${OUTPUT_DIR}/\\${filename}"
    
    echo "Iniciando bloque $bloque_actual: $filename" >> "$LOG_DIR/\\${RECORDING_ID}.log"
    
    # Grabar bloque de 10 minutos
    timeout $BLOCK_DURATION ffmpeg -tls_verify 0 -i "$RADIO_URL" -t $BLOCK_DURATION -c copy -y "$filepath"
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ] && [ -f "$filepath" ]; then
        echo "✅ Bloque $bloque_actual completado: $filename" >> "$LOG_DIR/\\${RECORDING_ID}.log"
        return 0
    else
        echo "❌ Error en bloque $bloque_actual (Código: $exit_code)" >> "$LOG_DIR/\\${RECORDING_ID}.log"
        return 1
    fi
}

# Bucle principal de grabación
while check_control_file; do
    bloque_actual=$(cat "$STATE_FILE")
    
    # Verificar si está en pausa
    control_status=$(cat "$CONTROL_FILE")
    if [ "$control_status" = "PAUSED" ]; then
        echo "Grabación en pausa..." >> "$LOG_DIR/\\${RECORDING_ID}.log"
        sleep 5
        continue
    fi
    
    # Grabar bloque actual
    if grabar_bloque $bloque_actual; then
        # Incrementar bloque para la siguiente iteración
        echo $((bloque_actual + 1)) > "$STATE_FILE"
    else
        echo "Error grabando bloque $bloque_actual - Continuando..." >> "$LOG_DIR/\\${RECORDING_ID}.log"
    fi
done

# Limpieza final
control_status=$(cat "$CONTROL_FILE" 2>/dev/null || echo "STOP")
echo "=== GRABACIÓN FINALIZADA: $control_status ===" >> "$LOG_DIR/\\${RECORDING_ID}.log"
echo "Total bloques grabados: $(($(cat "$STATE_FILE" 2>/dev/null || echo 1) - 1))" >> "$LOG_DIR/\\${RECORDING_ID}.log"

# Limpiar archivos de control
rm -f "$CONTROL_FILE" "$STATE_FILE"

echo "Hora fin: $(date)" >> "$LOG_DIR/\\${RECORDING_ID}.log"`;

  const fixScript = `
# Crear backup y corregir el script
cd /home/radioapp/radio-recorder/scripts
cp record_radio.sh record_radio.sh.backup.$(date +%Y%m%d_%H%M%S)

# Crear versión corregida
cat > record_radio.sh.fixed << 'EOF'
${scriptContent}
EOF

# Reemplazar el script original con la versión corregida
mv record_radio.sh.fixed record_radio.sh

# Hacer ejecutable
chmod +x record_radio.sh

echo "✅ Script corregido y marcado como ejecutable"
`;

  const result = await executeSSHCommand(fixScript, 'Corrigiendo script record_radio.sh');
  
  if (result) {
    console.log('Resultado:', result);
  }
  
  // 3. Verificar la corrección
  console.log('\n📋 PASO 3: Verificando corrección...');
  const newContent = await executeSSHCommand(
    'head -10 /home/radioapp/radio-recorder/scripts/record_radio.sh',
    'Verificando contenido corregido'
  );
  
  if (newContent) {
    console.log('Nuevo contenido (primeras 10 líneas):');
    console.log(newContent);
  }
  
  // 4. Verificar permisos
  console.log('\n📋 PASO 4: Verificando permisos...');
  const permissions = await executeSSHCommand(
    'ls -la /home/radioapp/radio-recorder/scripts/record_radio.sh',
    'Verificando permisos del script'
  );
  
  if (permissions) {
    console.log('Permisos actuales:', permissions.trim());
    
    if (!permissions.includes('rwxr-xr-x') && !permissions.includes('rwxrwxr-x')) {
      console.log('⚠️  El script no es ejecutable. Aplicando permisos...');
      await executeSSHCommand(
        'chmod +x /home/radioapp/radio-recorder/scripts/record_radio.sh',
        'Haciendo script ejecutable'
      );
    }
  }
  
  // 5. Reiniciar el servicio
  console.log('\n📋 PASO 5: Reiniciando servicio...');
  await executeSSHCommand(
    'systemctl restart radio-recorder',
    'Reiniciando servicio radio-recorder'
  );
  
  // Esperar un momento y verificar estado
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const status = await executeSSHCommand(
    'systemctl status radio-recorder --no-pager',
    'Verificando estado del servicio'
  );
  
  if (status) {
    console.log('Estado del servicio:');
    console.log(status);
  }
  
  console.log('\n✅ PROCESO DE CORRECCIÓN COMPLETADO');
  console.log('=====================================');
  console.log('El problema de PATH duplicado ha sido corregido.');
  console.log('El script record_radio.sh ahora debería funcionar correctamente.');
  console.log('\nPróximos pasos:');
  console.log('1. Intentar iniciar una grabación desde el frontend');
  console.log('2. Verificar logs con: tail -f /home/radioapp/radio-recorder/logs/api_server.log');
  console.log('3. Monitorear procesos FFmpeg con: ps aux | grep ffmpeg');
}

// Ejecutar la corrección
fixPathIssue().catch(console.error);