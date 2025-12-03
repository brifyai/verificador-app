#!/bin/bash

# Script para sincronizar las grabaciones reales del VPS a Supabase
echo "🔄 SINCRONIZANDO GRABACIONES REALES DEL VPS A SUPABASE"
echo "======================================================"

# Paso 1: Obtener grabaciones reales del VPS
echo "📡 Obteniendo grabaciones reales del VPS..."
VPS_RESPONSE=$(curl -s -X GET "http://213.199.39.147:5000/api/recordings" \
  -H "Content-Type: application/json" \
  -H "Cache-Control: no-cache")

# Verificar si hay grabaciones
RECORDINGS_COUNT=$(echo "$VPS_RESPONSE" | jq '.recordings | length' 2>/dev/null)

if [ -z "$RECORDINGS_COUNT" ] || [ "$RECORDINGS_COUNT" -eq 0 ]; then
  echo "⚠️ No hay grabaciones en el VPS para sincronizar"
  exit 0
fi

echo "✅ Grabaciones obtenidas del VPS: $RECORDINGS_COUNT"

# Paso 2: Procesar cada grabación real
echo ""
echo "📋 Procesando grabaciones reales..."

for i in $(seq 0 $(($RECORDINGS_COUNT - 1))); do
  RECORDING=$(echo "$VPS_RESPONSE" | jq ".recordings[$i]")
  
  RADIO_ID=$(echo "$RECORDING" | jq -r '.radio_id // "unknown"')
  RADIO_NAME=$(echo "$RECORDING" | jq -r '.radio_name // "Radio y algo más"')
  RADIO_REGION=$(echo "$RECORDING" | jq -r '.radio_region // "Región no especificada"')
  RADIO_CITY=$(echo "$RECORDING" | jq -r '.radio_city // "Ciudad no especificada"')
  RADIO_PROGRAMADORA=$(echo "$RECORDING" | jq -r '.radio_programadora // ""')
  FILENAME=$(echo "$RECORDING" | jq -r '.filename')
  FILE_PATH=$(echo "$RECORDING" | jq -r '.path // .file_path // .filename')
  FILE_SIZE=$(echo "$RECORDING" | jq -r '.size // .file_size // 0')
  DURATION=$(echo "$RECORDING" | jq -r '.duration_seconds // 0')
  RECORDED_AT=$(echo "$RECORDING" | jq -r '.created_at // empty')
  
  if [ -z "$RECORDED_AT" ]; then
    RECORDED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
  fi
  
  echo ""
  echo "$((i + 1)). Procesando: $FILENAME"
  echo "   💾 Guardando en Supabase..."
  
  # Preparar datos para Supabase
  METADATA=$(echo "$RECORDING" | jq -c '{
    source: "vps_sync",
    original_path: .path,
    vps_sync_date: (now | todate),
    metadata: .metadata
  }' 2>/dev/null || echo '{"source": "vps_sync", "vps_sync_date": "'"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"'"}')
  
  # Guardar en Supabase usando el endpoint
  SAVE_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/recordings-save" \
    -H "Content-Type: application/json" \
    -H "Cookie: auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkBvbmRhdmVyaWZpY2FkYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMwOTc5NDUsImV4cCI6MTczNTY4OTk0NX0.5mCP92eSJXuKvQZ7Y8XBKhY8l6JqZ8l6JqZ8l6JqZ8l6Jq" \
    -d "{
      \"radio_id\": \"$RADIO_ID\",
      \"radio_name\": \"$RADIO_NAME\",
      \"radio_region\": \"$RADIO_REGION\",
      \"radio_city\": \"$RADIO_CITY\",
      \"radio_programadora\": \"$RADIO_PROGRAMADORA\",
      \"filename\": \"$FILENAME\",
      \"file_path\": \"$FILE_PATH\",
      \"file_size\": $FILE_SIZE,
      \"duration_seconds\": $DURATION,
      \"recorded_at\": \"$RECORDED_AT\",
      \"metadata\": $METADATA
    }")
  
  if echo "$SAVE_RESPONSE" | grep -q '"success"'; then
    echo "   ✅ Grabación guardada exitosamente"
  else
    ERROR_MSG=$(echo "$SAVE_RESPONSE" | jq -r '.message // "Error desconocido"' 2>/dev/null || echo "Error desconocido")
    echo "   ❌ Error guardando: $ERROR_MSG"
  fi
done

echo ""
echo "✅ SINCRONIZACIÓN COMPLETA"
echo "📊 Total de grabaciones procesadas: $RECORDINGS_COUNT"