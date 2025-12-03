#!/bin/bash

# ============================================
# SCRIPT PARA LIMPIAR Y REINICIAR EL VPS
# ============================================
# Contraseña VPS: Aintelligence2025
# IP VPS: 213.199.39.147

echo "🔧 SOLUCIONANDO PROBLEMA DE GRABACIONES EN VPS"
echo "=============================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📡 Conectando al VPS para limpiar archivos corruptos...${NC}"
echo ""

# Crear script para ejecutar en el VPS
cat > /tmp/fix_vps.sh << 'EOF'
#!/bin/bash

echo "🔧 LIMPIANDO Y REINICIANDO SERVICIO DE GRABACIÓN"
echo "================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📁 Navegando al directorio de grabaciones...${NC}"
cd /home/radioapp/radio-recorder
echo "Directorio actual: $(pwd)"
echo ""

echo -e "${BLUE}🗑️ Identificando archivos corruptos...${NC}"
CORRUPT_FILES=(
    "radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3"
    "radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3"
    "radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3"
)

echo "Archivos corruptos encontrados:"
for file in "${CORRUPT_FILES[@]}"; do
    if [ -f "recordings/$file" ]; then
        echo -e "  ${RED}❌ $file${NC}"
        ls -la "recordings/$file"
    else
        echo -e "  ${GREEN}✅ $file (no existe)${NC}"
    fi
done
echo ""

echo -e "${BLUE}🧹 Eliminando archivos corruptos...${NC}"
for file in "${CORRUPT_FILES[@]}"; do
    if [ -f "recordings/$file" ]; then
        echo "Eliminando: $file"
        rm -f "recordings/$file"
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ Eliminado: $file${NC}"
        else
            echo -e "  ${RED}❌ Error eliminando: $file${NC}"
        fi
    fi
done
echo ""

echo -e "${BLUE}📊 Verificando archivos restantes...${NC}"
echo "Total archivos .mp3 después de limpieza:"
find recordings/ -name "*.mp3" -type f | wc -l
echo ""

echo -e "${BLUE}🔄 Reiniciando servicio de grabación...${NC}"
echo "Deteniendo servicio..."
pkill -f radio-recorder 2>/dev/null || echo "No hay proceso radio-recorder ejecutándose"
sleep 2

echo "Iniciando servicio..."
cd /home/radioapp/radio-recorder
nohup python3 radio_recorder.py > logs/radio-recorder.log 2>&1 &
sleep 3

echo "Verificando estado del servicio..."
ps aux | grep -i radio-recorder | grep -v grep
echo ""

echo -e "${BLUE}🌐 Probando API del VPS...${NC}"
echo "Endpoint /api/recordings:"
sleep 2
curl -s http://localhost:5000/api/recordings
echo ""
echo ""

echo -e "${BLUE}📝 Mostrando logs recientes...${NC}"
if [ -f logs/radio-recorder.log ]; then
    echo "Últimas 10 líneas del log:"
    tail -10 logs/radio-recorder.log
else
    echo -e "${YELLOW}⚠️ Log no encontrado${NC}"
fi
echo ""

echo -e "${GREEN}✅ LIMPIEZA Y REINICIO COMPLETADO${NC}"
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASOS:${NC}"
echo "1. Ir a http://localhost:3000/radios"
echo "2. Hacer una grabación de prueba"
echo "3. Verificar que aparece en http://localhost:3000/grabaciones"
echo ""
echo -e "${BLUE}🔍 MONITOREO:${NC}"
echo "Para ver logs en tiempo real:"
echo "  tail -f logs/radio-recorder.log"
echo ""
echo "Para verificar archivos:"
echo "  ls -la recordings/"
echo ""

EOF

# Hacer ejecutable el script temporal
chmod +x /tmp/fix_vps.sh

# Ejecutar comandos en el VPS
ssh -o StrictHostKeyChecking=no root@213.199.39.147 'bash -s' < /tmp/fix_vps.sh

# Limpiar archivo temporal
rm /tmp/fix_vps.sh

echo ""
echo -e "${GREEN}✅ SCRIPT DE LIMPIEZA EJECUTADO${NC}"
echo ""
echo -e "${YELLOW}🎯 AHORA PUEDES:${NC}"
echo "1. Hacer una nueva grabación en http://localhost:3000/radios"
echo "2. Verificar que aparece en http://localhost:3000/grabaciones"
echo ""
echo -e "${BLUE}📞 SI EL PROBLEMA PERSISTE:${NC}"
echo "Conectar manualmente al VPS:"
echo "  ssh root@213.199.39.147"
echo "  cd /home/radioapp/radio-recorder"
echo "  tail -f logs/radio-recorder.log"