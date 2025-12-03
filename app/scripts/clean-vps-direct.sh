#!/bin/bash

# Script para limpiar grabaciones directamente en el VPS
# Se conecta por SSH y elimina los archivos de grabación

echo "🧹 LIMPIANDO GRABACIONES EN VPS DIRECTAMENTE"
echo "=============================================="
echo ""

# Información del VPS
VPS_HOST="213.199.39.147"
VPS_USER="root"
RECORDINGS_PATH="/root/radio_streams/recordings"

echo "📡 Conectando al VPS: $VPS_HOST"
echo "📁 Ruta de grabaciones: $RECORDINGS_PATH"
echo ""

# Comando para limpiar grabaciones
echo "🗑️ Eliminando todas las grabaciones..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
  echo "📋 Verificando grabaciones existentes..."
  cd /root/radio_streams/recordings
  echo "📊 Archivos encontrados:"
  ls -la *.mp3 2>/dev/null || echo "No hay archivos .mp3"
  
  echo ""
  echo "🧹 Eliminando archivos de grabación..."
  rm -f *.mp3
  
  echo ""
  echo "✅ Verificación final:"
  ls -la *.mp3 2>/dev/null || echo "✅ No quedan archivos .mp3"
  
  echo ""
  echo "📁 Contenido del directorio:"
  ls -la
EOF

echo ""
echo "🎉 ¡LIMPIEZA COMPLETADA!"
echo "========================"
echo "✅ Todas las grabaciones han sido eliminadas del VPS"
echo ""
echo "🔍 Verificando desde API local..."
sleep 2

# Verificar que quede limpio
curl -s "http://$VPS_HOST:5000/api/recordings" | jq '.recordings | length' 2>/dev/null || echo "Error verificando API"

echo ""
echo "✅ PROCESO FINALIZADO"