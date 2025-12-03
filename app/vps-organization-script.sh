#!/bin/bash

# ============================================
# SCRIPT DE ORGANIZACIÓN AUTOMÁTICA DE GRABACIONES
# Generado el: 2025-12-01T20:11:53.317Z
# ============================================

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="$BASE_PATH/recordings"

echo "==========================================="
echo "INICIANDO ORGANIZACIÓN DE GRABACIONES"
echo "==========================================="
echo "Fecha: $(date)"
echo ""

# 1. Crear estructura de directorios
echo "1. Creando estructura de directorios..."
mkdir -p "$RECORDINGS_PATH/active"
mkdir -p "$RECORDINGS_PATH/completed"
mkdir -p "$RECORDINGS_PATH/failed"
mkdir -p "$BASE_PATH/logs"
mkdir -p "$BASE_PATH/temp"
mkdir -p "$BASE_PATH/backup"
echo "✓ Directorios creados"
echo ""

# 2. Función para mover grabaciones
move_recording() {
  local source_file="$1"
  local target_dir="$2"
  local filename=$(basename "$source_file")
  
  if [ -f "$source_file" ]; then
    mv "$source_file" "$target_dir/$filename"
    echo "  Movido: $filename → $target_dir/"
  else
    echo "  ⚠ Archivo no encontrado: $source_file"
  fi
}

# 3. Organizar grabaciones por estado
echo "2. Organizando grabaciones por estado..."
echo "   Total de grabaciones: 2"
echo ""

# Grabaciones activas (en curso)
echo "   → Procesando grabaciones activas: 0"
for recording in ; do
  move_recording "$RECORDINGS_PATH/$recording" "$RECORDINGS_PATH/active"
done
echo ""

# Grabaciones completadas
echo "   → Procesando grabaciones completadas: 2"
for recording in radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3 radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3; do
  move_recording "$RECORDINGS_PATH/$recording" "$RECORDINGS_PATH/completed"
done
echo ""

# Grabaciones fallidas
echo "   → Procesando grabaciones fallidas: 0"
for recording in ; do
  move_recording "$RECORDINGS_PATH/$recording" "$RECORDINGS_PATH/failed"
done
echo ""

# 4. Limpiar directorios vacíos
echo "3. Limpiando directorios vacíos..."
find "$RECORDINGS_PATH" -type d -empty -delete 2>/dev/null
echo "✓ Directorios vacíos eliminados"
echo ""

# 5. Establecer permisos correctos
echo "4. Estableciendo permisos..."
chown -R radioapp:radioapp "$BASE_PATH"
chmod -R 755 "$BASE_PATH"
echo "✓ Permisos establecidos"
echo ""

# 6. Crear script de mantenimiento automático
echo "5. Creando script de mantenimiento..."
cat > "$BASE_PATH/scripts/maintenance.sh" << 'EOF'
#!/bin/bash
# Mantenimiento diario de grabaciones

BASE_PATH="/home/radioapp/radio-recorder"
LOG_FILE="$BASE_PATH/logs/maintenance.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== Inicio de mantenimiento ==="

# Mover grabaciones antiguas (>30 días) a backup
find "$BASE_PATH/recordings/completed" -name "*.mp3" -mtime +30 -exec mv {} "$BASE_PATH/backup/" \; 2>/dev/null
log "Grabaciones antiguas movidas a backup"

# Limpiar temporales (>7 días)
find "$BASE_PATH/temp" -type f -mtime +7 -delete 2>/dev/null
log "Temporales limpiados"

# Comprimir logs antiguos
find "$BASE_PATH/logs" -name "*.log" -mtime +7 -exec gzip {} \; 2>/dev/null
log "Logs comprimidos"

log "=== Fin de mantenimiento ==="
EOF

chmod +x "$BASE_PATH/scripts/maintenance.sh"
echo "✓ Script de mantenimiento creado"
echo ""

# 7. Configurar tarea cron (opcional)
echo "6. Para configurar mantenimiento automático, ejecuta:"
echo "   crontab -e"
echo "   Y agrega: 0 2 * * * $BASE_PATH/scripts/maintenance.sh"
echo ""

echo "==========================================="
echo "ORGANIZACIÓN COMPLETADA"
echo "==========================================="
echo "Resumen:"
echo "  - Grabaciones activas: 0"
echo "  - Grabaciones completadas: 2"
echo "  - Grabaciones fallidas: 0"
echo "  - Total procesado: 2"
echo ""
echo "Estructura creada:"
echo "  $RECORDINGS_PATH/active/"
echo "  $RECORDINGS_PATH/completed/"
echo "  $RECORDINGS_PATH/failed/"
echo "  $BASE_PATH/logs/"
echo "  $BASE_PATH/backup/"
echo "==========================================="

# Guardar reporte
cat > "$BASE_PATH/ORGANIZATION_REPORT.txt" << EOF
===========================================
REPORTE DE ORGANIZACIÓN DE GRABACIONES
Fecha: $(date)
===========================================

Total de grabaciones procesadas: 2
- Activas: 0
- Completadas: 2
- Fallidas: 0

Espacio total: NaN GB
Radios diferentes: 1
Días de grabaciones: 1

Recomendaciones:
- Organizar grabaciones por radio (1 radios diferentes)\n- Espacio total utilizado: 0.02 GB

===========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/ORGANIZATION_REPORT.txt"
