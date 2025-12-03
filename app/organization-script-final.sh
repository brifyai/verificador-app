#!/bin/bash

# ============================================
# SCRIPT DE ORGANIZACIÓN DE GRABACIONES
# Estructura: FECHA → RADIO → GRABACIONES
# Generado el: 2025-12-03T02:16:39.225Z
# ============================================

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="$BASE_PATH/recordings"

echo "==========================================="
echo "ORGANIZACIÓN DE GRABACIONES"
echo "Estructura: FECHA → RADIO → GRABACIONES"
echo "==========================================="
echo "Fecha: $(date)"
echo ""

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

echo "1. Organizando grabaciones por fecha y radio..."
echo "   Total: ${totalFiles} archivos, ${totalDays} días, ${totalRadios.size} radios"
echo ""


# ========================================
# FECHA: 2025-12-02
# ========================================
echo "→ Fecha: 2025-12-02"
mkdir -p "$RECORDINGS_PATH/2025-12-02"

# Radio: mijm9xci - Chiloe
echo "  → Radio: mijm9xci (Chiloe) - 1 grabaciones"
mkdir -p "$RECORDINGS_PATH/2025-12-02/mijm9xci"

move_recording "$RECORDINGS_PATH/radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3" "$RECORDINGS_PATH/2025-12-02/mijm9xci"


# ========================================
# FECHA: 2025-12-01
# ========================================
echo "→ Fecha: 2025-12-01"
mkdir -p "$RECORDINGS_PATH/2025-12-01"

# Radio: mijm9xsi - Digital
echo "  → Radio: mijm9xsi (Digital) - 2 grabaciones"
mkdir -p "$RECORDINGS_PATH/2025-12-01/mijm9xsi"

move_recording "$RECORDINGS_PATH/radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3" "$RECORDINGS_PATH/2025-12-01/mijm9xsi"
move_recording "$RECORDINGS_PATH/radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3" "$RECORDINGS_PATH/2025-12-01/mijm9xsi"



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

echo "  $RECORDINGS_PATH/2025-12-02/"

echo "    └── mijm9xci/ (Chiloe) - 1 archivos"

echo "  $RECORDINGS_PATH/2025-12-01/"

echo "    └── mijm9xsi/ (Digital) - 2 archivos"

echo "==========================================="

# Guardar reporte detallado
cat > "$BASE_PATH/ORGANIZATION_REPORT.txt" << EOF
===========================================
REPORTE DE ORGANIZACIÓN DE GRABACIONES
Fecha: $(date)
Estructura: FECHA → RADIO → GRABACIONES
===========================================

TOTAL ESTADÍSTICAS:
- Archivos organizados: 3
- Días procesados: 2
- Radios diferentes: 2

DETALLE POR DÍA:

2025-12-02:
  - mijm9xci (Chiloe): 1 grabaciones


2025-12-01:
  - mijm9xsi (Digital): 2 grabaciones


ESTRUCTURA DE ARCHIVOS:

2025-12-02/
  mijm9xci/
    radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3


2025-12-01/
  mijm9xsi/
    radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3
    radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3


===========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/ORGANIZATION_REPORT.txt"
