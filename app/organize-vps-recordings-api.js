#!/usr/bin/env node

/**
 * SCRIPT DE ORGANIZACIÓN DEL VPS VÍA API
 * 
 * Este script organiza las grabaciones del VPS usando la API HTTP
 * en lugar de conexión SSH directa.
 * 
 * ESTRUCTURA OBJETIVO:
 * /home/radioapp/radio-recorder/
 *   ├── recordings/
 *   │   ├── active/          # Grabaciones en curso
 *   │   ├── completed/       # Grabaciones finalizadas
 *   │   └── failed/          # Grabaciones con errores
 *   ├── logs/                # Archivos de log
 *   ├── temp/                # Archivos temporales
 *   └── backup/              # Respaldos importantes
 */

const axios = require('axios');

// Configuración
const VPS_CONFIG = {
  apiBaseUrl: 'http://213.199.39.147:5000/api',
  recordingsEndpoint: '/recordings',
  activeRecordingsEndpoint: '/active-recordings'
};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${color}${colors.bright}[${prefix}]${colors.reset} ${message}`);
}

function info(message) {
  log(colors.cyan, 'INFO', message);
}

function success(message) {
  log(colors.green, '✓ SUCCESS', message);
}

function warning(message) {
  log(colors.yellow, '⚠ WARNING', message);
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

// Función para obtener estructura actual de grabaciones
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

// Función para analizar y categorizar grabaciones
function analyzeRecordings(recordings) {
  step('Analizando grabaciones...');
  
  const analysis = {
    total: recordings.length,
    byDate: {},
    byRadio: {},
    byStatus: {
      active: [],
      completed: [],
      failed: []
    },
    recommendations: []
  };
  
  recordings.forEach(recording => {
    // Analizar por fecha
    const date = recording.timestamp ? recording.timestamp.split('T')[0] : 'unknown';
    if (!analysis.byDate[date]) {
      analysis.byDate[date] = [];
    }
    analysis.byDate[date].push(recording);
    
    // Analizar por radio
    const radioId = recording.radio_id || 'unknown';
    if (!analysis.byRadio[radioId]) {
      analysis.byRadio[radioId] = [];
    }
    analysis.byRadio[radioId].push(recording);
    
    // Categorizar por estado (basado en nombre de archivo o metadata)
    const filename = recording.filename || '';
    if (filename.includes('_active_') || filename.includes('_recording_')) {
      analysis.byStatus.active.push(recording);
    } else if (filename.includes('_failed_') || filename.includes('_error_')) {
      analysis.byStatus.failed.push(recording);
    } else {
      analysis.byStatus.completed.push(recording);
    }
  });
  
  // Generar recomendaciones
  const dates = Object.keys(analysis.byDate);
  if (dates.length > 30) {
    analysis.recommendations.push(`Considerar mover grabaciones antiguas (${dates.length} días) a backup`);
  }
  
  const radioCount = Object.keys(analysis.byRadio).length;
  analysis.recommendations.push(`Organizar grabaciones por radio (${radioCount} radios diferentes)`);
  
  const totalSize = recordings.reduce((sum, r) => sum + (r.size || 0), 0);
  const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
  analysis.recommendations.push(`Espacio total utilizado: ${sizeInGB} GB`);
  
  success('Análisis completado');
  return analysis;
}

// Función para generar script de organización para ejecutar en el VPS
function generateOrganizationScript(analysis) {
  step('Generando script de organización...');
  
  const script = `#!/bin/bash

# ============================================
# SCRIPT DE ORGANIZACIÓN AUTOMÁTICA DE GRABACIONES
# Generado el: ${new Date().toISOString()}
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
echo "   Total de grabaciones: ${analysis.total}"
echo ""

# Grabaciones activas (en curso)
echo "   → Procesando grabaciones activas: ${analysis.byStatus.active.length}"
for recording in ${analysis.byStatus.active.map(r => r.filename).join(' ')}; do
  move_recording "$RECORDINGS_PATH/$recording" "$RECORDINGS_PATH/active"
done
echo ""

# Grabaciones completadas
echo "   → Procesando grabaciones completadas: ${analysis.byStatus.completed.length}"
for recording in ${analysis.byStatus.completed.map(r => r.filename).join(' ')}; do
  move_recording "$RECORDINGS_PATH/$recording" "$RECORDINGS_PATH/completed"
done
echo ""

# Grabaciones fallidas
echo "   → Procesando grabaciones fallidas: ${analysis.byStatus.failed.length}"
for recording in ${analysis.byStatus.failed.map(r => r.filename).join(' ')}; do
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
find "$BASE_PATH/recordings/completed" -name "*.mp3" -mtime +30 -exec mv {} "$BASE_PATH/backup/" \\; 2>/dev/null
log "Grabaciones antiguas movidas a backup"

# Limpiar temporales (>7 días)
find "$BASE_PATH/temp" -type f -mtime +7 -delete 2>/dev/null
log "Temporales limpiados"

# Comprimir logs antiguos
find "$BASE_PATH/logs" -name "*.log" -mtime +7 -exec gzip {} \\; 2>/dev/null
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
echo "  - Grabaciones activas: ${analysis.byStatus.active.length}"
echo "  - Grabaciones completadas: ${analysis.byStatus.completed.length}"
echo "  - Grabaciones fallidas: ${analysis.byStatus.failed.length}"
echo "  - Total procesado: ${analysis.total}"
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

