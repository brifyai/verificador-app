#!/bin/bash
# ==============================================================================
# SCRIPT MAESTRO: FIX COMPLETO DEL SISTEMA DE GRABACIONES
# Este script hace TODO automáticamente:
# 1. Diagnóstico del estado actual
# 2. Fix del método get_recordings_list()
# 3. Reinicio manual del servidor
# 4. Verificación completa
# ==============================================================================

set -e  # Detener en el primer error

echo "🚀 INICIANDO FIX COMPLETO DEL SISTEMA DE GRABACIONES"
echo "===================================================="
echo ""

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================
RADIO_MANAGER_PATH="/home/radioapp/radio-recorder/scripts/radio_manager.py"
API_SERVER_PATH="/home/radioapp/radio-recorder/scripts/api_server.py"
RECORDINGS_DIR="/home/radioapp/radio-recorder/recordings"
SERVER_LOG="/home/radioapp/radio-recorder/server.log"
BACKUP_DIR="/home/radioapp/radio-recorder/backups/$(date +%Y%m%d_%H%M%S)"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==============================================================================
# FUNCIÓN: Imprimir mensaje con color
# ==============================================================================
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# ==============================================================================
# PASO 1: DIAGNÓSTICO INICIAL
# ==============================================================================
echo "📋 PASO 1: DIAGNÓSTICO INICIAL"
echo "-------------------------------"

# Verificar si el directorio existe
if [ ! -d "/home/radioapp/radio-recorder" ]; then
    print_error "No se encontró el directorio /home/radioapp/radio-recorder"
    exit 1
fi

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"
print_status "Directorio de backups creado: $BACKUP_DIR"

# Contar grabaciones en disco
if [ -d "$RECORDINGS_DIR" ]; then
    DISK_COUNT=$(find "$RECORDINGS_DIR" -name "*.mp3" | wc -l)
    print_status "Grabaciones encontradas en disco: $DISK_COUNT"
else
    print_error "No se encontró el directorio de grabaciones"
    exit 1
fi

# Verificar si el servidor está corriendo
if pgrep -f "api_server.py" > /dev/null; then
    print_status "Servidor Flask está corriendo"
    SERVER_PID=$(pgrep -f "api_server.py")
    print_status "PID del servidor: $SERVER_PID"
else
    print_warning "Servidor Flask NO está corriendo"
fi

# Verificar puerto 5000
if ss -tuln | grep -q ":5000"; then
    print_status "Puerto 5000 está escuchando"
else
    print_warning "Puerto 5000 NO está escuchando"
fi

echo ""

# ==============================================================================
# PASO 2: BACKUP DEL ARCHIVO RADIO_MANAGER.PY
# ==============================================================================
echo "💾 PASO 2: CREANDO BACKUP"
echo "-------------------------"
BACKUP_PATH="${BACKUP_DIR}/radio_manager.py.backup"
cp "$RADIO_MANAGER_PATH" "$BACKUP_PATH"
print_status "Backup creado: $BACKUP_PATH"
echo ""

# ==============================================================================
# PASO 3: FIX DEL MÉTODO GET_RECORDINGS_LIST()
# ==============================================================================
echo "🔧 PASO 3: APLICANDO FIX AL MÉTODO GET_RECORDINGS_LIST()"
echo "--------------------------------------------------------"

# Buscar la línea donde comienza el método
START_LINE=$(grep -n "def get_recordings_list(self):" "$RADIO_MANAGER_PATH" | cut -d: -f1)

if [ -z "$START_LINE" ]; then
    print_error "No se encontró el método get_recordings_list()"
    exit 1
fi

print_status "Método encontrado en línea $START_LINE"

# Encontrar dónde termina el método (buscar la siguiente función o clase)
END_LINE=$(tail -n +$START_LINE "$RADIO_MANAGER_PATH" | grep -n -E "^    def |^class " | head -1 | cut -d: -f1)

if [ -z "$END_LINE" ] || [ "$END_LINE" -eq 1 ]; then
    # Si no encontramos otra función, ir hasta el final del archivo
    END_LINE=$(wc -l < "$RADIO_MANAGER_PATH")
else
    END_LINE=$((START_LINE + END_LINE - 2))
fi

print_status "Método termina en línea $END_LINE"

# Crear el nuevo método
cat > /tmp/new_method.py << 'EOF'
    def get_recordings_list(self):
        """Obtener lista de archivos grabados - FIXED VERSION"""
        recordings = []
        try:
            # Usar os.walk() para encontrar TODOS los archivos MP3 recursivamente
            for root, dirs, files in os.walk(RECORDINGS_DIR):
                for filename in files:
                    if filename.endswith('.mp3'):
                        filepath = os.path.join(root, filename)
                        try:
                            file_info = {
                                "filename": filename,
                                "size": os.path.getsize(filepath),
                                "created": datetime.fromtimestamp(os.path.getctime(filepath)).isoformat(),
                                "path": filepath
                            }
                            recordings.append(file_info)
                        except Exception as e:
                            print(f"Error procesando {filepath}: {e}")
        except Exception as e:
            print(f"Error listando grabaciones: {e}")
        
        return sorted(recordings, key=lambda x: x["created"], reverse=True)
