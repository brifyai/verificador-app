#!/bin/bash

# Script para actualizar el archivo record_radio.sh en el VPS
# Agrega el flag -k a ffmpeg para ignorar certificados SSL inválidos

VPS_USER="radioapp"
VPS_HOST="213.199.39.147"
REMOTE_SCRIPT="/home/radioapp/radio-recorder/scripts/record_radio.sh"
BACKUP_SCRIPT="/home/radioapp/radio-recorder/scripts/record_radio.sh.backup"

echo "🔧 Conectando al VPS para actualizar ffmpeg..."
echo "📍 Archivo: $REMOTE_SCRIPT"

# Comandos a ejecutar en el VPS
ssh $VPS_USER@$VPS_HOST << 'EOF'
  echo "💾 Creando backup del script original..."
  cp /home/radioapp/radio-recorder/scripts/record_radio.sh /home/radioapp/radio-recorder/scripts/record_radio.sh.backup
  
  echo "⚙️  Actualizando comando ffmpeg para ignorar certificados SSL..."
  # Reemplazar la línea de ffmpeg para agregar el flag -k
  sed -i 's/timeout \$BLOCK_DURATION ffmpeg -i/timeout $BLOCK_DURATION ffmpeg -k -i/' /home/radioapp/radio-recorder/scripts/record_radio.sh
  
  echo "✅ Verificando cambios:"
  grep -n "ffmpeg -k" /home/radioapp/radio-recorder/scripts/record_radio.sh
  
  echo "🔄 Reiniciando servicio de grabación..."
  pm2 restart radio-recorder 2>/dev/null || echo "⚠️  No se pudo reiniciar con pm2"
  
  echo "✅ Actualización completada exitosamente!"
  echo "💡 Para revertir: cp /home/radioapp/radio-recorder/scripts/record_radio.sh.backup /home/radioapp/radio-recorder/scripts/record_radio.sh"
EOF

echo "🎉 Script actualizado exitosamente en el VPS"
echo "📋 Prueba una grabación para verificar que funciona"