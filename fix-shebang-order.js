#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const VPS_IP = '213.199.39.147';
const VPS_PASSWORD = 'Aintelligence2025';
const SCRIPT_PATH = '/home/radioapp/radio-recorder/scripts/record_radio.sh';

async function fixShebangOrder() {
  console.log('🔧 CORRIGIENDO ORDEN DEL SHEBANG EN EL SCRIPT');
  console.log('===========================================\n');

  try {
    // Paso 1: Crear un script temporal con el orden correcto
    console.log('📋 Paso 1: Creando script temporal con shebang en la primera línea...');
    
    const tempScript = `#!/bin/bash

# Configuración del PATH
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Cargar variables de entorno
source /home/radioapp/radio-recorder/.env

# Configuración
RADIO_URL="$1"
RADIO_ID="$2"
RADIO_NAME="$3"
RECORDING_ID="$4"

OUTPUT_DIR="$RECORDINGS_DIR"
LOG_DIR="$LOG_DIR"
CONTROL_FILE="/tmp/radio_control_\${RECORDING_ID}"
STATE_FILE="/tmp/radio_state_\${RECORDING_ID}"
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

# Archivos de log
LOG_FILE="$LOG_DIR/\${RECORDING_ID}.log"
echo "[\$(date '+%Y-%m-%d %H:%M:%S')] Iniciando grabación - ID: $RECORDING_ID" >> "$LOG_FILE"
echo "[\$(date '+%Y-%m-%d %H:%M:%S')] Radio: $RADIO_NAME (ID: $RADIO_ID)" >> "$LOG_FILE"
echo "[\$(date '+%Y-%m-%d %H:%M:%S')] URL: $RADIO_URL" >> "$LOG_FILE"

# Función para logging
log_message() {
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Función para crear archivo de estado
update_status() {
    local status="$1"
    local filename="$2"
    echo "$status" > "$STATE_FILE"
    if [ -n "$filename" ]; then
        echo "$filename" >> "$STATE_FILE"
    fi
}

# Función para verificar si debe continuar grabando
should_continue() {
    if [ -f "$CONTROL_FILE" ] && [ "\$(cat "$CONTROL_FILE")" = "STOP" ]; then
        return 1
    fi
    return 0
}

# Actualizar estado inicial
update_status "RECORDING"

log_message "=== INICIO DE GRABACIÓN ==="
log_message "Parámetros: URL=$RADIO_URL, RadioID=$RADIO_ID, Nombre=$RADIO_NAME, RecordingID=$RECORDING_ID"
log_message "Directorios: Output=$OUTPUT_DIR, Log=$LOG_DIR"

# Bucle de grabación por bloques
while should_continue; do
    # Generar timestamp para este bloque
    TIMESTAMP=\$(date '+%Y%m%d_%H%M%S')
    DATE_HOUR=\$(date '+%Y-%m-%d/%H')
    
    # Crear estructura de directorios
    BLOCK_DIR="$OUTPUT_DIR/\${DATE_HOUR}"
    mkdir -p "$BLOCK_DIR"
    
    # Nombre del archivo
    FILENAME="$BLOCK_DIR/\${RADIO_ID}_\${TIMESTAMP}_\${RECORDING_ID}.mp3"
    
    log_message "Iniciando bloque de grabación: $FILENAME"
    update_status "RECORDING" "$FILENAME"
    
    # Comando FFmpeg
    FF_CMD="ffmpeg -i '$RADIO_URL' -t $BLOCK_DURATION -acodec libmp3lame -ab 128k -ar 44100 -y '$FILENAME'"
    log_message "Ejecutando: $FF_CMD"
    
    # Ejecutar FFmpeg
    if eval $FF_CMD >> "$LOG_FILE" 2>&1; then
        log_message "✅ Bloque grabado exitosamente: $FILENAME"
        
        # Verificar que el archivo existe y tiene tamaño
        if [ -f "$FILENAME" ] && [ -s "$FILENAME" ]; then
            FILE_SIZE=\$(stat -c%s "$FILENAME")
            log_message "📊 Archivo creado: $FILENAME (Tamaño: $FILE_SIZE bytes)"
        else
            log_message "⚠️  Archivo no creado o vacío: $FILENAME"
        fi
    else
        log_message "❌ Error en FFmpeg para el bloque: $FILENAME"
        
        # Si FFmpeg falla, esperar antes de reintentar
        sleep 5
    fi
    
    # Pequeña pausa entre bloques
    sleep 2
done

# Marcar como completado
update_status "COMPLETED"
log_message "=== GRABACIÓN FINALIZADA ==="
echo "Grabación completada: $RECORDING_ID"

exit 0
`;

    // Guardar el script temporal localmente
    const fs = require('fs');
    fs.writeFileSync('/tmp/record_radio_fixed.sh', tempScript);
    console.log('✅ Script temporal creado localmente');

    // Paso 2: Transferir el script al VPS
    console.log('\n☁️  Paso 2: Transfiriendo script al VPS...');
    const scpCommand = `sshpass -p '${VPS_PASSWORD}' scp /tmp/record_radio_fixed.sh root@${VPS_IP}:${SCRIPT_PATH}`;
    await execPromise(scpCommand);
    console.log('✅ Script transferido exitosamente');

    // Paso 3: Establecer permisos correctos
    console.log('\n🔐 Paso 3: Estableciendo permisos correctos...');
    const chmodCommand = `sshpass -p '${VPS_PASSWORD}' ssh root@${VPS_IP} "chown radioapp:radioapp ${SCRIPT_PATH} && chmod 755 ${SCRIPT_PATH}"`;
    await execPromise(chmodCommand);
    console.log('✅ Permisos establecidos correctamente');

    // Paso 4: Verificar el resultado
    console.log('\n🔍 Paso 4: Verificando el script corregido...');
    const verifyCommand = `sshpass -p '${VPS_PASSWORD}' ssh root@${VPS_IP} "head -10 ${SCRIPT_PATH}"`;
    const { stdout } = await execPromise(verifyCommand);
    
    console.log('📄 Primeras 10 líneas del script corregido:');
    console.log(stdout);
    
    // Verificar que el shebang está en la primera línea
    const lines = stdout.split('\n');
    if (lines[0] && lines[0].startsWith('#!/bin/bash')) {
      console.log('\n✅ ÉXITO: El shebang está correctamente en la primera línea');
    } else {
      console.log('\n❌ ERROR: El shebang NO está en la primera línea');
      console.log('Primera línea:', lines[0]);
    }

    // Limpiar archivo temporal local
    fs.unlinkSync('/tmp/record_radio_fixed.sh');
    console.log('\n🧹 Archivo temporal local limpiado');

    console.log('\n🎉 ¡SCRIPT CORREGIDO EXITOSAMENTE!');
    console.log('\nPróximos pasos:');
    console.log('1. Reiniciar el servicio: systemctl restart radio-recorder');
    console.log('2. Probar iniciar una grabación desde el frontend');
    console.log('3. Verificar que se crean archivos MP3 en /home/radioapp/radio-recorder/recordings/');

  } catch (error) {
    console.error('\n❌ Error durante la corrección:', error.message);
    process.exit(1);
  }
}

fixShebangOrder();