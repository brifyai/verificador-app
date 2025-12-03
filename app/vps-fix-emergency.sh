#!/bin/bash

# =============================================================================
# SCRIPT DE EMERGENCIA - CORRECCIÓN RÁPIDA VPS
# =============================================================================
# Este script corrige el error de modificación del archivo equivocado
# y actualiza el archivo CORRECTO (api_server.py)

set -e

echo "🚨 INICIANDO CORRECCIÓN DE EMERGENCIA"
echo "============================================================"

# =============================================================================
# 1. DETECTAR RUTAS REALES
# =============================================================================
echo "🔍 Detectando rutas reales..."

# Buscar el archivo api_server.py real
API_SERVER=$(find /home/radioapp -name "api_server.py" -type f 2>/dev/null | head -1)

if [ -z "$API_SERVER" ]; then
    echo "❌ ERROR: No se encontró api_server.py"
    echo "Buscando en todo el sistema..."
    API_SERVER=$(find / -name "api_server.py" -type f 2>/dev/null | grep -E "(radio|record)" | head -1)
fi

if [ -z "$API_SERVER" ]; then
    echo "❌ CRÍTICO: No se pudo encontrar api_server.py"
    exit 1
fi

echo "✅ Archivo api_server.py encontrado: $API_SERVER"

# Directorio de grabaciones
RECORDINGS_DIR="/home/radioapp/radio-recorder/recordings"

if [ ! -d "$RECORDINGS_DIR" ]; then
    echo "❌ ERROR: Directorio de grabaciones no existe: $RECORDINGS_DIR"
    exit 1
fi

echo "✅ Directorio de grabaciones: $RECORDINGS_DIR"

# =============================================================================
# 2. REVERTIR CAMBIOS AL ARCHIVO DE FLASK (si es posible)
# =============================================================================
echo ""
echo "🔄 Revirtiendo cambios al archivo de Flask (si existen)..."

FLASK_APP="/home/radioapp/radio-recorder/venv/lib/python3.12/site-packages/flask/app.py"
if [ -f "$FLASK_APP" ]; then
    # Crear backup del archivo de Flask antes de modificar
    cp "$FLASK_APP" "$FLASK_APP.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Intentar revertir el endpoint que agregamos (buscar y eliminar)
    # Buscar la línea con @app.route('/api/recordings' y eliminarla más las siguientes líneas
    if grep -q "@app.route('/api/recordings'" "$FLASK_APP"; then
        echo "⚠️  Encontrado endpoint erróneo en flask/app.py, eliminando..."
        # Encontrar el número de línea
        LINE_NUM=$(grep -n "@app.route('/api/recordings'" "$FLASK_APP" | cut -d: -f1)
        if [ ! -z "$LINE_NUM" ]; then
            # Eliminar desde esa línea hasta 20 líneas después (el endpoint completo)
            sed -i "${LINE_NUM},$((LINE_NUM + 20))d" "$FLASK_APP"
            echo "✅ Endpoint erróneo eliminado de flask/app.py"
        fi
    else
        echo "✅ No se encontraron cambios erróneos en flask/app.py"
    fi
else
    echo "⚠️  Archivo flask/app.py no encontrado"
fi

# =============================================================================
# 3. ACTUALIZAR ARCHIVO CORRECTO (api_server.py)
# =============================================================================
echo ""
echo "🐍 ACTUALIZANDO ARCHIVO CORRECTO: $API_SERVER"
echo "============================================================"

# Crear backup del archivo original
BACKUP_FILE="$API_SERVER.backup.$(date +%Y%m%d_%H%M%S)"
cp "$API_SERVER" "$BACKUP_FILE"
echo "✅ Backup creado: $BACKUP_FILE"

# Verificar si ya existe el endpoint en api_server.py
if grep -q "@app.route('/api/recordings'" "$API_SERVER"; then
    echo "⚠️  Endpoint ya existe en api_server.py, actualizando..."
    
    # Encontrar y eliminar el endpoint existente
    LINE_NUM=$(grep -n "@app.route('/api/recordings'" "$API_SERVER" | cut -d: -f1)
    if [ ! -z "$LINE_NUM" ]; then
        # Encontrar dónde termina la función (buscar la siguiente @app.route o if __name__)
        END_LINE=$(tail -n +$LINE_NUM "$API_SERVER" | grep -n -E "(@app.route|if __name__|def |@app\.)" | head -2 | tail -1 | cut -d: -f1)
        if [ ! -z "$END_LINE" ]; then
            END_LINE=$((LINE_NUM + END_LINE - 1))
            sed -i "${LINE_NUM},${END_LINE}d" "$API_SERVER"
        else
            # Si no encontramos el final, eliminar 30 líneas
            sed -i "${LINE_NUM},$((LINE_NUM + 30))d" "$API_SERVER"
        fi
    fi
fi

# Agregar el nuevo endpoint al final del archivo, antes de if __name__ == '__main__'
echo "📄 Agregando endpoint nuevo a api_server.py..."

# Crear un archivo temporal con el endpoint
cat > /tmp/new_endpoint.py << 'EOF'

