#!/bin/bash

# VPS Service Restart Script
# Reinicia el servicio radio-recorder después de la limpieza

echo "🔄 REINICIANDO SERVICIO RADIO-RECORDER"
echo "========================================"

# Reiniciar el servicio
systemctl restart radio-recorder.service

# Esperar 2 segundos
sleep 2

# Verificar estado
echo ""
echo "📊 ESTADO DEL SERVICIO:"
systemctl status radio-recorder.service --no-pager

echo ""
echo "✅ VERIFICACIÓN DE PUERTO:"
netstat -tlnp | grep :5000 || echo "⚠️ Puerto 5000 no está escuchando"

echo ""
echo "🔍 ULTIMOS LOGS (si hay errores):"
journalctl -u radio-recorder.service -n 20 --no-pager

echo ""
echo "========================================"
echo "✅ Proceso de reinicio completado"
echo "Si el servicio no está 'active (running)', revisa los logs arriba"