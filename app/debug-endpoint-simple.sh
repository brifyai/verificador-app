#!/bin/bash

echo "🔍 VERIFICANDO DATOS DEL ENDPOINT /api/recordings-from-supabase"
echo "==============================================================="

# Verificar si el servidor está ejecutándose
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/recordings-from-supabase | grep -q "200"; then
    echo "❌ El servidor no está respondiendo en http://localhost:3000"
    echo "💡 Asegúrate de que 'npm run dev' esté ejecutándose"
    exit 1
fi

echo "✅ Servidor está ejecutándose"

# Obtener datos del endpoint
RESPONSE=$(curl -s -H "Content-Type: application/json" \
  -H "Cookie: auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkBvbmRhdmVyaWZpY2FkYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMwOTc5NDUsImV4cCI6MTczNTY4OTk0NX0.5mCP92eSJXuKvQZ7Y8XBKhY8l6JqZ8l6JqZ8l6JqZ8l6Jq" \
  http://localhost:3000/api/recordings-from-supabase)

echo "📊 Respuesta cruda del endpoint:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "📋 ANÁLISIS DE DATOS:"
echo "=================="

# Analizar con jq si está disponible
if command -v jq &> /dev/null; then
    echo "✅ jq está disponible, analizando datos..."
    
    # Verificar estructura básica
    STATUS=$(echo "$RESPONSE" | jq -r '.status // "desconocido"')
    COUNT=$(echo "$RESPONSE" | jq -r '.count // "0"')
    SOURCE=$(echo "$RESPONSE" | jq -r '.source // "desconocido"')
    
    echo "📊 Estado: $STATUS"
    echo "📊 Total grabaciones: $COUNT"
    echo "📊 Fuente: $SOURCE"
    
    if [ "$STATUS" = "success" ] && [ "$COUNT" -gt 0 ]; then
        echo ""
        echo "📋 PRIMERAS 3 GRABACIONES:"
        
        for i in {0..2}; do
            RECORDING=$(echo "$RESPONSE" | jq -r ".recordings[$i] // empty")
            if [ -n "$RECORDING" ]; then
                FILENAME=$(echo "$RECORDING" | jq -r '.filename // "sin nombre"')
                RADIO_NAME=$(echo "$RECORDING" | jq -r '.radio_name // "sin nombre"')
                RADIO_REGION=$(echo "$RECORDING" | jq -r '.radio_region // "sin región"')
                RADIO_CITY=$(echo "$RECORDING" | jq -r '.radio_city // "sin ciudad"')
                RADIO_PROGRAMADORA=$(echo "$RECORDING" | jq -r '.radio_programadora // "sin programadora"')
                
                echo ""
                echo "$((i+1)). Grabación: $FILENAME"
                echo "   Radio: $RADIO_NAME"
                echo "   Región: $RADIO_REGION"
                echo "   Ciudad: $RADIO_CITY"
                echo "   Programadora: $RADIO_PROGRAMADORA"
                
                # Verificar si los datos están vacíos o undefined
                if [ "$RADIO_REGION" = "sin región" ] || [ "$RADIO_REGION" = "undefined" ] || [ "$RADIO_REGION" = "" ]; then
                    echo "   ❌ Región NO disponible"
                else
                    echo "   ✅ Región disponible"
                fi
                
                if [ "$RADIO_CITY" = "sin ciudad" ] || [ "$RADIO_CITY" = "undefined" ] || [ "$RADIO_CITY" = "" ]; then
                    echo "   ❌ Ciudad NO disponible"
                else
                    echo "   ✅ Ciudad disponible"
                fi
                
                if [ "$RADIO_PROGRAMADORA" = "sin programadora" ] || [ "$RADIO_PROGRAMADORA" = "undefined" ] || [ "$RADIO_PROGRAMADORA" = "" ]; then
                    echo "   ❌ Programadora NO disponible"
                else
                    echo "   ✅ Programadora disponible"
                fi
            fi
        done
        
        # Resumen estadístico
        echo ""
        echo "📊 RESUMEN ESTADÍSTICO:"
        TOTAL_WITH_REGION=$(echo "$RESPONSE" | jq '[.recordings[] | select(.radio_region != null and .radio_region != "undefined" and .radio_region != "")] | length')
        TOTAL_WITH_CITY=$(echo "$RESPONSE" | jq '[.recordings[] | select(.radio_city != null and .radio_city != "undefined" and .radio_city != "")] | length')
        TOTAL_WITH_PROGRAMADORA=$(echo "$RESPONSE" | jq '[.recordings[] | select(.radio_programadora != null and .radio_programadora != "undefined" and .radio_programadora != "")] | length')
        
        echo "   📻 Grabaciones con región: $TOTAL_WITH_REGION/$COUNT"
        echo "   🏙️  Grabaciones con ciudad: $TOTAL_WITH_CITY/$COUNT"
        echo "   🏢 Grabaciones con programadora: $TOTAL_WITH_PROGRAMADORA/$COUNT"
        
    else
        echo "❌ No hay grabaciones disponibles o el endpoint devolvió error"
    fi
    
else
    echo "⚠️ jq no está disponible, mostrando respuesta cruda:"
    echo "$RESPONSE"
fi

echo ""
echo "✅ VERIFICACIÓN COMPLETA"
echo ""
echo "💡 CONCLUSIÓN:"
echo "   - Si ves '❌ NO disponible' en región/ciudad/programadora, esos datos"
echo "     no están siendo almacenados correctamente en Supabase."
echo "   - Si ves '✅ disponible', el endpoint SÍ está funcionando correctamente."
echo "   - El problema podría estar en la visualización del frontend."