Total de grabaciones procesadas: ${analysis.total}
- Activas: ${analysis.byStatus.active.length}
- Completadas: ${analysis.byStatus.completed.length}
- Fallidas: ${analysis.byStatus.failed.length}

Espacio total: ${(analysis.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB
Radios diferentes: ${Object.keys(analysis.byRadio).length}
Días de grabaciones: ${Object.keys(analysis.byDate).length}

Recomendaciones:
${analysis.recommendations.map(r => `- ${r}`).join('\\n')}

===========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/ORGANIZATION_REPORT.txt"
`;

  // Guardar script localmente
  const fs = require('fs');
  const scriptPath = './vps-organization-script.sh';
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  success(`Script de organización generado: ${scriptPath}`);
  return scriptPath;
}

// Función para generar reporte de recomendaciones
function generateRecommendations(analysis) {
  step('Generando recomendaciones...');
  
  const recommendations = [
    {
      priority: 'ALTA',
      action: 'Ejecutar script de organización en el VPS',
      details: 'El script organizará todas las grabaciones en carpetas según su estado',
      command: 'bash vps-organization-script.sh'
    },
    {
      priority: 'MEDIA',
      action: 'Configurar mantenimiento automático',
      details: 'Agregar tarea cron para ejecutar mantenimiento diario',
      command: 'crontab -e\n# Agregar: 0 2 * * * /home/radioapp/radio-recorder/scripts/maintenance.sh'
    },
    {
      priority: 'MEDIA',
      action: 'Monitorear espacio en disco',
      details: `Actualmente se utilizan ${(analysis.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      threshold: 'Configurar alerta cuando el espacio supere el 80%'
    },
    {
      priority: 'BAJA',
      action: 'Revisar grabaciones fallidas',
      details: `Hay ${analysis.byStatus.failed.length} grabaciones que pueden necesitar atención`,
      location: '/home/radioapp/radio-recorder/recordings/failed/'
    }
  ];
  
  // Guardar recomendaciones
  const fs = require('fs');
  const reportPath = './vps-organization-recommendations.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    analysis: analysis,
    recommendations: recommendations
  }, null, 2));
  
  success(`Recomendaciones guardadas: ${reportPath}`);
  return recommendations;
}

// Función principal
async function main() {
  console.log(colors.bright + colors.cyan + '\n=== SCRIPT DE ORGANIZACIÓN DE VPS (VÍA API) ===\n' + colors.reset);
  
  try {
    // 1. Verificar conexión
    const connected = await checkVPSConnection();
    if (!connected) {
      error('No se pudo establecer conexión con el VPS. Abortando.');
      process.exit(1);
    }
    
    // 2. Obtener grabaciones actuales
    const recordings = await getCurrentRecordings();
    if (recordings.length === 0) {
      warning('No se encontraron grabaciones para organizar');
      return;
    }
    
    // 3. Analizar grabaciones
    const analysis = analyzeRecordings(recordings);
    
    // 4. Generar script de organización
    const scriptPath = generateOrganizationScript(analysis);
    
    // 5. Generar recomendaciones
    const recommendations = generateRecommendations(analysis);
    
    // 6. Mostrar resumen
    console.log('\n' + colors.cyan + colors.bright + '=== RESUMEN DE ORGANIZACIÓN ===' + colors.reset);
    console.log(`Total de grabaciones: ${analysis.total}`);
    console.log(`- Activas: ${analysis.byStatus.active.length}`);
    console.log(`- Completadas: ${analysis.byStatus.completed.length}`);
    console.log(`- Fallidas: ${analysis.byStatus.failed.length}`);
    console.log(`Espacio total: ${(analysis.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    console.log(`Radios diferentes: ${Object.keys(analysis.byRadio).length}`);
    console.log(`Días de grabaciones: ${Object.keys(analysis.byDate).length}`);
    
    console.log('\n' + colors.yellow + colors.bright + '=== PRÓXIMOS PASOS ===' + colors.reset);
    console.log('1. Copiar el script al VPS:');
    console.log('   scp vps-organization-script.sh radioapp@213.199.39.147:/home/radioapp/');
    console.log('');
    console.log('2. Ejecutar el script en el VPS:');
    console.log('   ssh radioapp@213.199.39.147');
    console.log('   cd /home/radioapp');
    console.log('   bash vps-organization-script.sh');
    console.log('');
    console.log('3. Verificar la organización:');
    console.log('   ls -la /home/radioapp/radio-recorder/recordings/');
    console.log('');
    
    console.log(colors.green + colors.bright + '=== SCRIPT GENERADO EXITOSAMENTE ===' + colors.reset);
    info('El script de organización ha sido creado localmente.');
    info('Sigue los pasos anteriores para ejecutarlo en el VPS.');
    info('Todas las grabaciones serán organizadas en carpetas según su estado.');
    
  } catch (err) {
    error('\n=== ERROR EN LA ORGANIZACIÓN ===');
    error(err.message);
    process.exit(1);
  }
}

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  VPS_CONFIG,
  main,
  checkVPSConnection,
  getCurrentRecordings,
  analyzeRecordings
};