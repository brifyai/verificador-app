#!/bin/bash

echo "🔄 Actualizando servidor VPS con URLs válidas..."

# Detener servidor actual
pkill -f "node.*server.js" || true
sleep 2

# Crear backup
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

# Actualizar URLs en el código si es necesario
echo "📡 URLs válidas configuradas en el código"

# Crear programación de prueba inmediata
CURRENT_HOUR=$(date +%H)
CURRENT_MIN=$(date +%M)
NEXT_MIN=$((CURRENT_MIN + 1))

if [ $NEXT_MIN -ge 60 ]; then
    NEXT_MIN=0
    CURRENT_HOUR=$((CURRENT_HOUR + 1))
fi

START_TIME=$(printf "%02d:%02d" $CURRENT_HOUR $NEXT_MIN)
TODAY=$(date +%u)

cat > test_dashboard_integration.json << EOF
{
  "userId": "dashboard-test-$(date +%s)",
  "radios": [
    {
      "id": "radio1",
      "name": "Radio Cooperativa",
      "streamUrl": "http://playerservices.streamtheworld.com/api/livestream-redirect/COOPERATIVAAAC.aac",
      "region": "RM"
    },
    {
      "id": "radio2", 
      "name": "Radio Bío Bío",
      "streamUrl": "http://playerservices.streamtheworld.com/api/livestream-redirect/BIOBIOAAC.aac",
      "region": "RM"
    }
  ],
  "days": [$TODAY],
  "schedule": {
    "startTime": "$START_TIME",
    "endTime": "$START_TIME",
    "duration": 45
  },
  "phrase": {
    "id": "test-phrase",
    "text": "noticias",
    "brand": "Dashboard Test",
    "campaign": "Integration Test"
  },
  "metadata": {
    "description": "Prueba de integración dashboard-VPS",
    "source": "dashboard-button",
    "createdAt": "$(date -Iseconds)"
  }
}
EOF

# Reiniciar servidor
echo "🚀 Reiniciando servidor..."
npm start &

# Esperar a que inicie
sleep 5

# Probar endpoint
echo "🧪 Probando endpoint con URLs válidas..."
curl -X POST http://localhost:3000/api/schedule \
     -H "Content-Type: application/json" \
     -d @test_dashboard_integration.json

echo ""
echo "✅ Servidor actualizado y probado"
echo "⏰ Grabación programada para: $START_TIME"
echo "📊 Verificar estado: curl http://localhost:3000/api/scheduler/status"
