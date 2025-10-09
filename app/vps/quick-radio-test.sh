#!/bin/bash

# Script rápido para probar URLs de radio en la VPS
echo "🎙️ PROBANDO STREAMS DE RADIO..."

# URLs de radio chilenas actualizadas
declare -A RADIOS
RADIOS[cooperativa]="http://playerservices.streamtheworld.com/api/livestream-redirect/COOPERATIVAAAC.aac"
RADIOS[biobio]="http://playerservices.streamtheworld.com/api/livestream-redirect/BIOBIOAAC.aac"
RADIOS[duna]="http://playerservices.streamtheworld.com/api/livestream-redirect/DUNAAAC.aac"
RADIOS[concierto]="http://playerservices.streamtheworld.com/api/livestream-redirect/CONCIERTOAAC.aac"

echo "📡 Probando URLs de radio..."

VALID_RADIOS=()

for radio in "${!RADIOS[@]}"; do
    url="${RADIOS[$radio]}"
    echo ""
    echo "🔍 Probando $radio: $url"
    
    # Probar con timeout de 10 segundos
    timeout 10s ffmpeg -i "$url" -t 3 -f null - 2>&1 | grep -q "Stream #0" 
    
    if [ $? -eq 0 ]; then
        echo "✅ $radio - URL válida"
        VALID_RADIOS+=("$radio:$url")
    else
        echo "❌ $radio - URL no válida"
    fi
done

echo ""
echo "📊 RESULTADOS:"
echo "=============="

if [ ${#VALID_RADIOS[@]} -gt 0 ]; then
    echo "✅ Radios válidas encontradas: ${#VALID_RADIOS[@]}"
    
    # Crear programación de prueba con radios válidas
    CURRENT_HOUR=$(date +%H)
    CURRENT_MIN=$(date +%M)
    NEXT_MIN=$((CURRENT_MIN + 1))
    END_MIN=$((CURRENT_MIN + 2))
    
    # Ajustar si pasa de 60 minutos
    if [ $NEXT_MIN -ge 60 ]; then
        NEXT_MIN=$((NEXT_MIN - 60))
        CURRENT_HOUR=$((CURRENT_HOUR + 1))
    fi
    if [ $END_MIN -ge 60 ]; then
        END_MIN=$((END_MIN - 60))
    fi
    
    START_TIME=$(printf "%02d:%02d" $CURRENT_HOUR $NEXT_MIN)
    END_TIME=$(printf "%02d:%02d" $CURRENT_HOUR $END_MIN)
    TODAY=$(date +%u) # Día de la semana (1=lunes, 7=domingo)
    
    echo ""
    echo "🧪 Creando programación de prueba..."
    echo "⏰ Horario: $START_TIME - $END_TIME"
    echo "📅 Día: $TODAY"
    
    # Tomar las primeras 2 radios válidas
    RADIO1=$(echo "${VALID_RADIOS[0]}" | cut -d: -f1)
    URL1=$(echo "${VALID_RADIOS[0]}" | cut -d: -f2-)
    
    if [ ${#VALID_RADIOS[@]} -gt 1 ]; then
        RADIO2=$(echo "${VALID_RADIOS[1]}" | cut -d: -f1)
        URL2=$(echo "${VALID_RADIOS[1]}" | cut -d: -f2-)
    else
        RADIO2=$RADIO1
        URL2=$URL1
    fi
    
    # Crear archivo JSON de prueba
    cat > /tmp/test_schedule.json << EOF
{
  "userId": "quick-test-$(date +%s)",
  "radios": [
    {
      "id": "$RADIO1",
      "name": "Radio $(echo $RADIO1 | tr '[:lower:]' '[:upper:]')",
      "streamUrl": "$URL1",
      "region": "Chile"
    },
    {
      "id": "$RADIO2", 
      "name": "Radio $(echo $RADIO2 | tr '[:lower:]' '[:upper:]')",
      "streamUrl": "$URL2",
      "region": "Chile"
    }
  ],
  "days": [$TODAY],
  "schedule": {
    "startTime": "$START_TIME",
    "endTime": "$END_TIME", 
    "duration": 60
  },
  "phrase": {
    "id": "test-phrase",
    "text": "noticias",
    "brand": "Test Quick",
    "campaign": "Validation Test"
  },
  "metadata": {
    "description": "Prueba rápida con URLs válidas",
    "createdAt": "$(date -Iseconds)"
  }
}
EOF
    
    echo "📄 Programación creada en /tmp/test_schedule.json"
    
    # Enviar a la API local
    echo ""
    echo "📤 Enviando programación al scheduler..."
    
    curl -X POST http://localhost:3000/api/schedule \
         -H "Content-Type: application/json" \
         -d @/tmp/test_schedule.json
    
    echo ""
    echo ""
    echo "✅ Programación enviada!"
    echo "🕐 La grabación debería iniciar en 1 minuto: $START_TIME"
    echo "📁 Archivos se guardarán en: /root/radio-api/recordings/"
    echo ""
    echo "💡 Para monitorear:"
    echo "   tail -f /root/radio-api/recordings/*.mp3"
    echo "   curl http://localhost:3000/api/recordings/active"
    
else
    echo "❌ No se encontraron radios válidas"
    echo "💡 Verifica tu conexión a internet"
fi
