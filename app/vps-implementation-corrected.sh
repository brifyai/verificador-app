#!/bin/bash

# =============================================================================
# SCRIPT CORREGIDO: Implementación Completa del Sistema de Grabaciones
# Este script primero diagnostica rutas reales y luego ejecuta la organización
# =============================================================================

set -e  # Detener en cualquier error

echo "🔍 INICIANDO DIAGNÓSTICO DEL VPS..."
echo "============================================================"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# =============================================================================
# FUNCIÓN: Buscar rutas reales
# =============================================================================

find_real_paths() {
    echo "🔎 Buscando rutas reales en el sistema..."
    
    # Buscar app.py de Flask
    APP_PATH=$(find / -name "app.py" -type f 2>/dev/null | grep -E "(radio|record|flask)" | head -1)
    if [ -z "$APP_PATH" ]; then
        echo -e "${YELLOW}⚠️  No se encontró app.py, buscando alternativas...${NC}"
        APP_PATH=$(find /home -name "*.py" -type f 2>/dev/null | grep -E "(radio|record|flask)" | head -1)
    fi
    
    # Buscar directorio de grabaciones
    RECORDINGS_DIR=$(find / -type d -name "recordings" 2>/dev/null | grep -E "(radio|record)" | head -1)
    if [ -z "$RECORDINGS_DIR" ]; then
        echo -e "${YELLOW}⚠️  No se encontró 'recordings', buscando directorios con MP3s...${NC}"
        RECORDINGS_DIR=$(find / -type d -name "*" 2>/dev/null | xargs grep -l "\.mp3" 2>/dev/null | head -1 | xargs dirname)
    fi
    
    # Buscar archivos MP3 recientes
    MP3_FILES=$(find / -type f -name "*.mp3" -mtime -30 2>/dev/null | head -5)
    
    # Buscar servicio
    SERVICE_NAME=$(systemctl list-units --type=service | grep -i radio | awk '{print $1}' | head -1)
    
    echo ""
    echo -e "${GREEN}📊 RESULTADOS DEL DIAGNÓSTICO:${NC}"
    echo "============================================================"
    echo -e "Aplicación Flask: ${GREEN}${APP_PATH:-'No encontrada'}${NC}"
    echo -e "Directorio de grabaciones: ${GREEN}${RECORDINGS_DIR:-'No encontrado'}${NC}"
    echo -e "Servicio: ${GREEN}${SERVICE_NAME:-'No encontrado'}${NC}"
    echo -e "Archivos MP3 recientes: ${GREEN}${MP3_FILES:-'No encontrados'}${NC}"
    echo ""
    
    # Verificar si encontramos todo
    if [ -z "$APP_PATH" ] || [ -z "$RECORDINGS_DIR" ]; then
        echo -e "${RED}❌ ERROR: No se pudieron encontrar las rutas necesarias${NC}"
        echo "Por favor, verifica manualmente las rutas e intenta nuevamente"
        exit 1
    fi
}

# =============================================================================
# FUNCIÓN: Organizar grabaciones
# =============================================================================

organize_recordings() {
    local recordings_dir="$1"
    local base_dir=$(dirname "$recordings_dir")
    
    echo "📂 ORGANIZANDO GRABACIONES EN: $recordings_dir"
    echo "============================================================"
    
    # Crear backup
    BACKUP_DIR="$base_dir/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    echo "✅ Backup creado en: $BACKUP_DIR"
    
    # Buscar archivos MP3
    echo "🔍 Buscando archivos MP3..."
    cd "$recordings_dir"
    
    if [ ! -f "*.mp3" ]; then
        echo -e "${YELLOW}⚠️  No se encontraron archivos MP3 en el directorio actual${NC}"
        
        # Buscar en subdirectorios
        echo "Buscando en subdirectorios..."
        find . -name "*.mp3" -type f > /tmp/mp3_files.txt
        
        if [ ! -s /tmp/mp3_files.txt ]; then
            echo -e "${RED}❌ No se encontraron archivos MP3 para organizar${NC}"
            return 1
        fi
        
        echo "✅ Encontrados $(wc -l < /tmp/mp3_files.txt) archivos MP3"
        
        # Procesar cada archivo
        while IFS= read -r file; do
            process_file "$file" "$base_dir"
        done < /tmp/mp3_files.txt
        
    else
        # Procesar archivos en directorio actual
        for file in *.mp3; do
            process_file "$file" "$base_dir"
        done
    fi
    
    echo "✅ Organización completada"
}

# =============================================================================
# FUNCIÓN: Procesar archivo individual
# =============================================================================

process_file() {
    local file="$1"
    local base_dir="$2"
    
    # Extraer fecha y radio ID del nombre del archivo
    # Formato esperado: radio_{radio_id}_YYYYMMDD_HHMMSS_*.mp3
    if [[ $file =~ radio_([^_]+_[^_]+)_([0-9]{8})_[0-9]{6}_.*\.mp3 ]]; then
        RADIO_ID="${BASH_REMATCH[1]}"
        DATE="${BASH_REMATCH[2]}"
        DATE_FORMATTED="${DATE:0:4}-${DATE:4:2}-${DATE:6:2}"
        
        # Crear directorio de destino
        DEST_DIR="$base_dir/recordings/$DATE_FORMATTED/$RADIO_ID"
        mkdir -p "$DEST_DIR"
        
        # Mover archivo
        mv "$file" "$DEST_DIR/"
        echo "✅ Organizado: $file → $DEST_DIR/"
    else
        echo -e "${YELLOW}⚠️  Formato no reconocido: $file${NC}"
    fi
}