# Endpoint para obtener grabaciones organizadas por fecha/radio
@app.route('/api/recordings', methods=['GET'])
def get_recordings():
    """Obtiene todas las grabaciones organizadas por fecha y radio"""
    try:
        recordings = []
        base_path = "/home/radioapp/radio-recorder/recordings"
        
        # Verificar si el directorio existe
        if not os.path.exists(base_path):
            return jsonify({
                "recordings": [],
                "count": 0,
                "status": "error",
                "message": "Directorio de grabaciones no encontrado"
            }), 404
        
        # Recorrer todas las fechas (directorios con formato YYYY-MM-DD)
        for date_dir in sorted(os.listdir(base_path), reverse=True):
            date_path = os.path.join(base_path, date_dir)
            
            # Verificar si es un directorio y tiene formato de fecha
            if not os.path.isdir(date_path) or not re.match(r'\d{4}-\d{2}-\d{2}', date_dir):
                continue
            
            # Recorrer todas las radios en esta fecha
            for radio_dir in os.listdir(date_path):
                radio_path = os.path.join(date_path, radio_dir)
                
                if not os.path.isdir(radio_path):
                    continue
                
                # Extraer información de la radio del nombre del directorio
                # Formato: radio_id o radio_id_timestamp
                radio_id = radio_dir
                if radio_dir.startswith('radio_'):
                    radio_id = radio_dir[6:]  # Remover "radio_" prefix
                
                # Recorrer todos los archivos MP3 en esta radio
                for filename in os.listdir(radio_path):
                    if filename.endswith('.mp3'):
                        file_path = os.path.join(radio_path, filename)
                        file_stats = os.stat(file_path)
                        
                        # Extraer timestamp del filename si existe
                        # Formato: radio_RADIOID_YYYYMMDD_HHMMSS_UUID.mp3
                        timestamp = None
                        match = re.search(r'_(\d{8})_(\d{6})_', filename)
                        if match:
                            date_str = match.group(1)
                            time_str = match.group(2)
                            try:
                                timestamp = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}T{time_str[:2]}:{time_str[2:4]}:{time_str[4:6]}"
                            except:
                                timestamp = None
                        
                        # Si no se pudo extraer del filename, usar la fecha del archivo
                        if not timestamp:
                            timestamp = datetime.fromtimestamp(file_stats.st_mtime).isoformat()
                        
                        # Crear path relativo para el frontend
                        relative_path = os.path.join(date_dir, radio_dir, filename)
                        
                        recordings.append({
                            "filename": filename,
                            "path": relative_path,
                            "date": date_dir,
                            "radio_id": radio_id,
                            "size": file_stats.st_size,
                            "timestamp": timestamp,
                            "url": f"/api/download/{relative_path}"
                        })
        
        # Ordenar por timestamp descendente (más recientes primero)
        recordings.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            "recordings": recordings,
            "count": len(recordings),
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "recordings": [],
            "count": 0,
            "status": "error",
            "message": str(e)
        }), 500

# Endpoint para descargar archivos
@app.route('/api/download/<path:file_path>', methods=['GET'])
def download_file(file_path):
    """Descarga un archivo de grabación"""
    try:
        base_path = "/home/radioapp/radio-recorder/recordings"
        full_path = os.path.join(base_path, file_path)
        
        # Verificar que el archivo existe y es un archivo (no un directorio)
        if not os.path.isfile(full_path):
            return jsonify({
                "status": "error",
                "message": "Archivo no encontrado"
            }), 404
        
        # Verificar que es un archivo MP3
        if not file_path.endswith('.mp3'):
            return jsonify({
                "status": "error",
                "message": "Tipo de archivo no permitido"
            }), 403
        
        # Enviar el archivo
        return send_file(
            full_path,
            as_attachment=True,
            download_name=os.path.basename(full_path)
        )
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

EOF

# Encontrar dónde insertar (antes de if __name__ == '__main__')
if grep -q "if __name__ == '__main__'" "$API_SERVER"; then
    # Insertar antes de if __name__
    LINE_NUM=$(grep -n "if __name__ == '__main__'" "$API_SERVER" | cut -d: -f1)
    sed -i "${LINE_NUM}r /tmp/new_endpoint.py" "$API_SERVER"
else
    # Si no hay if __name__, agregar al final
    cat /tmp/new_endpoint.py >> "$API_SERVER"
fi

echo "✅ Endpoint agregado correctamente a api_server.py"

# Limpiar archivo temporal
rm -f /tmp/new_endpoint.py

# =============================================================================
# 4. REINICIAR SERVICIO
# =============================================================================
echo ""
echo "🔄 REINICIANDO SERVICIO: radio-recorder.service"
echo "============================================================"

systemctl restart radio-recorder.service
sleep 2

# Verificar estado
echo ""
echo "📊 ESTADO DEL SERVICIO:"
systemctl status radio-recorder.service --no-pager

# Esperar un momento más y verificar si está escuchando en el puerto 5000
sleep 3
echo ""
echo "🔍 Verificando puerto 5000:"
netstat -tulpn | grep :5000 || echo "⚠️  Puerto 5000 no está en escucha aún"

echo ""
echo "✅ CORRECCIÓN COMPLETADA"
echo "============================================================"
echo ""
echo "Próximos pasos:"
echo "1. Espera 10-15 segundos para que el servicio inicie completamente"
echo "2. Verifica el servicio: systemctl status radio-recorder.service"
echo "3. Prueba el endpoint: curl http://213.199.39.147:5000/api/recordings"
echo "4. Revisa logs si hay errores: journalctl -u radio-recorder.service -f"
echo ""
echo "Si el servicio no inicia, ejecuta:"
echo "  systemctl stop radio-recorder.service"
echo "  cd /home/radioapp/radio-recorder && source venv/bin/activate && python scripts/api_server.py"
echo ""