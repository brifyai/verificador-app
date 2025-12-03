#!/bin/bash

# ============================================
# SCRIPT DE ORGANIZACIÓN DE GRABACIONES
# Estructura: FECHA → RADIO → GRABACIONES
# Generado el: 2025-12-03T04:11:07.319Z
# ============================================

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="$BASE_PATH/recordings"

echo "==========================================="
echo "ORGANIZACIÓN DE GRABACIONES"
echo "Estructura: FECHA → RADIO → GRABACIONES"
echo "Total archivos: 6"
echo "Fecha: $(date)"
echo "==========================================="

# Función para mover grabaciones
move_recording() {
  local source_file="$1"
  local target_dir="$2"
  local filename=$(basename "$source_file")
  
  if [ -f "$source_file" ]; then
    mv "$source_file" "$target_dir/$filename"
    echo "  ✓ Movido: $filename"
    return 0
  else
    echo "  ⚠ Archivo no encontrado: $source_file"
    return 1
  fi
}

echo ""
echo "1. Creando estructura de directorios..."


# ========================================
# FECHA: 2025-12-03
# ========================================
echo "→ Organizando fecha: 2025-12-03"
mkdir -p "$RECORDINGS_PATH/2025-12-03"

# Radio: 22 - Radio Primavera
echo "  → Radio: 22 (Radio Primavera) - 2 grabaciones"
mkdir -p "$RECORDINGS_PATH/2025-12-03/22"

move_recording "$RECORDINGS_PATH/radio_22_20251203_120000_abc123.mp3" "$RECORDINGS_PATH/2025-12-03/22"

move_recording "$RECORDINGS_PATH/radio_22_20251203_143000_def456.mp3" "$RECORDINGS_PATH/2025-12-03/22"


# Radio: mijm9xci - Radio Chiloé
echo "  → Radio: mijm9xci (Radio Chiloé) - 1 grabaciones"
mkdir -p "$RECORDINGS_PATH/2025-12-03/mijm9xci"

move_recording "$RECORDINGS_PATH/radio_mijm9xci_20251203_100000_ghi789.mp3" "$RECORDINGS_PATH/2025-12-03/mijm9xci"


# Radio: mijm9xsi - Radio Digital FM
echo "  → Radio: mijm9xsi (Radio Digital FM) - 1 grabaciones"
mkdir -p "$RECORDINGS_PATH/2025-12-03/mijm9xsi"

move_recording "$RECORDINGS_PATH/radio_mijm9xsi_20251203_080000_mno345.mp3" "$RECORDINGS_PATH/2025-12-03/mijm9xsi"


# Radio: choapa - Radio Choapa
echo "  → Radio: choapa (Radio Choapa) - 1 grabaciones"
mkdir -p "$RECORDINGS_PATH/2025-12-03/choapa"

move_recording "$RECORDINGS_PATH/radio_choapa_20251203_200000_pqr678.mp3" "$RECORDINGS_PATH/2025-12-03/choapa"



# ========================================
# FECHA: 2025-12-02
# ========================================
echo "→ Organizando fecha: 2025-12-02"
mkdir -p "$RECORDINGS_PATH/2025-12-02"

# Radio: mijm9xci - Radio Chiloé
echo "  → Radio: mijm9xci (Radio Chiloé) - 1 grabaciones"
mkdir -p "$RECORDINGS_PATH/2025-12-02/mijm9xci"

move_recording "$RECORDINGS_PATH/radio_mijm9xci_20251202_160000_jkl012.mp3" "$RECORDINGS_PATH/2025-12-02/mijm9xci"



echo ""
echo "2. Limpiando directorios vacíos..."
find "$RECORDINGS_PATH" -type d -empty -delete 2>/dev/null
echo "✓ Directorios vacíos eliminados"

echo ""
echo "3. Estableciendo permisos correctos..."
chown -R radioapp:radioapp "$BASE_PATH"
chmod -R 755 "$BASE_PATH"
echo "✓ Permisos establecidos"

echo ""
echo "==========================================="
echo "ORGANIZACIÓN COMPLETADA ✓"
echo "==========================================="
echo "Estructura creada:"

echo "  $RECORDINGS_PATH/2025-12-03/"

echo "    └── 22/ (Radio Primavera) - 2 archivos"
echo "    └── mijm9xci/ (Radio Chiloé) - 1 archivos"
echo "    └── mijm9xsi/ (Radio Digital FM) - 1 archivos"
echo "    └── choapa/ (Radio Choapa) - 1 archivos"

echo "  $RECORDINGS_PATH/2025-12-02/"

echo "    └── mijm9xci/ (Radio Chiloé) - 1 archivos"

echo "==========================================="

# Guardar reporte detallado
cat > "$BASE_PATH/ORGANIZATION_REPORT.txt" << EOF
===========================================
REPORTE DE ORGANIZACIÓN DE GRABACIONES
Fecha: $(date)
Estructura: FECHA → RADIO → GRABACIONES
===========================================

TOTAL ESTADÍSTICAS:
- Archivos organizados: 6
- Días procesados: 2
- Radios diferentes: 4

DETALLE POR DÍA:

2025-12-03:
  - 22 (Radio Primavera): 2 grabaciones
  - mijm9xci (Radio Chiloé): 1 grabaciones
  - mijm9xsi (Radio Digital FM): 1 grabaciones
  - choapa (Radio Choapa): 1 grabaciones


2025-12-02:
  - mijm9xci (Radio Chiloé): 1 grabaciones


ESTRUCTURA DE CARPETAS:

2025-12-03/
  22/ (2 archivos)
  mijm9xci/ (1 archivos)
  mijm9xsi/ (1 archivos)
  choapa/ (1 archivos)


2025-12-02/
  mijm9xci/ (1 archivos)


===========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/ORGANIZATION_REPORT.txt"
