#!/bin/bash

################################################################################
# DIAGNÓSTICO COMPLETO - VPS RADIO RECORDER
# 
# INSTRUCCIONES:
# 1. Conéctate a tu VPS: ssh radioapp@213.199.39.147
# 2. Navega al directorio: cd /home/radioapp/radio-recorder
# 3. Ejecuta este script: bash diagnostic-vps-remote.sh
################################################################################

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   DIAGNÓSTICO COMPLETO - VPS RADIO RECORDER                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funciones de log
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# 1. Verificar estructura de directorios
log_section "1. VERIFICANDO ESTRUCTURA DE DIRECTORIOS"

if [ -d "/home/radioapp/radio-recorder" ]; then
    log_success "Directorio principal existe"
    cd /home/radioapp/radio-recorder
    
    # Verificar subdirectorios
    for dir in scripts recordings logs; do
        if [ -d "$dir" ]; then
            log_success "Directorio $dir/ existe"
        else
            log_error "Directorio $dir/ NO existe"
            log_info "Creando directorio $dir/"
            mkdir -p "$dir"
        fi
    done
else
    log_error "Directorio principal NO existe"
    exit 1
fi

# 2. Verificar script de grabación
log_section "2. VERIFICANDO SCRIPT DE GRABACIÓN"

SCRIPT_PATH="scripts/record_radio.sh"

if [ -f "$SCRIPT_PATH" ]; then
    log_success "Script record_radio.sh existe"
    
    # Verificar permisos
    if [ -x "$SCRIPT_PATH" ]; then
        log_success "Script tiene permisos de ejecución"
    else
        log_warning "Script NO tiene permisos de ejecución"
        log_info "Asignando permisos..."
        chmod +x "$SCRIPT_PATH"
    fi
    
    # Verificar contenido del script
    log_info "Contenido del script (líneas clave):"
    echo "----------------------------------------"
    grep -n "ffmpeg" "$SCRIPT_PATH" || log_warning "No se encontró comando ffmpeg"
    grep -n "BLOCK_DURATION" "$SCRIPT_PATH" || log_warning "No se encontró BLOCK_DURATION"
    grep -n "RADIO_URL" "$SCRIPT_PATH" || log_warning "No se encontró RADIO_URL"
    echo "----------------------------------------"
    
    # Verificar si tiene el flag -k
    if grep -q "ffmpeg.*-k" "$SCRIPT_PATH"; then
        log_success "✅ Script TIENE el flag -k (insecure) en ffmpeg"
    else
        log_error "❌ Script NO tiene el flag -k en ffmpeg"
        log_info "El flag -k es necesario para ignorar errores de certificado SSL"
        log_info "Edita el script y asegúrate de que el comando ffmpeg sea:"
        echo ""
        echo "  timeout \$BLOCK_DURATION ffmpeg -k -i \"\$RADIO_URL\" -t \$BLOCK_DURATION -c copy -y \"\$filepath\""
        echo ""
    fi
    
    # Verificar errores de sintaxis
    log_info "Verificando sintaxis del script..."
    bash -n "$SCRIPT_PATH" && log_success "Sintaxis del script OK" || log_error "Error de sintaxis en el script"
    
else
    log_error "Script record_radio.sh NO existe en $SCRIPT_PATH"
fi

# 3. Verificar servidor Flask
log_section "3. VERIFICANDO SERVIDOR FLASK"

API_SERVER_PATH="scripts/api_server.py"

if [ -f "$API_SERVER_PATH" ]; then
    log_success "Servidor api_server.py existe"
    
    # Verificar si está corriendo
    if ps aux | grep -q "[a]pi_server.py"; then
        PID=$(ps aux | grep "[a]pi_server.py" | awk '{print $2}')
        log_success "Servidor está corriendo (PID: $PID)"
        
        # Verificar puerto
        if netstat -tuln 2>/dev/null | grep -q ":5000" || ss -tuln 2>/dev/null | grep -q ":5000"; then
            log_success "Puerto 5000 está escuchando"
        else
            log_warning "Puerto 5000 NO está escuchando"
        fi
    else
        log_warning "Servidor NO está corriendo"
        log_info "Para iniciar el servidor:"
        echo ""
        echo "  cd /home/radioapp/radio-recorder/scripts"
        echo "  nohup /home/radioapp/radio-recorder/venv/bin/python3 api_server.py > ../server.log 2>&1 &"
        echo ""
    fi
else
    log_error "Servidor api_server.py NO existe"
fi

# 4. Verificar entorno virtual
log_section "4. VERIFICANDO ENTORNO VIRTUAL"

if [ -d "/home/radioapp/radio-recorder/venv" ]; then
    log_success "Entorno virtual existe"
    
    # Verificar Python
    if [ -f "/home/radioapp/radio-recorder/venv/bin/python3" ]; then
        log_success "Python3 está disponible en el venv"
        PYTHON_VERSION=$(/home/radioapp/radio-recorder/venv/bin/python3 --version)
        log_info "Versión de Python: $PYTHON_VERSION"
    else
        log_error "Python3 NO está disponible en el venv"
    fi
    
    # Verificar Flask
    if /home/radioapp/radio-recorder/venv/bin/python3 -c "import flask" 2>/dev/null; then
        log_success "Flask está instalado"
    else
        log_error "Flask NO está instalado"
        log_info "Instala Flask: /home/radioapp/radio-recorder/venv/bin/pip install flask"
    fi
