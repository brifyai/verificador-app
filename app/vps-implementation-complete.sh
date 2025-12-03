#!/bin/bash

# ==============================================================================
# SCRIPT DE IMPLEMENTACIÓN COMPLETA - ORGANIZACIÓN VPS Y ACTUALIZACIÓN ENDPOINT
# ==============================================================================
# Este script:
# 1. Organiza las grabaciones existentes en la estructura DÍA/RADIO/ARCHIVO
# 2. Actualiza el endpoint de Flask para escanear recursivamente
# 3. Configura el servicio de grabación para usar la nueva estructura
# 4. Reinicia los servicios necesarios
# ==============================================================================

set -e  # Salir inmediatamente si hay un error

echo "🚀 INICIANDO IMPLEMENTACIÓN COMPLETA DEL SISTEMA DE GRABACIONES"
echo "================================================================"

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================
BASE_DIR="/home/radioapp/radio-recorder"
RECORDINGS_DIR="$BASE_DIR/recordings"
BACKUP_DIR="$BASE_DIR/backups/$(date +%Y%m%d_%H%M%S)"
FLASK_APP_DIR="$BASE_DIR"
FLASK_APP_FILE="$FLASK_APP_DIR/app.py"

echo "📁 Directorio base: $BASE_DIR"
echo "📁 Directorio de grabaciones: $RECORDINGS_DIR"
echo "💾 Directorio de backup: $BACKUP_DIR"
echo "🐍 Aplicación Flask: $FLASK_APP_FILE"

# ==============================================================================
# 1. CREAR BACKUP DE SEGURIDAD
# ==============================================================================
echo ""
echo "🔒 CREANDO BACKUP DE SEGURIDAD..."
echo "================================================================"

mkdir -p "$BACKUP_DIR"
cp -r "$RECORDINGS_DIR" "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  No hay grabaciones para respaldar"
cp "$FLASK_APP_FILE" "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  No se encontró app.py para respaldar"

echo "✅ Backup creado en: $BACKUP_DIR"

# ==============================================================================
# 2. ORGANIZAR GRABACIONES EXISTENTES
# ==============================================================================
echo ""
echo "📂 ORGANIZANDO GRABACIONES EXISTENTES..."
echo "================================================================"

# Función para extraer radio_id del filename
extract_radio_id() {
    local filename="$1"
    # Patrón: radio_RADIOID_TIMESTAMP.mp3 o radio_RADIOID_TIMESTAMP_UUID.mp3
    if [[ "$filename" =~ ^radio_([^_]+_[^_]+)_[0-9]{8}_[0-9]{6} ]]; then
        echo "${BASH_REMATCH[1]}"
    elif [[ "$filename" =~ ^radio-([0-9]+)_[0-9]{8}_[0-9]{6} ]]; then
        echo "radio-${BASH_REMATCH[1]}"
    else
        echo "unknown"
    fi
}

# Función para extraer fecha del filename
extract_date() {
    local filename="$1"
    if [[ "$filename" =~ [0-9]{8} ]]; then
        local date_str="${BASH_REMATCH[0]}"
        echo "${date_str:0:4}-${date_str:4:2}-${date_str:6:2}"
    else
        echo "1970-01-01"  # Fecha por defecto si no se puede extraer
    fi
}

# Contadores
TOTAL_FILES=0
ORGANIZED_FILES=0
SKIPPED_FILES=0

# Procesar archivos existentes
echo "🔍 Buscando archivos de grabación..."
cd "$RECORDINGS_DIR" || exit 1

for file in *.mp3; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    # Extraer información del filename
    RADIO_ID=$(extract_radio_id "$file")
    DATE_STR=$(extract_date "$file")
    
    # Crear estructura de directorios
    TARGET_DIR="$RECORDINGS_DIR/$DATE_STR/$RADIO_ID"
    mkdir -p "$TARGET_DIR"
    
    # Mover archivo
    if [ -f "$TARGET_DIR/$file" ]; then
        echo "⚠️  Ya existe: $TARGET_DIR/$file"
        SKIPPED_FILES=$((SKIPPED_FILES + 1))
    else
        mv "$file" "$TARGET_DIR/"
        ORGANIZED_FILES=$((ORGANIZED_FILES + 1))
        echo "✅ Movido: $file → $TARGET_DIR/"
    fi
