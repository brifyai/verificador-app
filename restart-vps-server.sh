#!/bin/bash

################################################################################
# REINICIAR SERVIDOR VPS - Solución completa
# 
# Este script:
# 1. Mata el proceso que usa el puerto 5000
# 2. Verifica el script de grabación
# 3. Reinicia el servidor Flask
# 4. Verifica que todo está funcionando
################################################################################

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   REINICIANDO SERVIDOR VPS - SOLUCIÓN COMPLETA               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Función de log
log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# 1. Verificar directorio
log_section "1. VERIFICANDO DIRECTORIO"

if [ ! -d "scripts" ] || [ ! -d "recordings" ]; then
    log_error "No estás en el directorio /home/radioapp/radio-recorder"
    log_info "Navega al directorio correcto: cd /home/radioapp/radio-recorder"
    exit 1
fi

log_success "Directorio correcto: $(pwd)"

# 2. Matar proceso en puerto 5000
log_section "2. MATANDO PROCESO EN PUERTO 5000"

log_info "Buscando proceso que usa el puerto 5000..."
PID=$(lsof -ti:5000 2>/dev/null || netstat -tuln 2>/dev/null | grep :5000 | awk '{print $7}' | cut -d'/' -f1 || ss -tuln 2>/dev/null | grep :5000 | awk '{print $7}' | cut -d'/' -f1)

if [ -n "$PID" ]; then
    log_info "Encontrado proceso con PID: $PID"
    log_info "Matando proceso..."
    kill -9 $PID
    sleep 2
    log_success "Proceso eliminado"
else
    log_info "No se encontró proceso en el puerto 5000"
fi

# 3. Verificar script de grabación
log_section "3. VERIFICANDO SCRIPT DE GRABACIÓN"

SCRIPT_PATH="scripts/record_radio.sh"

if [ -f "$SCRIPT_PATH" ]; then
    log_success "Script encontrado: $SCRIPT_PATH"
    
    # Verificar si tiene el flag correcto
    if grep -q "ffmpeg.*-tls_verify 0.*-i" "$SCRIPT_PATH"; then
        log_success "✅ Script TIENE el flag correcto: -tls_verify 0"
    elif grep -q "ffmpeg.*-k.*-i" "$SCRIPT_PATH"; then
        log_error "❌ Script TIENE el flag INCORRECTO: -k (debe ser -tls_verify 0)"
        log_info "Corrigiendo script..."
        sed -i 's/ffmpeg -k -i/ffmpeg -tls_verify 0 -i/g' "$SCRIPT_PATH"
        log_success "Script corregido"
    else
        log_warning "⚠️  No se encontró flag -k ni -tls_verify 0"
        log_info "Verifica manualmente el script"
    fi
    
    echo ""
    echo "Contenido actual (línea de ffmpeg):"
    echo "----------------------------------------"
    grep -n "ffmpeg.*-i" "$SCRIPT_PATH" || echo "No se encontró línea con ffmpeg"
    echo "----------------------------------------"
else
    log_error "No se encontró el script: $SCRIPT_PATH"
    exit 1
fi

# 4. Reiniciar servidor Flask
log_section "4. REINICIANDO SERVIDOR FLASK"

log_info "Verificando que no hay proceso en puerto 5000..."
if lsof -ti:5000 >/dev/null 2>&1; then
    log_error "Aún hay un proceso en el puerto 5000"
    log_info "Ejecuta manualmente: lsof -ti:5000 | xargs kill -9"
    exit 1
fi

log_info "Iniciando servidor Flask..."
cd scripts
nohup /home/radioapp/radio-recorder/venv/bin/python3 api_server.py > ../server.log 2>&1 &

SERVER_PID=$!
sleep 3

# Verificar si el servidor está corriendo
if ps -p $SERVER_PID > /dev/null; then
    log_success "✅ Servidor Flask iniciado correctamente (PID: $SERVER_PID)"
    
    # Verificar puerto 5000
    if lsof -ti:5000 >/dev/null 2>&1; then
        log_success "✅ Puerto 5000 está escuchando"
    else
        log_warning "⚠️  Puerto 5000 no responde inmediatamente"
        log_info "Espera 5 segundos y verifica: lsof -ti:5000"
    fi
else
    log_error "❌ El servidor no se inició correctamente"
    log_info "Revisa el log: tail -f /home/radioapp/radio-recorder/server.log"
    exit 1
fi

# 5. Verificar logs
log_section "5. VERIFICANDO LOGS"

echo "Últimas líneas del log:"
echo "----------------------------------------"
tail -20 /home/radioapp/radio-recorder/server.log
echo "----------------------------------------"

# 6. Resumen
log_section "📋 RESUMEN"

echo "Servidor Flask reiniciado correctamente"
echo ""
echo "Para verificar el estado:"
echo "  • Ver logs: tail -f /home/radioapp/radio-recorder/server.log"
echo "  • Ver proceso: ps aux | grep api_server.py"
echo "  • Ver puerto: lsof -ti:5000"
echo ""
echo "Para probar una grabación:"
echo "  curl -X POST http://213.199.39.147:5000/api/start-recording \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"radio_id\": \"test\", \"radio_url\": \"https://radio.digitalfm.cl:8000/arica\", \"radio_name\": \"Test\"}'"
echo ""

log_success "✅ Proceso completado"