#!/usr/bin/env node

/**
 * DEMOSTRACIÓN DE ORGANIZACIÓN DE GRABACIONES
 * 
 * Este script demuestra cómo organizar las grabaciones en la estructura:
 * FECHA → RADIO → GRABACIONES
 * 
 * Con datos simulados para mostrar el funcionamiento
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', 
  yellow: '\x1b[33m', blue: '\x1b[34m',
  magenta: '\x1b[35m', cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${color}${colors.bright}[${prefix}]${colors.reset} ${message}`);
}

function info(message) { log(colors.cyan, 'INFO', message); }
function success(message) { log(colors.green, '✓ SUCCESS', message); }
function warning(message) { log(colors.yellow, '⚠ WARNING', message); }
function error(message) { log(colors.red, '✗ ERROR', message); }
function step(message) { log(colors.magenta, 'STEP', message); }

// Datos simulados de radios (esto vendría de la tabla radios)
const mockRadios = [
  { id_radio: '22', name: 'Radio Primavera', region: 'Metropolitana', city: 'Santiago' },
  { id_radio: 'mijm9xci', name: 'Radio Chiloé', region: 'Los Lagos', city: 'Castro' },
  { id_radio: 'mijm9xsi', name: 'Radio Digital FM', region: 'Valparaíso', city: 'Valparaíso' },
  { id_radio: 'choapa', name: 'Radio Choapa', region: 'Coquimbo', city: 'La Serena' }
];

// Datos simulados de grabaciones (esto vendría del VPS y tabla recordings)
const mockRecordings = [
  {
    filename: 'radio_22_20251203_120000_abc123.mp3',
    radio_id: '22',
    radio_name: 'Radio Primavera',
    recorded_at: '2025-12-03T12:00:00Z',
    file_size: 1024000,
    duration_seconds: 300
  },
  {
    filename: 'radio_22_20251203_143000_def456.mp3',
    radio_id: '22',
    radio_name: 'Radio Primavera',
    recorded_at: '2025-12-03T14:30:00Z',
    file_size: 2048000,
    duration_seconds: 600
  },
  {
    filename: 'radio_mijm9xci_20251203_100000_ghi789.mp3',
    radio_id: 'mijm9xci',
    radio_name: 'Radio Chiloé',
    recorded_at: '2025-12-03T10:00:00Z',
    file_size: 1536000,
    duration_seconds: 450
  },
  {
    filename: 'radio_mijm9xci_20251202_160000_jkl012.mp3',
    radio_id: 'mijm9xci',
    radio_name: 'Radio Chiloé',
    recorded_at: '2025-12-02T16:00:00Z',
    file_size: 3072000,
    duration_seconds: 900
  },
  {
    filename: 'radio_mijm9xsi_20251203_080000_mno345.mp3',
    radio_id: 'mijm9xsi',
    radio_name: 'Radio Digital FM',
    recorded_at: '2025-12-03T08:00:00Z',
    file_size: 1280000,
    duration_seconds: 400
  },
  {
    filename: 'radio_choapa_20251203_200000_pqr678.mp3',
    radio_id: 'choapa',
    radio_name: 'Radio Choapa',
    recorded_at: '2025-12-03T20:00:00Z',
    file_size: 2560000,
    duration_seconds: 720
  }
];

// Función para extraer fecha del filename
function extractDate(filename) {
  const match = filename.match(/_(\d{8})_/);
  if (match) {
    const dateStr = match[1]; // YYYYMMDD
    return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
  }
  return '2025-12-03'; // Fallback
}

// Función para agrupar grabaciones por fecha y radio
function groupRecordingsByDateAndRadio(recordings, radios) {
  step('Agrupando grabaciones por fecha y radio...');
  
  const grouped = {};
  const radioMap = {};
  
  // Crear mapa de radios para búsqueda rápida
  radios.forEach(radio => {
    radioMap[radio.id_radio] = radio;
  });
  
  recordings.forEach(rec => {
    const date = extractDate(rec.filename);
    const radioId = rec.radio_id;
    
    // Inicializar estructura
    if (!grouped[date]) {
      grouped[date] = {};
    }
    if (!grouped[date][radioId]) {
      grouped[date][radioId] = {
        recordings: [],
        radioInfo: radioMap[radioId] || {
          id_radio: radioId,
          name: rec.radio_name || `Radio ${radioId}`,
          region: 'Región no especificada',
          city: 'Ciudad no especificada'
        }
      };
    }
    
    grouped[date][radioId].recordings.push({
      filename: rec.filename,
      radio_name: rec.radio_name,
      recorded_at: rec.recorded_at,
      file_size: rec.file_size,
      duration_seconds: rec.duration_seconds,
      file_path: `/recordings/${date}/${radioId}/${rec.filename}`
    });
  });
  
  success(`Grabaciones agrupadas: ${Object.keys(grouped).length} días`);
  return grouped;
}

// Función para crear estructura de carpetas local
function createLocalStructure(groupedRecordings) {
  step('Creando estructura local de ejemplo...');
  
  const basePath = './demo-recordings';
  
  // Limpiar estructura anterior
  if (fs.existsSync(basePath)) {
    fs.rmSync(basePath, { recursive: true, force: true });
  }
  
  // Crear nueva estructura
  Object.entries(groupedRecordings).forEach(([date, radios]) => {
    Object.entries(radios).forEach(([radioId, data]) => {
      const dirPath = `${basePath}/${date}/${radioId}`;
      fs.mkdirSync(dirPath, { recursive: true });
      
      // Crear archivos de ejemplo
      data.recordings.forEach(recording => {
        const filePath = `${dirPath}/${recording.filename}`;
        const content = `Grabación de ${recording.radio_name}
Fecha: ${recording.recorded_at}
Duración: ${recording.duration_seconds} segundos
Tamaño: ${recording.file_size} bytes
Ruta: ${recording.file_path}

Este es un archivo de ejemplo para demostrar la estructura de organización.
En el sistema real, aquí estarían los archivos de audio MP3.
`;
        fs.writeFileSync(filePath, content);
      });
    });
  });
  
  success(`Estructura local creada en: ${basePath}`);
  return basePath;
}

// Función para generar script de organización para VPS
function generateVPSScript(groupedRecordings) {
  step('Generando script para VPS...');
  
  const totalFiles = Object.values(groupedRecordings).reduce((sum, day) => 
    sum + Object.values(day).reduce((daySum, radio) => daySum + radio.recordings.length, 0), 0);
  
  const script = `#!/bin/bash

# ============================================
# SCRIPT DE ORGANIZACIÓN DE GRABACIONES
# Estructura: FECHA → RADIO → GRABACIONES
# Generado el: ${new Date().toISOString()}
# ============================================

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="\$BASE_PATH/recordings"

echo "==========================================="
echo "ORGANIZACIÓN DE GRABACIONES"
echo "Estructura: FECHA → RADIO → GRABACIONES"
echo "Total archivos: ${totalFiles}"
echo "Fecha: \$(date)"
echo "==========================================="

# Función para mover grabaciones
move_recording() {
  local source_file="\$1"
  local target_dir="\$2"
  local filename=\$(basename "\$source_file")
  
  if [ -f "\$source_file" ]; then
    mv "\$source_file" "\$target_dir/\$filename"
    echo "  ✓ Movido: \$filename"
    return 0
  else
    echo "  ⚠ Archivo no encontrado: \$source_file"
    return 1
  fi
}

echo ""
echo "1. Creando estructura de directorios..."

${Object.entries(groupedRecordings).map(([date, radios]) => `
# ========================================
# FECHA: ${date}
# ========================================
echo "→ Organizando fecha: ${date}"
mkdir -p "$RECORDINGS_PATH/${date}"
${Object.entries(radios).map(([radioId, data]) => `
# Radio: ${radioId} - ${data.radioInfo.name}
echo "  → Radio: ${radioId} (${data.radioInfo.name}) - ${data.recordings.length} grabaciones"
mkdir -p "$RECORDINGS_PATH/${date}/${radioId}"
${data.recordings.map(recording => `
move_recording "$RECORDINGS_PATH/${recording.filename}" "$RECORDINGS_PATH/${date}/${radioId}"`).join('\n')}
`).join('\n')}
`).join('\n')}

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
${Object.entries(radios).map(([radioId, data]) => `
echo "    └── ${radioId}/ (${data.radioInfo.name}) - ${data.recordings.length} archivos"`).join('')}
`).join('')}
echo "==========================================="

# Guardar reporte detallado
cat > "$BASE_PATH/ORGANIZATION_REPORT.txt" << EOF
===========================================
REPORTE DE ORGANIZACIÓN DE GRABACIONES
Fecha: \$(date)
Estructura: FECHA → RADIO → GRABACIONES
===========================================

TOTAL ESTADÍSTICAS:
- Archivos organizados: ${totalFiles}
- Días procesados: ${Object.keys(groupedRecordings).length}
- Radios diferentes: ${new Set(Object.values(groupedRecordings).flatMap(day => Object.keys(day))).size}

DETALLE POR DÍA:
${Object.entries(groupedRecordings).map(([date, radios]) => `
${date}:
${Object.entries(radios).map(([radioId, data]) => `  - ${radioId} (${data.radioInfo.name}): ${data.recordings.length} grabaciones`).join('\n')}
`).join('\n')}

ESTRUCTURA DE CARPETAS:
${Object.entries(groupedRecordings).map(([date, radios]) => `
${date}/
${Object.entries(radios).map(([radioId, data]) => `  ${radioId}/ (${data.recordings.length} archivos)`).join('\n')}
`).join('\n')}

===========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/ORGANIZATION_REPORT.txt"
`;

  // Guardar script
  const scriptPath = './organize-vps-recordings.sh';
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  success(`Script para VPS generado: ${scriptPath}`);
  return scriptPath;
}

// Función para generar SQL de sincronización con base de datos
function generateDatabaseSyncSQL(groupedRecordings) {
  step('Generando SQL para sincronización con base de datos...');
  
  let sql = `-- SQL para sincronizar grabaciones organizadas con la base de datos
-- Este script actualiza la tabla recordings con la nueva estructura

-- Limpiar datos existentes (opcional, solo si quieres empezar de cero)
-- DELETE FROM recordings WHERE recorded_at >= '2025-12-01';

-- Insertar/actualizar grabaciones con nueva estructura
`;

  Object.entries(groupedRecordings).forEach(([date, radios]) => {
    Object.entries(radios).forEach(([radioId, data]) => {
      data.recordings.forEach(recording => {
        sql += `
INSERT INTO recordings (
  radio_id,
  radio_name,
  filename,
  file_path,
  file_size,
  duration_seconds,
  recorded_at,
  metadata
) VALUES (
  '${radioId}',
  '${recording.radio_name}',
  '${recording.filename}',
  '${recording.file_path}',
  ${recording.file_size},
  ${recording.duration_seconds},
  '${recording.recorded_at}',
  '{
    "organization_date": "${date}",
    "radio_region": "${data.radioInfo.region}",
    "radio_city": "${data.radioInfo.city}",
    "organization_structure": "date/radio/recordings",
    "synced_at": "${new Date().toISOString()}"
  }'::jsonb
)
ON CONFLICT (filename) DO UPDATE SET
  file_path = EXCLUDED.file_path,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();`;
      });
    });
  });
  
  sql += `

-- Verificar la organización
SELECT 
  DATE(recorded_at) as fecha,
  radio_id,
  radio_name,
  COUNT(*) as total_grabaciones,
  SUM(file_size) as tamaño_total,
  SUM(duration_seconds) as duracion_total
FROM recordings 
WHERE recorded_at >= '2025-12-01'
GROUP BY DATE(recorded_at), radio_id, radio_name
ORDER BY fecha DESC, radio_name;`;

  // Guardar SQL
  const sqlPath = './sync-recordings-database.sql';
  fs.writeFileSync(sqlPath, sql);
  
  success(`SQL de sincronización generado: ${sqlPath}`);
  return sqlPath;
}

// Función principal
function main() {
  console.log(colors.cyan.bold('\n=== DEMOSTRACIÓN: ORGANIZACIÓN DE GRABACIONES ===\n'));
  console.log('Este script demuestra cómo organizar las grabaciones en la estructura:');
  console.log('📁 FECHA → 📻 RADIO → 🎵 GRABACIONES\n');
  
  try {
    // 1. Agrupar grabaciones por fecha y radio
    const groupedRecordings = groupRecordingsByDateAndRadio(mockRecordings, mockRadios);
    
    // 2. Crear estructura local de ejemplo
    const localPath = createLocalStructure(groupedRecordings);
    
    // 3. Generar script para VPS
    const scriptPath = generateVPSScript(groupedRecordings);
    
    // 4. Generar SQL para base de datos
    const sqlPath = generateDatabaseSyncSQL(groupedRecordings);
    
    // 5. Mostrar resumen final
    console.log(colors.cyan.bold('\n=== RESUMEN DE LA DEMOSTRACIÓN ===\n'));
    
    const totalFiles = Object.values(groupedRecordings).reduce((sum, day) => 
      sum + Object.values(day).reduce((daySum, radio) => daySum + radio.recordings.length, 0), 0);
    
    console.log(`📁 Estructura generada: FECHA → RADIO → GRABACIONES`);
    console.log(`📊 Total de archivos: ${totalFiles}`);
    console.log(`📅 Días procesados: ${Object.keys(groupedRecordings).length}`);
    console.log(`📻 Radios involucradas: ${new Set(Object.values(groupedRecordings).flatMap(day => Object.keys(day))).size}`);
    console.log(`📂 Estructura local: ${localPath}`);
    console.log(`📜 Script para VPS: ${scriptPath}`);
    console.log(`🗄️ SQL para BD: ${sqlPath}`);
    
    console.log(colors.yellow.bold('\n=== ESTRUCTURA CREADA ===\n'));
    Object.entries(groupedRecordings).forEach(([date, radios]) => {
      console.log(`📅 ${date}/`);
      Object.entries(radios).forEach(([radioId, data]) => {
        console.log(`  📻 ${radioId}/ (${data.radioInfo.name}) - ${data.recordings.length} archivos`);
        data.recordings.forEach(recording => {
          console.log(`    🎵 ${recording.filename}`);
        });
      });
    });
    
    console.log(colors.yellow.bold('\n=== PRÓXIMOS PASOS PARA IMPLEMENTACIÓN ===\n'));
    console.log('1. Verificar estructura local creada:');
    console.log(`   ls -la ${localPath}/`);
    console.log('');
    console.log('2. Para implementar en el VPS real:');
    console.log(`   scp ${scriptPath} radioapp@213.199.39.147:/home/radioapp/`);
    console.log('   ssh radioapp@213.199.39.147');
    console.log('   cd /home/radioapp && bash organize-vps-recordings.sh');
    console.log('');
    console.log('3. Para sincronizar con la base de datos:');
    console.log(`   psql -d database_name -f ${sqlPath}`);
    console.log('');
    console.log('4. Verificar en la aplicación:');
    console.log('   http://localhost:3000/grabaciones');
    console.log('');
    
    console.log(colors.green.bold('✅ DEMOSTRACIÓN COMPLETADA EXITOSAMENTE\n'));
    console.log('La estructura FECHA → RADIO → GRABACIONES está lista para implementar.');
    
  } catch (error) {
    error(`Error en la demostración: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = {
  main,
  groupRecordingsByDateAndRadio,
  extractDate
};