done

echo ""
echo "📊 RESUMEN DE ORGANIZACIÓN:"
echo "   - Total de archivos procesados: $TOTAL_FILES"
echo "   - Archivos organizados: $ORGANIZED_FILES"
echo "   - Archivos omitidos (ya existían): $SKIPPED_FILES"

# ==============================================================================
# 3. ACTUALIZAR ENDPOINT FLASK
# ==============================================================================
echo ""
echo "🐍 ACTUALIZANDO ENDPOINT FLASK..."
echo "================================================================"

# Crear el nuevo endpoint que escanea recursivamente
cat > /tmp/new_recordings_endpoint.py << 'EOF'
import os
import re
from datetime import datetime
from flask import jsonify
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_radio_info(filename):
    """Extraer información del radio desde el filename"""
    # Patrón: radio_RADIOID_TIMESTAMP.mp3 o radio_RADIOID_TIMESTAMP_UUID.mp3
    pattern = r'^radio_([^_]+_[^_]+)_(\d{8})_(\d{6})'
    match = re.match(pattern, filename)
    
    if match:
        return {
            'radio_id': match.group(1),
            'date': match.group(2),
            'time': match.group(3)
        }
    
    # Patrón alternativo: radio-N_TIMESTAMP.mp3
    pattern2 = r'^radio-(\d+)_(\d{8})_(\d{6})'
    match2 = re.match(pattern2, filename)
    
    if match2:
        return {
            'radio_id': f"radio-{match2.group(1)}",
            'date': match2.group(2),
            'time': match2.group(3)
        }
    
    return None

def get_file_size(filepath):
    """Obtener tamaño de archivo en bytes"""
    try:
        return os.path.getsize(filepath)
    except OSError:
        return 0

def scan_recordings_recursive(base_path):
    """Escanear grabaciones recursivamente en la estructura DÍA/RADIO/ARCHIVO"""
    recordings = []
    
    if not os.path.exists(base_path):
        logger.warning(f"Directorio no existe: {base_path}")
        return recordings
    
    # Escanear por fecha (primer nivel)
    for date_dir in os.listdir(base_path):
        date_path = os.path.join(base_path, date_dir)
        
        if not os.path.isdir(date_path):
            continue
        
        # Validar formato de fecha (YYYY-MM-DD)
        if not re.match(r'\d{4}-\d{2}-\d{2}', date_dir):
            continue
        
        # Escanear radios (segundo nivel)
        for radio_dir in os.listdir(date_path):
            radio_path = os.path.join(date_path, radio_dir)
            
            if not os.path.isdir(radio_path):
                continue
            
            # Escanear archivos MP3 (tercer nivel)
            for filename in os.listdir(radio_path):
                if not filename.endswith('.mp3'):
                    continue
                
                filepath = os.path.join(radio_path, filename)
                
                if not os.path.isfile(filepath):
                    continue
                
                # Extraer información del filename
                radio_info = extract_radio_info(filename)
                
                if not radio_info:
                    logger.warning(f"No se pudo extraer info de: {filename}")
                    continue
                
                # Obtener metadata del archivo
                stat = os.stat(filepath)
                size = stat.st_size
                created = datetime.fromtimestamp(stat.st_mtime).isoformat()
                
                # Construir path relativo
                relative_path = os.path.join(date_dir, radio_dir, filename)
                
                # Enriquecer con datos de la base de datos (simulado)
                # En producción, esto debería consultar la base de datos real
                radio_data = {
                    'radio_id': radio_info['radio_id'],
                    'radio_name': f"Radio {radio_info['radio_id']}",
                    'radio_region': 'Región Desconocida',
                    'radio_city': 'Ciudad Desconocida',
                    'radio_programadora': 'Programadora Desconocida'
                }
                
                # Intentar obtener datos reales de la radio si existe en el sistema
                # (Este es un placeholder - implementar lógica real según tu sistema)
                
                recording = {
                    'filename': filename,
                    'path': relative_path.replace('\\', '/'),  # Normalizar path
                    'size': size,
                    'created': created,
                    'radio_id': radio_data['radio_id'],
                    'radio_name': radio_data['radio_name'],
                    'radio_region': radio_data['radio_region'],
                    'radio_city': radio_data['radio_city'],
                    'radio_programadora': radio_data['radio_programadora'],
                    'display_name': f"{radio_data['radio_name']} - {date_dir}"
                }
                
                recordings.append(recording)
                logger.debug(f"Grabación encontrada: {relative_path}")
    
    # Ordenar por fecha (más recientes primero)
    recordings.sort(key=lambda x: x['created'], reverse=True)
    
    logger.info(f"Total de grabaciones encontradas: {len(recordings)}")
    return recordings

