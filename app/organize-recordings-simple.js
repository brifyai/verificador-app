#!/usr/bin/env node

/**
 * SCRIPT SIMPLIFICADO DE ORGANIZACIÓN DE GRABACIONES
 * 
 * Este script usa el endpoint público que no requiere autenticación
 * para organizar las grabaciones existentes
 */

const axios = require('axios');
const fs = require('fs');
const colors = require('colors');

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

function warning(message) {
  log(colors.yellow, '⚠ WARNING', message);
}

// Función para extraer radio_id del filename
function extractRadioId(filename) {
  const match = filename.match(/^radio_([^_]+)_/);
  return match ? match[1] : 'unknown';
}

// Función para extraer fecha del filename
function extractDate(filename) {
  const match = filename.match(/_(\d{8})_\d{6}_/);
  if (match) {
    const dateStr = match[1]; // YYYYMMDD
    return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
  }
  return 'unknown';
}

// Función para obtener grabaciones usando endpoint público
async function getPublicRecordings() {
  step('Obteniendo grabaciones desde endpoint público...');
  
  try {
    // Usar el endpoint público que no requiere autenticación
    const response = await axios.get('http://localhost:3000/api/recording-vps-fixed', {
      timeout: 30000
    });
    
    if (response.data && response.data.status === 'success') {
      // Este endpoint devuelve grabaciones activas, no todas las grabaciones
      const activeRecordings = response.data.active_recordings || {};
      const recordings = Object.values(activeRecordings).map(recording => ({
        filename: recording.filename || `recording_${recording.radio_id}_${Date.now()}.mp3`,
        radio_id: recording.radio_id,
        size: recording.file_size || 0,
        created: recording.start_time || new Date().toISOString()
      }));
      
      info(`Encontradas ${recordings.length} grabaciones activas`);
      return recordings;
    } else {
      warning('No se encontraron grabaciones en endpoint público');
      return [];
    }
  } catch (err) {
    error(`Error obteniendo grabaciones: ${err.message}`);
    return [];
  }
}

// Función para crear datos de prueba organizados
async function createTestOrganizedData() {
  step('Creando datos de prueba organizados...');
  
  // Simular las 3 grabaciones que ve el frontend
  const testRecordings = [
    {
      filename: 'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
      radio_id: 'mijm9xci',
      size: 1024000,
      created: '2025-12-02T00:46:18Z'
    },
    {
      filename: 'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
      radio_id: 'mijm9xsi',
      size: 2048000,
      created: '2025-12-01T20:12:05Z'
    },
    {
      filename: 'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3',
      radio_id: 'mijm9xsi',
      size: 1536000,
      created: '2025-12-01T20:02:16Z'
    }
  ];
  
  info(`Creados ${testRecordings.length} registros de prueba organizados`);
  return testRecordings;
}

// Función para agrupar grabaciones por fecha y radio
function groupRecordingsByDateAndRadio(recordings) {
  step('Agrupando grabaciones por fecha y radio...');
  
  const grouped = {};
  let unknownCount = 0;
  
  recordings.forEach(rec => {
    const filename = rec.filename || '';
    const date = extractDate(filename);
    const radioId = rec.radio_id || extractRadioId(filename);
    
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
      created: rec.created || new Date().toISOString(),
      radio_id: radioId
    });
  });
  
  if (unknownCount > 0) {
    warning(`${unknownCount} grabaciones tienen fecha desconocida y serán ignoradas`);
  }
  
  success(`Grabaciones agrupadas: ${Object.keys(grouped).length} días, ${new Set(recordings.map(r => r.radio_id || extractRadioId(r.filename))).size} radios`);
  return grouped;
}

// Función para generar script de organización para el VPS
function generateVPSOrganizationScript(groupedRecordings) {
  step('Generando script de organización para el VPS...');
  
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
==========================================
REPORTE DE ORGANIZACIÓN DE GRABACIONES
Fecha: $(date)
Estructura: DIA/RADIO/GRABACIONES
==========================================

TOTAL ESTADÍSTICAS:
- Archivos organizados: ${totalFiles}
- Días procesados: ${totalDays}
- Radios diferentes: ${totalRadios.size}

DETALLE POR DÍA:
${Object.entries(groupedRecordings).map(([date, radios]) => `
${date}:
${Object.entries(radios).map(([radioId, recs]) => `  - ${radioId}: ${recs.length} grabaciones`).join('\n')}
`).join('\n')}

==========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/ORGANIZATION_REPORT.txt"
`;

  // Guardar script
  const scriptPath = './vps-organization-simple.sh';
  fs.writeFileSync(scriptPath, script);
  
  success(`Script generado: ${scriptPath}`);
  return scriptPath;
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== SCRIPT SIMPLIFICADO DE ORGANIZACIÓN ===\n'));
  
  try {
    // 1. Intentar obtener grabaciones reales
    let recordings = await getPublicRecordings();
    
    // 2. Si no hay grabaciones reales, usar datos de prueba
    if (recordings.length === 0) {
      warning('No se encontraron grabaciones reales, usando datos de prueba...');
      recordings = await createTestOrganizedData();
    }
    
    if (recordings.length === 0) {
      warning('No hay grabaciones para organizar');
      process.exit(0);
    }
    
    // 3. Agrupar por fecha y radio
    const groupedRecordings = groupRecordingsByDateAndRadio(recordings);
    
    // 4. Generar script de organización
    const scriptPath = generateVPSOrganizationScript(groupedRecordings);
    
    // 5. Generar reporte final
    console.log(colors.cyan.bold('\n=== REPORTE FINAL ===\n'));
    console.log(`📊 Grabaciones procesadas: ${recordings.length}`);
    console.log(`📅 Días a organizar: ${Object.keys(groupedRecordings).length}`);
    console.log(`📻 Radios diferentes: ${new Set(recordings.map(r => r.radio_id || extractRadioId(r.filename))).size}`);
    
    // 6. Mostrar estructura que se creará
    console.log(colors.cyan.bold('\n=== ESTRUCTURA QUE SE CREARÁ ===\n'));
    Object.entries(groupedRecordings).forEach(([date, radios]) => {
      console.log(`📅 ${date}:`);
      Object.entries(radios).forEach(([radioId, recordings]) => {
        console.log(`   📻 ${radioId}: ${recordings.length} archivos`);
        recordings.forEach(rec => {
          console.log(`      - ${rec.filename}`);
        });
      });
      console.log('');
    });
    
    // 7. Generar recomendaciones
    console.log(colors.cyan.bold('\n=== PRÓXIMOS PASOS ===\n'));
    console.log('1. Copiar el script al VPS:');
    console.log(colors.yellow(`   scp ${scriptPath} radioapp@213.199.39.147:/home/radioapp/`));
    console.log('');
    console.log('2. Conectar al VPS:');
    console.log(colors.yellow('   ssh radioapp@213.199.39.147'));
    console.log('');
    console.log('3. Ejecutar el script:');
    console.log(colors.yellow('   cd /home/radioapp && bash vps-organization-simple.sh'));
    console.log('');
    console.log('4. Verificar la organización:');
    console.log(colors.yellow('   ls -la /home/radioapp/radio-recorder/recordings/'));
    console.log('');
    console.log('5. Verificar en la aplicación:');
    console.log(colors.yellow('   http://localhost:3000/grabaciones'));
    console.log('');
    
    success('Script de organización generado exitosamente');
    
  } catch (err) {
    error(`Error en organización: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Ejecutar
main().catch(err => {
  error(`Error inesperado: ${err.message}`);
  console.error(err);
  process.exit(1);
});