EOF

# Reconstruir el archivo
head -n $((START_LINE - 1)) "$RADIO_MANAGER_PATH" > /tmp/radio_manager_fixed.py
cat /tmp/new_method.py >> /tmp/radio_manager_fixed.py
tail -n +$((END_LINE + 1)) "$RADIO_MANAGER_PATH" >> /tmp/radio_manager_fixed.py

# Verificar que el archivo no está vacío
if [ ! -s /tmp/radio_manager_fixed.py ]; then
    print_error "Error: El archivo temporal está vacío"
    exit 1
fi

# Reemplazar el archivo original
mv /tmp/radio_manager_fixed.py "$RADIO_MANAGER_PATH"
rm -f /tmp/new_method.py

print_status "✅ Método get_recordings_list() actualizado con éxito"
echo ""

# ==============================================================================
# PASO 4: REINICIAR SERVIDOR FLASK
# ==============================================================================
echo "🔄 PASO 4: REINICIANDO SERVIDOR FLASK"
echo "-------------------------------------"

# Matar proceso existente
print_status "Matando proceso existente..."
pkill -f "api_server.py" || print_warning "No se encontró proceso previo"

# Esperar 2 segundos
sleep 2

# Ir al directorio
cd /home/radioapp/radio-recorder

# Iniciar servidor en segundo plano
print_status "Iniciando nuevo servidor..."
nohup python3 "$API_SERVER_PATH" > "$SERVER_LOG" 2>&1 &
NEW_PID=$!

# Esperar 3 segundos
sleep 3

# Verificar si el proceso está corriendo
if ps -p $NEW_PID > /dev/null; then
    print_status "✅ Servidor iniciado con éxito (PID: $NEW_PID)"
else
    print_error "❌ Falló el inicio del servidor"
    echo "Últimas líneas del log:"
    tail -n 10 "$SERVER_LOG"
    exit 1
fi

# Verificar puerto 5000
sleep 2
if ss -tuln | grep -q ":5000"; then
    print_status "✅ Puerto 5000 está escuchando"
else
    print_warning "⚠️ Puerto 5000 no responde inmediatamente"
fi

echo ""

# ==============================================================================
# PASO 5: VERIFICACIÓN
# ==============================================================================
echo "✅ PASO 5: VERIFICACIÓN"
echo "----------------------"

# Esperar 5 segundos para que el servidor se estabilice
print_status "Esperando 5 segundos para estabilización..."
sleep 5

# Probar endpoint /api/recordings
print_status "Probando endpoint /api/recordings..."
RESPONSE=$(curl -s http://localhost:5000/api/recordings)
if [ $? -eq 0 ]; then
    API_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('count', 0))")
    print_status "✅ Endpoint responde correctamente"
    print_status "Grabaciones reportadas por API: $API_COUNT"
    
    if [ "$API_COUNT" -eq "$DISK_COUNT" ]; then
        print_status "🎉 TODO COINCIDE: API muestra las mismas grabaciones que el disco"
    else
        print_warning "⚠️ Diferencia detectada: API=$API_COUNT, Disco=$DISK_COUNT"
    fi
else
    print_error "❌ Endpoint no responde"
    echo "Últimas líneas del log:"
    tail -n 10 "$SERVER_LOG"
    exit 1
fi

echo ""

# ==============================================================================
# PASO 6: RESUMEN FINAL
# ==============================================================================
echo "📊 RESUMEN FINAL"
echo "================"
print_status "Backup creado en: $BACKUP_DIR"
print_status "Método get_recordings_list() actualizado"
print_status "Servidor reiniciado (PID: $NEW_PID)"
print_status "Grabaciones en disco: $DISK_COUNT"
print_status "Grabaciones en API: $API_COUNT"
echo ""
echo "🎉 ¡PROCESO COMPLETADO CON ÉXITO!"
echo ""
echo "Próximos pasos:"
echo "1. Verifica en el frontend que las grabaciones aparecen"
echo "2. Si todo está bien, puedes borrar backups antiguos"
echo "3. Si hay problemas, restaura el backup: cp $BACKUP_PATH $RADIO_MANAGER_PATH"
echo ""
echo "Log del servidor: $SERVER_LOG"
echo "Para ver logs en tiempo real: tail -f $SERVER_LOG"