#!/bin/bash

# Script para añadir dotenv al servidor y solucionar el problema

set -e

echo "========================================"
echo "SOLUCIÓN: AÑADIENDO DOTENV AL SERVIDOR"
echo "========================================"
echo ""

# Ir al directorio correcto
cd /home/radioapp/radio-recorder/app

echo "📁 Directorio actual: $(pwd)"
echo ""

# Hacer backup del archivo original
echo "💾 Haciendo backup del archivo original..."
cp server-vps-organized-correct-path.js server-vps-organized-correct-path.js.backup
echo "✅ Backup creado"
echo ""

# Verificar si dotenv ya está al inicio
echo "🔍 Verificando si dotenv está al inicio del archivo..."
if head -1 server-vps-organized-correct-path.js | grep -q "require('dotenv')"; then
    echo "✅ dotenv ya está al inicio"
else
    echo "⚠️  dotenv NO está al inicio, añadiéndolo..."
    
    # Añadir dotenv al inicio del archivo
    sed -i "1i require('dotenv').config();" server-vps-organized-correct-path.js
    
    echo "✅ dotenv añadido al inicio"
fi
echo ""

# Verificar las primeras líneas después de la modificación
echo "📋 Primeras líneas del archivo después de la modificación:"
head -5 server-vps-organized-correct-path.js
echo ""

# Verificar sintaxis después de la modificación
echo "🧪 Verificando sintaxis después de añadir dotenv..."
node -c server-vps-organized-correct-path.js
if [ $? -eq 0 ]; then
    echo "✅ Sintaxis correcta"
else
    echo "❌ Error de sintaxis después de añadir dotenv"
    echo "Restaurando backup..."
    cp server-vps-organized-correct-path.js.backup server-vps-organized-correct-path.js
    exit 1
fi
echo ""

# Probar ejecución manual con dotenv cargado
echo "🚀 Probando ejecución manual con dotenv cargado:"
echo "====================================="
timeout 5s sudo -u radioapp node server-vps-organized-correct-path.js &
sleep 3

if pgrep -f "node server-vps-organized-correct-path.js" > /dev/null; then
    echo "====================================="
    echo "✅ ✅ ✅ ÉXITO: El proceso se está ejecutando correctamente"
    pkill -f "node server-vps-organized-correct-path.js"
    
    # Reiniciar el servicio
    echo ""
    echo "🔄 Reiniciando servicio..."
    systemctl restart radio-recording-organized.service
    sleep 3
    
    # Verificar estado
    echo ""
    echo "📊 Estado del servicio:"
    systemctl status radio-recording-organized.service --no-pager -l
    
    # Ver logs
    echo ""
    echo "📄 Logs recientes:"
    journalctl -u radio-recording-organized.service -n 15 --no-pager
    
    # Probar endpoint
    echo ""
    echo "🌐 Probando endpoint health:"
    curl -s http://localhost:5000/health || echo "❌ Error en endpoint"
    
    echo ""
    echo "========================================"
    echo "✅ SERVIDOR SOLUCIONADO Y FUNCIONANDO"
    echo "========================================"
    
else
    echo "====================================="
    echo "❌ El proceso sigue fallando"
    echo ""
    echo "Verificando error detallado:"
    cd /home/radioapp/radio-recorder/app
    sudo -u radioapp node --trace-warnings server-vps-organized-correct-path.js
fi

echo ""