#!/usr/bin/env node

/**
 * Script para organizar grabaciones del VPS por FECHA y RADIO
 * Estructura: /recordings/{YYYY-MM-DD}/{radio_id}/archivos.mp3
 */

const axios = require('axios');
const fs = require('fs');
const colors = require('colors');

// Configuración del VPS
const VPS_CONFIG = {
  apiBaseUrl: 'http://213.199.39.147:5000/api',
  recordingsEndpoint: '/recordings'
};

// Funciones de logging
function log(color, prefix, message) {
  console.log(`${color('[')}${color(prefix)}${color(']')} ${message}`);
}

function info(message) {
  log(colors.cyan, 'INFO', message);
}

function success(message) {
  log(colors.green, '✓ SUCCESS', message);
}

function error(message) {
  log(colors.red, '✗ ERROR', message);
}

function step(message) {
  log(colors.magenta, 'STEP', message);
}

// Función para verificar conexión al VPS
async function checkVPSConnection() {
  step('Verificando conexión al VPS vía API...');
  try {
    const response = await axios.get(`${VPS_CONFIG.apiBaseUrl}/active-recordings`, {
      timeout: 10000
    });
    
    if (response.data && response.data.status === 'success') {
      success('Conexión al VPS establecida correctamente vía API');
      return true;
    } else {
      error('Respuesta inesperada del VPS');
      return false;
    }
  } catch (err) {
    error(`No se pudo conectar al VPS: ${err.message}`);
    return false;
  }
}

// Función para obtener grabaciones actuales del VPS
async function getCurrentRecordings() {
  step('Obteniendo grabaciones actuales del VPS...');
  
  try {
    const response = await axios.get(`${VPS_CONFIG.apiBaseUrl}${VPS_CONFIG.recordingsEndpoint}`, {
      timeout: 30000
    });
    
    if (response.data && Array.isArray(response.data.recordings)) {
      const recordings = response.data.recordings;
      info(`Encontradas ${recordings.length} grabaciones`);
      return recordings;
    } else {
      warning('No se encontraron grabaciones o formato inesperado');
      return [];
    }
  } catch (err) {
    error(`Error obteniendo grabaciones: ${err.message}`);
    return [];
  }
}

// Función para extraer radio ID del filename
// Formato: radio_{radio_id}_{timestamp}_{uuid}.mp3
function extractRadioId(filename) {
  const match = filename.match(/^radio_([^_]+_[^_]+)_/);
  return match ? match[1] : 'unknown';
}

// Función para extraer fecha del filename
// Formato: radio_{radio_id}_YYYYMMDD_HHMMSS_{uuid}.mp3
function extractDate(filename) {
  const match = filename.match(/_(\d{8})_\d{6}_/);
  if (match) {
    const dateStr = match[1]; // YYYYMMDD
    return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
  }
  return 'unknown';
}

// Función para agrupar grabaciones por fecha y radio
function groupRecordingsByDateAndRadio(recordings) {
  step('Agrupando grabaciones por fecha y radio...');
  
  const grouped = {};
  let unknownCount = 0;
  
  recordings.forEach(rec => {
    const filename = rec.filename || '';
    const date = extractDate(filename);
    const radioId = extractRadioId(filename);
    
    // Ignorar grabaciones con fecha desconocida
    if (date === 'unknown') {
      unknownCount++;
      return;
    }
    
    // Inicializar estructura
    if (!grouped[date]) {
      grouped[date] = {};
    }
    if (!grouped[date][radioId]) {
      grouped[date][radioId] = [];
    }
    
    grouped[date][radioId].push({
      filename: filename,
      size: rec.size || 0,
      created: rec.created || new Date().toISOString()
    });
  });
  
  if (unknownCount > 0) {
    warning(`${unknownCount} grabaciones tienen fecha desconocida y serán ignoradas`);
  }
  
  success(`Grabaciones agrupadas: ${Object.keys(grouped).length} días, ${new Set(recordings.map(r => extractRadioId(r.filename))).size} radios`);
  return grouped;
}