# =============================================================================
# FUNCIÓN: Actualizar endpoint Flask
# =============================================================================

update_flask_endpoint() {
    local app_path="$1"
    
    echo "🐍 ACTUALIZANDO ENDPOINT FLASK: $app_path"
    echo "============================================================"
    
    # Crear backup del archivo original
    cp "$app_path" "${app_path}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Verificar si ya tiene el endpoint
    if grep -q "def get_recordings" "$app_path"; then
        echo "✅ Endpoint ya existe, actualizando..."
        
        # Reemplazar la función existente
        python3 <<EOF
import re

with open('$app_path', 'r') as f:
    content = f.read()

# Buscar y reemplazar la función get_recordings
pattern = r'def get_recordings\(\):.*?(?=def |\Z)'
replacement = '''def get_recordings():
    """Obtener lista de todas las grabaciones con estructura de carpetas"""
    recordings = []
    
    # Buscar recursivamente en el directorio de grabaciones
    recordings_dir = '/home/radioapp/radio-recorder/recordings'
    
    for root, dirs, files in os.walk(recordings_dir):
        for file in files:
            if file.endswith('.mp3'):
                # Obtener ruta relativa
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, recordings_dir)
                
                # Extraer metadata del nombre del archivo
                file_size = os.path.getsize(full_path)
                file_date = datetime.fromtimestamp(os.path.getctime(full_path))
                
                recordings.append({
                    'filename': file,
                    'path': rel_path,  # Ruta relativa para el frontend
                    'size': file_size,
                    'date': file_date.isoformat(),
                    'radio_id': extract_radio_id(file)
                })
    
    # Ordenar por fecha descendente
    recordings.sort(key=lambda x: x['date'], reverse=True)
    
    return jsonify({
        'recordings': recordings,
        'count': len(recordings),
        'status': 'success'
    })'''
    
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('$app_path', 'w') as f:
    f.write(content)

print("✅ Endpoint actualizado")
EOF
        
    else
        echo "📄 Agregando endpoint nuevo..."
        
        # Agregar importaciones si no existen
        if ! grep -q "import os" "$app_path"; then
            sed -i '1a import os\nfrom datetime import datetime' "$app_path"
        fi
        
        # Agregar función helper
        cat >> "$app_path" <<'EOF'

# Función helper para extraer radio ID
def extract_radio_id(filename):
    import re
    match = re.match(r'^radio_([^_]+_[^_]+)_', filename)
    return match.group(1) if match else 'unknown'

# Endpoint para obtener grabaciones con estructura de carpetas
@app.route('/api/recordings', methods=['GET'])
def get_recordings():
    """Obtener lista de todas las grabaciones con estructura de carpetas"""
    recordings = []
    
    # Buscar recursivamente en el directorio de grabaciones
    recordings_dir = '/home/radioapp/radio-recorder/recordings'
    
    for root, dirs, files in os.walk(recordings_dir):
        for file in files:
            if file.endswith('.mp3'):
                # Obtener ruta relativa
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, recordings_dir)
                
                # Extraer metadata del nombre del archivo
                file_size = os.path.getsize(full_path)
                file_date = datetime.fromtimestamp(os.path.getctime(full_path))
                
                recordings.append({
                    'filename': file,
                    'path': rel_path,  # Ruta relativa para el frontend
                    'size': file_size,
                    'date': file_date.isoformat(),
                    'radio_id': extract_radio_id(file)
                })
    
    # Ordenar por fecha descendente
    recordings.sort(key=lambda x: x['date'], reverse=True)
    
    return jsonify({
        'recordings': recordings,
        'count': len(recordings),
        'status': 'success'
    })
EOF
        echo "✅ Endpoint agregado"
    fi
}

# =============================================================================
# FUNCIÓN: Reiniciar servicio
# =============================================================================

restart_service() {
    local service_name="$1"
    
    echo "🔄 REINICIANDO SERVICIO: $service_name"
    echo "============================================================"
    
    if [ -n "$service_name" ]; then
        systemctl restart "$service_name"
        echo "✅ Servicio reiniciado"
        systemctl status "$service_name" --no-pager -l
    else
        echo -e "${YELLOW}⚠️  No se encontró servicio para reiniciar${NC}"
        echo "Por favor, reinicia manualmente el servicio de grabaciones"
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    echo "🚀 INICIANDO IMPLEMENTACIÓN CORREGIDA"
    echo "============================================================"
    
    # Paso 1: Diagnosticar rutas
    find_real_paths
    
    # Paso 2: Organizar grabaciones
    if [ -n "$RECORDINGS_DIR" ]; then
        organize_recordings "$RECORDINGS_DIR"
    fi
    
    # Paso 3: Actualizar endpoint Flask
    if [ -n "$APP_PATH" ]; then
        update_flask_endpoint "$APP_PATH"
    fi
    
    # Paso 4: Reiniciar servicio
    restart_service "$SERVICE_NAME"
    
    echo ""
    echo -e "${GREEN}✅ IMPLEMENTACIÓN COMPLETADA${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Verifica las grabaciones en: $RECORDINGS_DIR"
    echo "2. Prueba el endpoint: curl http://213.199.39.147:5000/api/recordings"
    echo "3. Revisa el frontend en: http://localhost:3000/grabaciones"
}

# Ejecutar
main