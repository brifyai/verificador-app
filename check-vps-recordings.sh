#!/bin/bash

# Script para verificar grabaciones en VPS
# Uso: ./check-vps-recordings.sh

echo "🔍 DIAGNÓSTICO DE GRABACIONES EN VPS"
echo "====================================="
echo ""

# Configuración
VPS_HOST="213.199.39.147"
VPS_USER="radioapp"
RECORDING_DIR="/home/radioapp/radio-recorder/recordings"

echo "📁 Verificando directorio de grabaciones..."
echo "Directorio: $RECORDING_DIR"
echo ""

# Verificar conexión SSH
echo "🔌 Probando conexión SSH..."
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "echo '✅ Conexión SSH exitosa'" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Error: No se puede conectar al VPS vía SSH"
    echo "   Verifica: Usuario, contraseña, IP y firewall"
    exit 1
fi
echo ""

# Verificar si el directorio existe
echo "📂 Verificando existencia del directorio..."
ssh $VPS_USER@$VPS_HOST "ls -ld $RECORDING_DIR" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Error: Directorio de grabaciones no existe"
    echo "   Ruta: $RECORDING_DIR"
else
    echo "✅ Directorio existe"
fi
echo ""

# Verificar permisos del directorio
echo "🔐 Verificando permisos del directorio..."
ssh $VPS_USER@$VPS_HOST "ls -ld $RECORDING_DIR"
echo ""

# Contar archivos MP3
echo "🎵 Contando archivos MP3..."
MP3_COUNT=$(ssh $VPS_USER@$VPS_HOST "find $RECORDING_DIR -name '*.mp3' -type f 2>/dev/null | wc -l")
echo "Número de archivos MP3: $MP3_COUNT"
echo ""

# Listar archivos MP3 recientes (últimos 7 días)
echo "📅 Archivos MP3 de los últimos 7 días:"
ssh $VPS_USER@$VPS_HOST "find $RECORDING_DIR -name '*.mp3' -type f -mtime -7 -exec ls -lh {} \; 2>/dev/null | head -20"
echo ""

# Verificar espacio en disco
echo "💾 Verificando espacio en disco..."
ssh $VPS_USER@$VPS_HOST "df -h $RECORDING_DIR"
echo ""

# Verificar procesos FFmpeg activos
echo "🎬 Verificando procesos FFmpeg activos..."
FFMPEG_PROCESSES=$(ssh $VPS_USER@$VPS_HOST "ps aux | grep -v grep | grep ffmpeg" 2>/dev/null)
if [ -z "$FFMPEG_PROCESSES" ]; then
    echo "⚠️  No hay procesos FFmpeg activos"
else
    echo "Procesos FFmpeg encontrados:"
    echo "$FFMPEG_PROCESSES"
fi
echo ""

# Verificar últimas líneas del log de grabación
echo "📝 Verificando logs de grabación..."
LOG_FILE="/home/radioapp/radio-recorder/logs/recording.log"
ssh $VPS_USER@$VPS_HOST "tail -20 $LOG_FILE" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  No se pudo leer el log o no existe"
fi
echo ""

# Verificar servicio de grabación
echo "⚙️  Verificando servicio de grabación..."
ssh $VPS_USER@$VPS_HOST "systemctl status radio-recorder --no-pager" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Servicio radio-recorder no encontrado o no está activo"
fi
echo ""

# Verificar puerto 5000
echo "🌐 Verificando puerto 5000 (API de grabación)..."
PORT_CHECK=$(ssh $VPS_USER@$VPS_HOST "netstat -tln | grep :5000" 2>/dev/null)
if [ -z "$PORT_CHECK" ]; then
    echo "⚠️  Puerto 5000 no está escuchando"
else
    echo "✅ Puerto 5000 está activo:"
    echo "$PORT_CHECK"
fi
echo ""

# Verificar archivos temporales
echo "🕐 Verificando archivos temporales..."
ssh $VPS_USER@$VPS_HOST "find $RECORDING_DIR -name '*.tmp' -o -name '*.part' 2>/dev/null"
echo ""

echo "✅ Diagnóstico completado"
echo ""
echo "Resumen:"
echo "- Directorio: $RECORDING_DIR"
echo "- Archivos MP3: $MP3_COUNT"
echo "- Verifica los permisos y espacio en disco si los archivos no se guardan"