// Función para generar script de organización
function generateOrganizationScript(groupedRecordings) {
  step('Generando script de organización...');
  
  // Calcular estadísticas
  const totalDays = Object.keys(groupedRecordings).length;
  const totalRadios = new Set();
  let totalFiles = 0;
  
  Object.values(groupedRecordings).forEach(day => {
    Object.keys(day).forEach(radioId => {
      totalRadios.add(radioId);
      totalFiles += day[radioId].length;
    });
  });

  const script = `#!/bin/bash

# ============================================
# SCRIPT DE ORGANIZACIÓN DE GRABACIONES
# Estructura: DIA/RADIO/GRABACIONES
# Generado el: ${new Date().toISOString()}
# ============================================

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="$BASE_PATH/recordings"

echo "==========================================="
echo "INICIANDO ORGANIZACIÓN DE GRABACIONES"
echo "Estructura: DIA → RADIO → GRABACIONES"
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
  else
    echo "  ⚠ Archivo no encontrado: $source_file"
  fi
}

# Crear estructura de directorios y mover archivos
echo "1. Organizando grabaciones por fecha y radio..."
echo "   Total: ${totalFiles} archivos, ${totalDays} días, ${totalRadios.size} radios"
echo ""

${Object.entries(groupedRecordings).map(([date, radios]) => `
# ========================================
# FECHA: ${date}
# ========================================
echo "→ Fecha: ${date}"
mkdir -p "$RECORDINGS_PATH/${date}"
${Object.entries(radios).map(([radioId, recordings]) => `
# Radio: ${radioId}
echo "  → Radio: ${radioId} (${recordings.length} grabaciones)"
mkdir -p "$RECORDINGS_PATH/${date}/${radioId}"
${recordings.map(rec => `
move_recording "$RECORDINGS_PATH/${rec.filename}" "$RECORDINGS_PATH/${date}/${radioId}"`).join('')}
`).join('')}
`).join('')}

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
${Object.entries(groupedRecordings).map(([date, radios]) => `
echo "  $RECORDINGS_PATH/${date}/"
${Object.keys(radios).map(radioId => `
echo "    └── ${radioId}/ (${radios[radioId].length} archivos)"`).join('')}
`).join('')}
echo "==========================================="

# Guardar reporte detallado
cat > "$BASE_PATH/ORGANIZATION_REPORT.txt" << EOF
===========================================
REPORTE DE ORGANIZACIÓN DE GRABACIONES
Fecha: $(date)
Estructura: DIA/RADIO/GRABACIONES
===========================================

TOTAL ESTADÍSTICAS:
- Archivos organizados: ${totalFiles}
- Días procesados: ${totalDays}
- Radios diferentes: ${totalRadios.size}

DETALLE POR DÍA:
${Object.entries(groupedRecordings).map(([date, radios]) => `
${date}:
${Object.entries(radios).map(([radioId, recs]) => `  - ${radioId}: ${recs.length} grabaciones`).join('\n')}
`).join('\n')}

===========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/ORGANIZATION_REPORT.txt"
`;

  // Guardar script
  const fs = require('fs');
  const scriptPath = './vps-organization-by-date-radio.sh';
  fs.writeFileSync(scriptPath, script);
  
  success(`Script generado: ${scriptPath}`);
  return scriptPath;
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== SCRIPT DE ORGANIZACIÓN DE VPS (FECHA/RADIO) ===\n'));
  
  // 1. Verificar conexión
  if (!await checkVPSConnection()) {
    error('No se pudo establecer conexión con el VPS. Abortando.');
    process.exit(1);
  }
  
  // 2. Obtener grabaciones
  const recordings = await getCurrentRecordings();
  if (recordings.length === 0) {
    warning('No se encontraron grabaciones para organizar');
    process.exit(0);
  }
  
  // 3. Agrupar por fecha y radio
  const groupedRecordings = groupRecordingsByDateAndRadio(recordings);
  
  // 4. Generar script
  const scriptPath = generateOrganizationScript(groupedRecordings);
  
  // 5. Generar recomendaciones
  console.log(colors.cyan.bold('\n=== PRÓXIMOS PASOS ===\n'));
  console.log('1. Copiar el script al VPS:');
  console.log(colors.yellow(`   scp ${scriptPath} radioapp@213.199.39.147:/home/radioapp/`));
  console.log('');
  console.log('2. Conectar al VPS:');
  console.log(colors.yellow('   ssh radioapp@213.199.39.147'));
  console.log('');
  console.log('3. Ejecutar el script:');
  console.log(colors.yellow('   cd /home/radioapp && bash vps-organization-by-date-radio.sh'));
  console.log('');
  console.log('4. Verificar la organización:');
  console.log(colors.yellow('   ls -la /home/radioapp/radio-recorder/recordings/'));
  console.log('');
  
  success('Proceso completado exitosamente');
}

// Ejecutar
main().catch(err => {
  error(`Error inesperado: ${err.message}`);
  console.error(err);
  process.exit(1);
});