else
    log_error "Entorno virtual NO existe"
    log_info "Crea el entorno virtual:"
    echo ""
    echo "  cd /home/radioapp/radio-recorder"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install flask requests"
    echo ""
fi

# 5. Probar ffmpeg
log_section "5. PROBANDO FFMPEG"

if command -v ffmpeg &> /dev/null; then
    log_success "ffmpeg está instalado"
    FFMPEG_VERSION=$(ffmpeg -version | head -n1)
    log_info "Versión: $FFMPEG_VERSION"
    
    # Probar ffmpeg con el stream de radio
    log_info "Probando ffmpeg con el stream de radio (10 segundos)..."
    echo ""
    
    timeout 10 ffmpeg -k -i "https://radio.digitalfm.cl:8000/arica" -t 10 -c copy -y /tmp/test-radio.mp3 2>&1 | tee /tmp/ffmpeg-test.log
    
    if [ -f "/tmp/test-radio.mp3" ]; then
        FILE_SIZE=$(ls -lh /tmp/test-radio.mp3 | awk '{print $5}')
        log_success "✅ FFMPEG FUNCIONA! Archivo creado: /tmp/test-radio.mp3 ($FILE_SIZE)"
        rm -f /tmp/test-radio.mp3 /tmp/ffmpeg-test.log
    else
        log_error "❌ FFMPEG FALLÓ: No se creó el archivo"
        log_info "Revisa el log en /tmp/ffmpeg-test.log"
        if [ -f "/tmp/ffmpeg-test.log" ]; then
            echo "Últimas líneas del log:"
            tail -20 /tmp/ffmpeg-test.log
        fi
    fi
    
else
    log_error "ffmpeg NO está instalado"
    log_info "Instala ffmpeg: sudo apt-get install ffmpeg"
fi

# 6. Verificar permisos de directorios
log_section "6. VERIFICANDO PERMISOS"

log_info "Permisos de directorios:"
echo "----------------------------------------"
ls -ld /home/radioapp/radio-recorder/
ls -ld /home/radioapp/radio-recorder/scripts/
ls -ld /home/radioapp/radio-recorder/recordings/
ls -ld /home/radioapp/radio-recorder/logs/
echo "----------------------------------------"

log_info "Usuario actual: $(whoami)"
log_info "ID de usuario: $(id)"

# 7. Probar grabación completa
log_section "7. PROBANDO GRABACIÓN COMPLETA"

log_info "Iniciando grabación de prueba de 30 segundos..."
echo ""

# Crear archivo de prueba
TEST_ID="test-diagnostic-$(date +%s)"
cd /home/radioapp/radio-recorder

# Ejecutar el script directamente
timeout 30 /home/radioapp/radio-recorder/scripts/record_radio.sh \
  "https://radio.digitalfm.cl:8000/arica" \
  "radio-test" \
  "Radio Test" \
  "$TEST_ID" 2>&1 | tee "logs/${TEST_ID}.log"

echo ""
log_info "Verificando si se creó el archivo..."
sleep 2

if [ -f "recordings/${TEST_ID}_block_*.mp3" ]; then
    log_success "✅ GRABACIÓN EXITOSA!"
    ls -lh recordings/${TEST_ID}_*.mp3
    rm -f recordings/${TEST_ID}_*.mp3
elif [ -f "recordings/${TEST_ID}.mp3" ]; then
    log_success "✅ GRABACIÓN EXITOSA!"
    ls -lh recordings/${TEST_ID}.mp3
    rm -f recordings/${TEST_ID}.mp3
else
    log_error "❌ GRABACIÓN FALLIDA: No se creó el archivo"
    log_info "Revisa el log completo en: logs/${TEST_ID}.log"
    echo ""
    echo "Últimas líneas del log:"
    tail -30 "logs/${TEST_ID}.log"
fi

# 8. Resumen
log_section "📋 RESUMEN DEL DIAGNÓSTICO"

echo "Si la prueba de grabación falló, los problemas más comunes son:"
echo ""
echo "1. ${RED}Falta el flag -k en ffmpeg${NC} - Edita scripts/record_radio.sh"
echo "2. ${RED}Error de sintaxis${NC} en el script"
echo "3. ${RED}Permisos incorrectos${NC} en directorios"
echo "4. ${RED}ffmpeg no está instalado${NC} o no funciona"
echo ""

echo -e "${CYAN}Para corregir el flag -k en ffmpeg:${NC}"
echo "Edita scripts/record_radio.sh y asegúrate de que la línea de ffmpeg sea:"
echo ""
echo -e "${GREEN}  timeout \$BLOCK_DURATION ffmpeg -k -i \"\$RADIO_URL\" -t \$BLOCK_DURATION -c copy -y \"\$filepath\"${NC}"
echo ""

echo -e "${CYAN}Para reiniciar el servidor después de correcciones:${NC}"
echo "  pkill -f api_server.py"
echo "  cd /home/radioapp/radio-recorder/scripts"
echo "  nohup /home/radioapp/radio-recorder/venv/bin/python3 api_server.py > ../server.log 2>&1 &"
echo ""

log_success "Diagnóstico completado!"