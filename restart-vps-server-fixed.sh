#!/bin/bash
# ==============================================================================
# SCRIPT DE REINICIO CORREGIDO - ACTIVA ENTORNO VIRTUAL
# ==============================================================================

set -e

echo "🔄 REINICIANDO SERVIDOR FLASK CON ENTORNO VIRTUAL"
echo "================================================="
echo ""

# Configuración
API_SERVER_PATH="/home/radioapp/radio-recorder/scripts/api_server.py"
SERVER_LOG="/home/radioapp/radio-recorder/server.log"
VENV_PATH="/home/radioapp/radio-recorder/venv"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
# PASO 1: VERIFICAR ENTORNO VIRTUAL
# ==============================================================================
echo "📋 PASO 1: VERIFICANDO ENTORNO VIRTUAL"
echo "--------------------------------------"

if [ -d "$VENV_PATH" ]; then
    print_status "Entorno virtual encontrado: $VENV_PATH"
else
    print_error "No se encontró el entorno virtual en $VENV_PATH"
    echo ""
    echo "Buscando entornos virtuales alternativos..."
    find /home/radioapp -name "bin/activate" 2>/dev/null | head -5
    echo ""
    echo "💡 Si no hay entorno virtual, necesitas crearlo:"
    echo "   cd /home/radioapp/radio-recorder"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install flask ffmpeg-python"
    exit 1
fi

# ==============================================================================
# PASO 2: MATAR PROCESO EXISTENTE
# ==============================================================================
echo ""
echo "🛑 PASO 2: DETENIENDO SERVIDOR ACTUAL"
echo "-------------------------------------"

if pgrep -f "api_server.py" > /dev/null; then
    OLD_PID=$(pgrep -f "api_server.py")
    print_status "Matando proceso existente (PID: $OLD_PID)..."
    pkill -f "api_server.py"
    sleep 2
    
    # Verificar que se mató
    if pgrep -f "api_server.py" > /dev/null; then
        print_warning "Proceso aún vivo, forzando con -9..."
        pkill -9 -f "api_server.py"
        sleep 1
    fi
    
    print_status "Proceso detenido"
else
    print_warning "No se encontró proceso previo"
fi

# ==============================================================================
# PASO 3: VERIFICAR DEPENDENCIAS
# ==============================================================================
echo ""
echo "📦 PASO 3: VERIFICANDO DEPENDENCIAS"
echo "-----------------------------------"

# Activar entorno virtual
source "$VENV_PATH/bin/activate"

# Verificar Flask
if python3 -c "import flask" 2>/dev/null; then
    FLASK_VERSION=$(python3 -c "import flask; print(flask.__version__)")
    print_status "Flask está instalado (versión: $FLASK_VERSION)"
else
    print_error "Flask NO está instalado en el entorno virtual"
    echo ""
    echo "Instalando Flask..."
    pip install flask
fi

# Verificar ffmpeg-python
if python3 -c "import ffmpeg" 2>/dev/null; then
    print_status "ffmpeg-python está instalado"
else
    print_warning "ffmpeg-python NO está instalado"
    echo "Instalando ffmpeg-python..."
    pip install ffmpeg-python
fi

# ==============================================================================
# PASO 4: INICIAR SERVIDOR
# ==============================================================================
echo ""
echo "▶️  PASO 4: INICIANDO NUEVO SERVIDOR"
echo "------------------------------------"

cd /home/radioapp/radio-recorder

# Verificar que el archivo existe
if [ ! -f "$API_SERVER_PATH" ]; then
    print_error "No se encontró $API_SERVER_PATH"
    exit 1
fi

# Iniciar servidor con entorno virtual activado
print_status "Iniciando servidor Flask..."
nohup python3 "$API_SERVER_PATH" > "$SERVER_LOG" 2>&1 &
NEW_PID=$!

# Esperar 3 segundos
sleep 3

# Verificar si el proceso está corriendo
if ps -p $NEW_PID > /dev/null; then
    print_status "✅ Servidor iniciado con éxito (PID: $NEW_PID)"
else
    print_error "❌ Falló el inicio del servidor"
    echo ""
    echo "Últimas líneas del log:"
    tail -n 20 "$SERVER_LOG"
    echo ""
    echo "Intentando iniciar en modo debug..."
    echo "Ejecuta manualmente:"
    echo "  cd /home/radioapp/radio-recorder"
    echo "  source venv/bin/activate"
    echo "  python3 $API_SERVER_PATH"
    exit 1
fi

# ==============================================================================
# PASO 5: VERIFICAR PUERTO
# ==============================================================================
echo ""
echo "🔍 PASO 5: VERIFICANDO PUERTO 5000"
echo "----------------------------------"

sleep 2

if ss -tuln | grep -q ":5000"; then
    print_status "✅ Puerto 5000 está escuchando"
else
    print_warning "⚠️ Puerto 5000 no responde inmediatamente"
    echo "Esperando 3 segundos más..."
    sleep 3
    
    if ss -tuln | grep -q ":5000"; then
        print_status "✅ Puerto 5000 ahora está escuchando"
    else
        print_error "❌ Puerto 5000 no está disponible"
        echo "Verifica el log completo:"
        echo "  tail -n 50 $SERVER_LOG"
    fi
fi

# ==============================================================================
# PASO 6: VERIFICAR ENDPOINT
# ==============================================================================
echo ""
echo "🧪 PASO 6: PROBANDO ENDPOINT /api/recordings"
echo "---------------------------------------------"

sleep 3

RESPONSE=$(curl -s http://localhost:5000/api/recordings 2>&1)
if [ $? -eq 0 ]; then
    API_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('count', 0))" 2>/dev/null || echo "0")
    print_status "✅ Endpoint responde correctamente"
    print_status "Grabaciones reportadas: $API_COUNT"
else
    print_error "❌ Endpoint no responde"
    echo "Error: $RESPONSE"
fi

echo ""
echo "🎉 PROCESO COMPLETADO"
echo "====================="
echo ""
echo "Para ver logs en tiempo real:"
echo "  tail -f $SERVER_LOG"
echo ""
echo "Para detener el servidor:"
echo "  pkill -f api_server.py"
echo ""
echo "Estado actual:"
ps aux | grep -v grep | grep api_server || echo "⚠️ Servidor no encontrado en ps"