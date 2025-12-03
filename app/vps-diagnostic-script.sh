#!/bin/bash

# ============================================
# SCRIPT DE DIAGNÓSTICO VPS - GRABACIONES
# ============================================
# Contraseña VPS: Aintelligence2025
# IP VPS: 213.199.39.147

echo "🔍 DIAGNÓSTICO VPS - GRABACIONES"
echo "=================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📡 Conectando al VPS...${NC}"
echo ""

# Crear script temporal para ejecutar en el VPS
cat > /tmp/vps_commands.sh << 'EOF'
#!/bin/bash

echo "🔍 DIAGNÓSTICO VPS - GRABACIONES"
echo "=================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📁 Verificando directorio de grabaciones...${NC}"
cd /home/radioapp/radio-recorder
echo "Directorio actual: $(pwd)"
echo ""

echo -e "${BLUE}📊 Listando archivos en recordings/...${NC}"
ls -la recordings/
echo ""

echo -e "${BLUE}🕐 Verificando archivos recientes (últimas 24h)...${NC}"
find recordings/ -name "*.mp3" -type f -mtime -1 -exec ls -la {} \;
echo ""

echo -e "${BLUE}📋 Verificando archivos de hoy...${NC}"
find recordings/ -name "*.mp3" -type f -newermt "2025-12-03" -exec ls -la {} \;
echo ""

echo -e "${BLUE}🔢 Contando archivos totales...${NC}"
echo "Total archivos .mp3: $(find recordings/ -name "*.mp3" -type f | wc -l)"
echo "Archivos de hoy: $(find recordings/ -name "*.mp3" -type f -newermt "2025-12-03" | wc -l)"
echo ""

echo -e "${BLUE}📝 Verificando logs recientes...${NC}"
if [ -f logs/radio-recorder.log ]; then
    echo "Últimas 10 líneas del log:"
    tail -10 logs/radio-recorder.log
else
    echo -e "${YELLOW}⚠️ Log no encontrado en logs/radio-recorder.log${NC}"
fi
echo ""

echo -e "${BLUE}🔄 Verificando estado del servicio...${NC}"
ps aux | grep -i radio | grep -v grep
echo ""

echo -e "${BLUE}🌐 Verificando API del VPS...${NC}"
echo "Probando endpoint /api/recordings:"
curl -s http://localhost:5000/api/recordings | jq '.' 2>/dev/null || curl -s http://localhost:5000/api/recordings
echo ""

echo "✅ Diagnóstico completado"
EOF

# Hacer ejecutable el script temporal
chmod +x /tmp/vps_commands.sh

# Ejecutar comandos en el VPS
ssh -o StrictHostKeyChecking=no root@213.199.39.147 'bash -s' < /tmp/vps_commands.sh

# Limpiar archivo temporal
rm /tmp/vps_commands.sh

echo ""
echo -e "${GREEN}✅ Diagnóstico VPS completado${NC}"
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASOS:${NC}"
echo "1. Si hay archivos nuevos, verificar por qué se excluyen"
echo "2. Si no hay archivos, verificar el proceso de grabación"
echo "3. Revisar logs para errores"
echo ""
echo -e "${BLUE}🔧 COMANDOS MANUALES:${NC}"
echo "ssh root@213.199.39.147"
echo "cd /home/radioapp/radio-recorder"
echo "tail -f logs/radio-recorder.log"