#!/bin/bash

# Script de diagnóstico para el servicio de grabación en VPS
# Este script identifica por qué el servicio no se mantiene en ejecución

set -e

echo "========================================"
echo "DIAGNÓSTICO DEL SERVICIO DE GRABACIÓN"
echo "========================================"
echo ""

# Paso 1: Verificar estado del servicio
echo "📊 Estado del servicio:"
systemctl status radio-recording-organized.service --no-pager -l
echo ""

# Paso 2: Ver logs recientes
echo "📋 Logs recientes (últimas 20 líneas):"
journalctl -u radio-recording-organized.service -n 20 --no-pager
echo ""

# Paso 3: Verificar si el archivo existe
echo "📁 Verificando archivos:"
if [ -f "/home/radioapp/radio-recorder/app/server-vps-organized-correct-path.js" ]; then
    echo "✅ Archivo del servidor existe"
else
    echo "❌ Archivo del servidor NO existe"
fi

if [ -f "/home/radioapp/radio-recorder/app/.env" ]; then
    echo "✅ Archivo .env existe"
    echo "   Contenido (sin mostrar ANON KEY):"
    grep -v "ANON_KEY" /home/radioapp/radio-recorder/app/.env
else
    echo "❌ Archivo .env NO existe"
fi

if [ -f "/home/radioapp/radio-recorder/app/package.json" ]; then
    echo "✅ package.json existe"
else
    echo "❌ package.json NO existe"
fi
echo ""

# Paso 4: Verificar permisos
echo "🔐 Permisos de archivos:"
ls -la /home/radioapp/radio-recorder/app/
echo ""

# Paso 5: Verificar Node.js
echo "🟢 Verificando Node.js:"
which node
node --version
echo ""

# Paso 6: Verificar FFmpeg
echo "🎬 Verificando FFmpeg:"
which ffmpeg
ffmpeg -version | head -3
echo ""

# Paso 7: Verificar puerto 5000
echo "🔌 Verificando puerto 5000:"
if netstat -tlnp | grep -q ":5000"; then
    echo "⚠️  Puerto 5000 está en uso:"
    netstat -tlnp | grep ":5000"
else
    echo "✅ Puerto 5000 está libre"
fi
echo ""

# Paso 8: Probar ejecución manual
echo "🧪 Probando ejecución manual (10 segundos):"
cd /home/radioapp/radio-recorder/app
timeout 10s node server-vps-organized-correct-path.js &
sleep 2
if pgrep -f "node server-vps-organized-correct-path.js" > /dev/null; then
    echo "✅ El proceso se está ejecutando"
    pkill -f "node server-vps-organized-correct-path.js"
else
    echo "❌ El proceso terminó inmediatamente"
    echo "   Ejecutando manualmente para ver el error:"
    echo ""
    node server-vps-organized-correct-path.js
fi
echo ""

# Paso 9: Verificar dependencias
echo "📦 Verificando dependencias:"
cd /home/radioapp/radio-recorder/app
npm list --depth=0
echo ""

# Paso 10: Verificar estructura de directorios
echo "📂 Verificando directorios:"
ls -la /home/radioapp/radio-recorder/
echo ""
ls -la /home/radioapp/radio-recorder/recordings/
echo ""

# Paso 11: Verificar archivo de servicio
echo "🔧 Verificando archivo de servicio systemd:"
cat /etc/systemd/system/radio-recording-organized.service
echo ""

# Paso 12: Intentar reiniciar con más logging
echo "🔄 Intentando reiniciar con logging extendido:"
systemctl stop radio-recording-organized.service
sleep 2
systemctl start radio-recording-organized.service
sleep 3
systemctl status radio-recording-organized.service --no-pager -l
echo ""

# Paso 13: Ver logs inmediatamente después del reinicio
echo "📄 Logs después del reinicio:"
journalctl -u radio-recording-organized.service -n 30 --no-pager
echo ""

echo "========================================"
echo "DIAGNÓSTICO COMPLETADO"
echo "========================================"
echo ""
echo "Si el problema persiste, revisa:"
echo "1. Errores en la ejecución manual (Paso 8)"
echo "2. Logs completos: journalctl -u radio-recording-organized.service -f"
echo "3. Permisos de archivos y directorios"
echo ""