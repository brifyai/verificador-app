#!/bin/bash

# Directorios de trabajo
OUTPUT_DIR="/root/radio_grabaciones"
VOICE_DIR="/root/radio_voces"
CONFIG_DIR="/root/radio_config"
LOG_DIR="/root/radio_logs"

# Crear directorios necesarios
mkdir -p "$OUTPUT_DIR" "$VOICE_DIR" "$CONFIG_DIR" "$LOG_DIR"

# Archivo de configuración JSON
CONFIG_FILE="$CONFIG_DIR/radio_schedules.json"

# Función para verificar si es un día permitido
check_allowed_day() {
    local allowed_days="$1"
    local current_day=$(date +%u) # 1-7 (Lunes-Domingo)
    
    if [[ $allowed_days == *"$current_day"* ]]; then
        return 0
    fi
    return 1
}

# Función para verificar si está dentro del horario de grabación
check_recording_hours() {
    local start_time=$1  # Formato: HH:MM
    local end_time=$2    # Formato: HH:MM
    
    # Convertir hora actual a minutos desde medianoche
    current_time=$(date +%H:%M)
    current_minutes=$((10#${current_time%:*} * 60 + 10#${current_time#*:}))
    
    # Convertir horarios de inicio y fin a minutos
    start_minutes=$((10#${start_time%:*} * 60 + 10#${start_time#*:}))
    end_minutes=$((10#${end_time%:*} * 60 + 10#${end_time#*:}))
    
    if [ $start_minutes -lt $end_minutes ]; then
        # Caso normal: ej. 10:00 a 13:00
        if [ $current_minutes -ge $start_minutes ] && [ $current_minutes -lt $end_minutes ]; then
            return 0
        fi
    else
        # Caso especial: ej. 22:00 a 01:00
        if [ $current_minutes -ge $start_minutes ] || [ $current_minutes -lt $end_minutes ]; then
            return 0
        fi
    fi
    return 1
}

# Función para grabar una radio
record_radio() {
    local radio_name="$1"
    local stream_url="$2"
    local start_time="$3"
    local end_time="$4"
    local allowed_days="$5"
    local duration="$6"

    # Verificar si es un día permitido
    if ! check_allowed_day "$allowed_days"; then
        echo "📅 No es un día de grabación para $radio_name"
        return
    }

    # Verificar horario de grabación
    if ! check_recording_hours "$start_time" "$end_time"; then
        echo "⏰ Fuera del horario de grabación para $radio_name ($start_time - $end_time)"
        return
    }

    TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
    BASENAME="${radio_name}_${TIMESTAMP}"
    OUTPUT_FILE="$OUTPUT_DIR/${BASENAME}.wav"
    LOG_FILE="$LOG_DIR/${radio_name}_${TIMESTAMP}.log"

    echo "🎧 Iniciando grabación de $radio_name: $OUTPUT_FILE"

    ffmpeg \
        -fflags +genpts \
        -reconnect 1 \
        -reconnect_streamed 1 \
        -reconnect_delay_max 10 \
        -timeout 10000000 \
        -rw_timeout 10000000 \
        -loglevel warning \
        -i "$stream_url" \
        -t "$duration" \
        -ar 16000 \
        -ac 1 \
        -f wav "$OUTPUT_FILE" \
        2>&1 | tee "$LOG_FILE"

    if [ $? -eq 0 ]; then
        echo "✅ Grabación completada: $OUTPUT_FILE"
        
        echo "🧪 Separando voces..."
        spleeter separate -p spleeter:2stems -o "$VOICE_DIR" "$OUTPUT_FILE"

        VOCAL_FILE="$VOICE_DIR/${BASENAME}/vocals.wav"
        if [ -f "$VOCAL_FILE" ]; then
            echo "✅ Voces extraídas: $VOCAL_FILE"
        else
            echo "❌ Error: no se generó el archivo de voces" >> "$LOG_FILE"
        fi
    else
        echo "❌ Error en la grabación de $radio_name" >> "$LOG_FILE"
    fi
}

# Función principal de monitoreo
main() {
    while true; do
        if [ -f "$CONFIG_FILE" ]; then
            # Leer y procesar el archivo JSON
            jq -c '.radios[]' "$CONFIG_FILE" | while read -r radio; do
                name=$(echo $radio | jq -r '.name')
                url=$(echo $radio | jq -r '.url')
                start_time=$(echo $radio | jq -r '.start_time')
                end_time=$(echo $radio | jq -r '.end_time')
                days=$(echo $radio | jq -r '.days')
                duration=$(echo $radio | jq -r '.duration')
                
                # Iniciar grabación en background para cada radio
                record_radio "$name" "$url" "$start_time" "$end_time" "$days" "$duration" &
            done
        else
            echo "⚠️ No hay configuración de radios disponible"
            sleep 60
            continue
        fi

        # Esperar antes de la siguiente verificación
        sleep 300 # 5 minutos entre verificaciones
    done
}

# Iniciar el script
echo "🎙️ Iniciando sistema de grabación multi-radio con horarios"
main