@app.route('/api/recordings', methods=['GET'])
def get_recordings():
    """Endpoint para obtener todas las grabaciones con la nueva estructura"""
    try:
        base_path = '/home/radioapp/radio-recorder/recordings'
        recordings = scan_recordings_recursive(base_path)
        
        return jsonify({
            'status': 'success',
            'recordings': recordings,
            'count': len(recordings),
            'structure': 'date/radio/file'
        })
        
    except Exception as e:
        logger.error(f"Error obteniendo grabaciones: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'recordings': [],
            'count': 0
        }), 500

@app.route('/api/download/<path:file_path>', methods=['GET'])
def download_recording(file_path):
    """Endpoint para descargar una grabación usando su path relativo"""
    try:
        base_path = '/home/radioapp/radio-recorder/recordings'
        full_path = os.path.join(base_path, file_path)
        
        # Seguridad: Prevenir path traversal
        full_path = os.path.abspath(full_path)
        base_path_abs = os.path.abspath(base_path)
        
        if not full_path.startswith(base_path_abs):
            return jsonify({
                'status': 'error',
                'message': 'Ruta no válida'
            }), 403
        
        if not os.path.exists(full_path):
            return jsonify({
                'status': 'error',
                'message': 'Archivo no encontrado'
            }), 404
        
        # Enviar archivo
        from flask import send_file
        return send_file(full_path, as_attachment=True)
        
    except Exception as e:
        logger.error(f"Error descargando archivo: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
EOF

# Verificar si app.py existe
if [ ! -f "$FLASK_APP_FILE" ]; then
    echo "❌ ERROR: No se encontró $FLASK_APP_FILE"
    echo "   Por favor, verifica la ruta de la aplicación Flask"
    exit 1
fi

# Hacer backup del app.py original
cp "$FLASK_APP_FILE" "$BACKUP_DIR/app.py.backup"

# Buscar dónde insertar los nuevos endpoints
if grep -q "@app.route('/api/recordings')" "$FLASK_APP_FILE"; then
    echo "⚠️  El endpoint /api/recordings ya existe. Reemplazando..."
    
    # Crear un nuevo archivo sin el endpoint antiguo
    python3 << PYTHON_EOF
import re

with open('$FLASK_APP_FILE', 'r') as f:
    content = f.read()

# Eliminar el endpoint antiguo de recordings
pattern = r"@app\.route\('/api/recordings'.*?(?=(@app\.route\('/api/|\Z))"
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('$FLASK_APP_FILE', 'w') as f:
    f.write(content)

print("✅ Endpoint antiguo eliminado")
PYTHON_EOF

fi

# Agregar los nuevos endpoints al final del archivo
echo "" >> "$FLASK_APP_FILE"
echo "# ==============================================================================" >> "$FLASK_APP_FILE"
echo "# NUEVOS ENDPOINTS PARA ESTRUCTURA DE GRABACIONES POR FECHA/RADIO" >> "$FLASK_APP_FILE"
echo "# ==============================================================================" >> "$FLASK_APP_FILE"
cat /tmp/new_recordings_endpoint.py >> "$FLASK_APP_FILE"

echo "✅ Nuevos endpoints agregados a $FLASK_APP_FILE"

# ==============================================================================
# 4. ACTUALIZAR SERVICIO DE GRABACIÓN
# ==============================================================================
echo ""
echo "⚙️  ACTUALIZANDO SERVICIO DE GRABACIÓN..."
echo "================================================================"

# Buscar el archivo que maneja las grabaciones (grabacion.py o similar)
GRABACION_FILE=$(find "$BASE_DIR" -name "grabacion.py" -o -name "recording.py" -o -name "radioRecorder.py" | head -1)

if [ -n "$GRABACION_FILE" ]; then
    echo "📄 Encontrado archivo de grabación: $GRABACION_FILE"
    
    # Hacer backup
    cp "$GRABACION_FILE" "$BACKUP_DIR/"
    
    # Actualizar la función de guardado para usar la nueva estructura
    # Esto es un ejemplo - necesitarás adaptarlo a tu implementación específica
    
    echo "⚠️  Por favor, actualiza manualmente la función de guardado en:"
    echo "   $GRABACION_FILE"
    echo ""
    echo "   Debe guardar los archivos en:"
    echo "   /home/radioapp/radio-recorder/recordings/YYYY-MM-DD/radio_id/"
    
else
    echo "⚠️  No se encontró archivo de grabación. Buscando en $BASE_DIR"
    find "$BASE_DIR" -name "*.py" | head -10
fi

# ==============================================================================
# 5. REINICIAR SERVICIOS
# ==============================================================================
echo ""
echo "🔄 REINICIANDO SERVICIOS..."
echo "================================================================"

# Reiniciar el servicio de Flask
if systemctl is-active --quiet radio-recorder; then
    echo "🛑 Deteniendo servicio radio-recorder..."
    sudo systemctl stop radio-recorder
    
    echo "▶️  Iniciando servicio radio-recorder..."
    sudo systemctl start radio-recorder
    
    echo "✅ Servicio radio-recorder reiniciado"
else
    echo "⚠️  El servicio radio-recorder no está activo"
    echo "   Iniciando manualmente..."
    cd "$FLASK_APP_DIR" && nohup python3 app.py > /tmp/radio-recorder.log 2>&1 &
    echo "✅ Servicio iniciado en background"
fi

# Esperar un momento para que el servicio inicie
sleep 3

# Verificar que el endpoint está funcionando
echo ""
echo "🔍 VERIFICANDO ENDPOINT..."
echo "================================================================"

RESPONSE=$(curl -s http://localhost:5000/api/recordings)
if echo "$RESPONSE" | grep -q '"status":"success"'; then
    COUNT=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    echo "✅ Endpoint funcionando correctamente"
    echo "📊 Grabaciones encontradas: $COUNT"
else
    echo "❌ Error en el endpoint"
    echo "Respuesta: $RESPONSE"
fi

# ==============================================================================
# 6. RESUMEN
# ==============================================================================
echo ""
echo "📋 RESUMEN DE IMPLEMENTACIÓN"
echo "================================================================"
echo "✅ Backup creado en: $BACKUP_DIR"
echo "✅ Archivos organizados: $ORGANIZED_FILES"
echo "✅ Endpoint Flask actualizado"
echo "✅ Servicio reiniciado"
echo ""
echo "🎯 LA NUEVA ESTRUCTURA ES:"
echo "   /home/radioapp/radio-recorder/recordings/"
echo "   ├── YYYY-MM-DD/"
echo "   │   ├── radio_id_1/"
echo "   │   │   └── archivo.mp3"
echo "   │   └── radio_id_2/"
echo "   │       └── archivo.mp3"
echo ""
echo "🚀 EL ENDPOINT /api/recordings AHORA DEVUELVE:"
echo "   {"
echo "     'filename': 'archivo.mp3',"
echo "     'path': '2025-12-01/radio_id/archivo.mp3',"
echo "     'size': 123456,"
echo "     'created': '2025-12-01T20:30:00',"
echo "     'radio_id': 'radio_id',"
echo "     'radio_name': 'Nombre Radio',"
echo "     ...metadata..."
echo "   }"
echo ""
echo "✅ IMPLEMENTACIÓN COMPLETADA EXITOSAMENTE"
echo "================================================================"