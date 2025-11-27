#!/bin/bash

################################################################################
# FIX FFMPEG FLAG - Corregir de -k a -tls_verify 0
# 
# Este script corrige el flag de ffmpeg para versiones que no soportan -k
# Uso: ./fix-ffmpeg-flag-vps.sh
################################################################################

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   CORRIGIENDO FLAG DE FFMPEG (DE -k A -tls_verify 0)         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "scripts" ] || [ ! -d "recordings" ]; then
    echo -e "${RED}Error: Debes ejecutar este script desde /home/radioapp/radio-recorder${NC}"
    exit 1
fi

SCRIPT_PATH="scripts/record_radio.sh"

if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}Error: No se encontró $SCRIPT_PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}Verificando contenido actual del script...${NC}"
echo "----------------------------------------"
grep -n "ffmpeg.*-i" "$SCRIPT_PATH" || echo "No se encontró línea con ffmpeg"
echo "----------------------------------------"
echo ""

# Hacer backup
BACKUP_PATH="${SCRIPT_PATH}.backup.$(date +%s)"
echo -e "${YELLOW}Creando backup: $BACKUP_PATH${NC}"
cp "$SCRIPT_PATH" "$BACKUP_PATH"
echo -e "${GREEN}✓ Backup creado${NC}"
echo ""

# Verificar si tiene -k
if grep -q "ffmpeg.*-k.*-i" "$SCRIPT_PATH"; then
    echo -e "${YELLOW}Encontrado flag -k, reemplazando por -tls_verify 0...${NC}"
    
    # Reemplazar el flag
    sed -i 's/ffmpeg -k -i/ffmpeg -tls_verify 0 -i/g' "$SCRIPT_PATH"
    
    echo -e "${GREEN}✓ Reemplazo completado${NC}"
    echo ""
    
    echo -e "${YELLOW}Verificando cambio:${NC}"
    echo "----------------------------------------"
    grep -n "ffmpeg.*-i" "$SCRIPT_PATH"
    echo "----------------------------------------"
    echo ""
    
    echo -e "${GREEN}✅ CORRECCIÓN APLICADA EXITOSAMENTE${NC}"
    echo ""
    echo "El script ahora usa '-tls_verify 0' en lugar de '-k'"
    echo "Esto es compatible con ffmpeg 6.1.1-3ubuntu5"
    
else
    echo -e "${YELLOW}No se encontró el flag -k en el script${NC}"
    echo -e "${GREEN}El script ya está corregido o usa otro método${NC}"
fi

echo ""
echo -e "${YELLOW}Prueba manual de ffmpeg:${NC}"
echo "Ejecuta: timeout 10 ffmpeg -tls_verify 0 -i \"https://radio.digitalfm.cl:8000/arica\" -t 10 -c copy -y /tmp/test.mp3"
echo ""