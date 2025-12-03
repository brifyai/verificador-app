#!/bin/bash

echo "🔍 BUSCANDO COMPONENTES DEL SISTEMA DE GRABACIONES"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir resultados
print_result() {
    if [ -n "$2" ]; then
        echo -e "${GREEN}✅ ENCONTRADO:${NC} $1"
        echo "   Ruta: $2"
        return 0
    else
        echo -e "${RED}❌ NO ENCONTRADO:${NC} $1"
        return 1
    fi
}

echo "📁 1. Buscando directorio base..."
BASE_DIR=$(find /home -type d -name "radio-recorder" 2>/dev/null | head -1)
print_result "Directorio radio-recorder" "$BASE_DIR"

echo ""
echo "🐍 2. Buscando aplicación Flask..."
FLASK_APP=$(find /home -name "app.py" -type f 2>/dev/null | grep -E "(radio|flask|app)" | head -1)
if [ -z "$FLASK_APP" ]; then
    FLASK_APP=$(find /home -name "*.py" -type f 2>/dev/null | grep -E "(radio|flask|app)" | head -1)
fi
print_result "Aplicación Flask (app.py)" "$FLASK_APP"

echo ""
echo "📂 3. Buscando directorio de grabaciones..."
RECORDINGS_DIR=$(find /home -type d -name "recordings" 2>/dev/null | head -1)
print_result "Directorio recordings" "$RECORDINGS_DIR"

echo ""
echo "🎵 4. Buscando archivos de grabación..."
MP3_FILES=$(find /home -name "*.mp3" -type f 2>/dev/null | head -3)
if [ -n "$MP3_FILES" ]; then
    echo -e "${GREEN}✅ ENCONTRADO:${NC} Archivos MP3"
    echo "$MP3_FILES" | while read file; do
        echo "   - $file"
    done
else
    echo -e "${RED}❌ NO ENCONTRADO:${NC} Archivos MP3"
fi

echo ""
echo "⚙️  5. Buscando servicio systemd..."
SYSTEMD_SERVICE=$(find /etc/systemd/system -name "*radio*" -type f 2>/dev/null | head -1)
print_result "Servicio systemd" "$SYSTEMD_SERVICE"

echo ""
echo "📝 6. Buscando archivos de configuración..."
CONFIG_FILES=$(find /home -name "*.json" -o -name "*.yaml" -o -name "*.yml" 2>/dev/null | grep -E "(radio|config|settings)" | head -3)
if [ -n "$CONFIG_FILES" ]; then
    echo -e "${GREEN}✅ ENCONTRADO:${NC} Archivos de configuración"
    echo "$CONFIG_FILES" | while read file; do
        echo "   - $file"
    done
else
    echo -e "${YELLOW}⚠️  NO ENCONTRADO:${NC} Archivos de configuración"
fi

echo ""
echo "🔍 7. Buscando procesos en ejecución..."
PYTHON_PROCS=$(ps aux | grep -i python | grep -v grep)
if [ -n "$PYTHON_PROCS" ]; then
    echo -e "${GREEN}✅ ENCONTRADO:${NC} Procesos Python"
    echo "$PYTHON_PROCS" | while read proc; do
        echo "   $proc" | cut -c1-100
    done
else
    echo -e "${YELLOW}⚠️  NO ENCONTRADO:${NC} Procesos Python en ejecución"
fi

echo ""
echo "📊 RESUMEN"
echo "=================================================="
if [ -n "$BASE_DIR" ]; then
    echo -e "${GREEN}✅ Directorio base:${NC} $BASE_DIR"
else
    echo -e "${RED}❌ Directorio base no encontrado${NC}"
fi

if [ -n "$FLASK_APP" ]; then
    echo -e "${GREEN}✅ App Flask:${NC} $FLASK_APP"
else
    echo -e "${RED}❌ App Flask no encontrada${NC}"
fi

if [ -n "$RECORDINGS_DIR" ]; then
    echo -e "${GREEN}✅ Grabaciones:${NC} $RECORDINGS_DIR"
else
    echo -e "${RED}❌ Directorio de grabaciones no encontrado${NC}"
fi

echo ""
echo "🔧 SIGUIENTES PASOS:"
echo "1. Si encontraste la app Flask en otra ruta, actualiza el script"
echo "2. Si no hay grabaciones, el sistema nunca grabó nada"
echo "3. Si el servicio no existe, necesitas crearlo"
echo ""