#!/usr/bin/env node

/**
 * SCRIPT FINAL DE ORGANIZACIÓN DE GRABACIONES
 * 
 * Este script implementa la estructura completa solicitada:
 * - Grabaciones organizadas por FECHA
 * - Dentro de cada fecha, organizadas por RADIO
 * - Dentro de cada radio, las grabaciones individuales
 * - Sincronización completa con base de datos Supabase
 * 
 * ESTRUCTURA FINAL:
 * /recordings/
 *   ├── 2025-12-03/
 *   │   ├── radio-chiloe/
 *   │   │   ├── grabacion1.mp3
 *   │   │   └── grabacion2.mp3
 *   │   └── radio-digital/
 *   │       └── grabacion3.mp3
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const SUPABASE_CONFIG = {
  url: 'https://gdlfngqkmqpxlqfpkqdy.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbGZucWdrbXFweGxxZnBrcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MTc5MTIsImV4cCI6MjA1MDE5MzkxMn0.4n8e8m3c5l9q2d6f8r1s5w7x9z0a2b4c6d8e0f2g4h6i8j0k2l4m6n8o0p2q4r6s8t0u2v4w6x8y0z2a4b6c8d0e2f4g6h8i0j'
};

// Configuración del VPS
const VPS_CONFIG = {
  apiBaseUrl: 'http://213.199.39.147:5000/api',
  recordingsEndpoint: '/recordings'
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

// Cliente de Supabase
class SupabaseClient {
  constructor(config) {
    this.url = config.url;
    this.key = config.key;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await axios({
        method: options.method || 'GET',
        url: `${this.url}/rest/v1/${endpoint}`,
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        data: options.body ? JSON.parse(options.body) : undefined,
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error en request a Supabase:`, error.message);
      return null;
    }
  }
}

// Cliente del VPS
class VPSClient {
  constructor(config) {
    this.baseUrl = config.apiBaseUrl;
  }

  async getRecordings() {
    try {
      const response = await axios.get(`${this.baseUrl}${VPS_CONFIG.recordingsEndpoint}`, {
        timeout: 30000
      });
      
      if (response.data && Array.isArray(response.data.recordings)) {
        return response.data.recordings;
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo grabaciones del VPS:', error.message);
      return [];
    }
  }
}

// Función para extraer radio ID del filename
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

// Función para obtener información de radios desde Supabase
async function getRadiosInfo(supabaseClient) {
  step('Obteniendo información de radios desde Supabase...');
  
  const radios = await supabaseClient.request('radios?select=id_radio,name,region,description,platform,status');
  
  if (radios && Array.isArray(radios)) {
    success(`Encontradas ${radios.length} radios en la base de datos`);
    return radios;
  }
  
  warning('No se pudieron obtener las radios desde Supabase');
  return [];
}

// Función para agrupar grabaciones por fecha y radio
function groupRecordingsByDateAndRadio(recordings, radiosInfo) {
  step('Agrupando grabaciones por fecha y radio...');
  
  const grouped = {};
  const radioMap = {};
  
  // Crear mapa de radios para búsqueda rápida
  radiosInfo.forEach(radio => {
    radioMap[radio.id_radio] = radio;
  });
  
  recordings.forEach(rec => {
    const filename = rec.filename || '';
    const date = extractDate(filename);
    const radioId = extractRadioId(filename);
    
    // Ignorar grabaciones con fecha desconocida
    if (date === 'unknown') {
      return;
    }
    
    // Inicializar estructura
    if (!grouped[date]) {
      grouped[date] = {};
    }
    if (!grouped[date][radioId]) {
      grouped[date][radioId] = {
        recordings: [],
        radioInfo: radioMap[radioId] || {
          id_radio: radioId,
          name: `Radio ${radioId}`,
          region: 'Región no especificada',
          description: 'Descripción no disponible'
        }
      };
    }
    
    grouped[date][radioId].recordings.push({
      filename: filename,
      size: rec.size || 0,
      created: rec.created || new Date().toISOString(),
      file_path: rec.file_path || rec.path || filename
    });
  });
  
  success(`Grabaciones agrupadas: ${Object.keys(grouped).length} días`);
  return grouped;
}

// Función para generar script de organización completo
function generateCompleteOrganizationScript(groupedRecordings) {
  step('Generando script de organización completo...');
  
  // Calcular estadísticas
  const totalDays = Object.keys(groupedRecordings).length;
  const totalRadios = new Set();
  let totalFiles = 0;
  
  Object.values(groupedRecordings).forEach(day => {
    Object.keys(day).forEach(radioId => {
      totalRadios.add(radioId);
      totalFiles += day[radioId].recordings.length;
    });
  });

  const script = `#!/bin/bash

# ============================================
# SCRIPT COMPLETO DE ORGANIZACIÓN DE GRABACIONES
# Estructura: FECHA → RADIO → GRABACIONES
# Generado el: ${new Date().toISOString()}
# ============================================

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="\$BASE_PATH/recordings"

echo "==========================================="
echo "ORGANIZACIÓN COMPLETA DE GRABACIONES"
echo "Estructura: FECHA → RADIO → GRABACIONES"
echo "==========================================="
echo "Fecha: \$(date)"
echo ""

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

# Crear estructura de directorios y mover archivos
echo "1. Organizando grabaciones por fecha y radio..."
echo "   Total: \${totalFiles} archivos, \${totalDays} días, \${totalRadios.size} radios"
echo ""

${Object.entries(groupedRecordings).map(([date, radios]) => `
# ========================================
# FECHA: ${date}
# ========================================
echo "→ Fecha: ${date}"
mkdir -p "$RECORDINGS_PATH/${date}"
${Object.entries(radios).map(([radioId, data]) => `
# Radio: ${radioId} - ${data.radioInfo.name}
echo "  → Radio: ${radioId} (${data.radioInfo.name}) - ${data.recordings.length} grabaciones"
mkdir -p "$RECORDINGS_PATH/${date}/${radioId}"
${data.recordings.map(rec => `
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
- Días procesados: ${totalDays}
- Radios diferentes: ${totalRadios.size}

DETALLE POR DÍA:
${Object.entries(groupedRecordings).map(([date, radios]) => `
${date}:
${Object.entries(radios).map(([radioId, data]) => `  - ${radioId} (${data.radioInfo.name}): ${data.recordings.length} grabaciones`).join('\n')}
`).join('\n')}

===========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/ORGANIZATION_REPORT.txt"
`;

  // Guardar script
  const scriptPath = './complete-organization-script.sh';
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  success(`Script completo generado: ${scriptPath}`);
  return scriptPath;
}

// Función para sincronizar con Supabase
async function syncWithSupabase(groupedRecordings, supabaseClient) {
  step('Sincronizando información con Supabase...');
  
  let syncedCount = 0;
  let errorCount = 0;
  
  for (const [date, radios] of Object.entries(groupedRecordings)) {
    for (const [radioId, data] of Object.entries(radios)) {
      for (const recording of data.recordings) {
        try {
          // Preparar datos para Supabase
          const recordingData = {
            radio_id: data.radioInfo.id_radio,
            filename: recording.filename,
            file_path: `/recordings/${date}/${radioId}/${recording.filename}`,
            file_size: recording.size,
            recorded_at: recording.created,
            metadata: {
              organization_date: date,
              radio_name: data.radioInfo.name,
              radio_region: data.radioInfo.region,
              organization_structure: 'date/radio/recordings',
              synced_at: new Date().toISOString()
            }
          };
          
          // Verificar si ya existe
          const existing = await supabaseClient.request(
            `recordings?select=id&filename=eq.${encodeURIComponent(recording.filename)}`
          );
          
          if (existing && existing.length > 0) {
            // Actualizar existente
            await supabaseClient.request(`recordings?id=eq.${existing[0].id}`, {
              method: 'PATCH',
              body: JSON.stringify(recordingData)
            });
          } else {
            // Crear nuevo
            await supabaseClient.request('recordings', {
              method: 'POST',
              body: JSON.stringify(recordingData)
            });
          }
          
          syncedCount++;
          
        } catch (error) {
          console.error(`Error sincronizando ${recording.filename}:`, error.message);
          errorCount++;
        }
      }
    }
  }
  
  success(`Sincronización completada: ${syncedCount} archivos, ${errorCount} errores`);
  return { syncedCount, errorCount };
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== ORGANIZACIÓN COMPLETA DE GRABACIONES ===\n'));
  
  try {
    // 1. Inicializar clientes
    const supabaseClient = new SupabaseClient(SUPABASE_CONFIG);
    const vpsClient = new VPSClient(VPS_CONFIG);
    
    // 2. Obtener información de radios
    const radiosInfo = await getRadiosInfo(supabaseClient);
    
    // 3. Obtener grabaciones del VPS
    const recordings = await vpsClient.getRecordings();
    if (recordings.length === 0) {
      warning('No se encontraron grabaciones para organizar');
      return;
    }
    
    info(`Procesando ${recordings.length} grabaciones del VPS`);
    
    // 4. Agrupar por fecha y radio
    const groupedRecordings = groupRecordingsByDateAndRadio(recordings, radiosInfo);
    
    // 5. Generar script de organización
    const scriptPath = generateCompleteOrganizationScript(groupedRecordings);
    
    // 6. Sincronizar con Supabase
    const syncResult = await syncWithSupabase(groupedRecordings, supabaseClient);
    
    // 7. Mostrar resumen final
    console.log(colors.cyan.bold('\n=== RESUMEN FINAL ===\n'));
    console.log(`📁 Estructura generada: FECHA → RADIO → GRABACIONES`);
    console.log(`📊 Total de archivos: ${Object.values(groupedRecordings).reduce((sum, day) => 
      sum + Object.values(day).reduce((daySum, radio) => daySum + radio.recordings.length, 0), 0)}`);
    console.log(`📅 Días procesados: ${Object.keys(groupedRecordings).length}`);
    console.log(`📻 Radios involucradas: ${new Set(Object.values(groupedRecordings).flatMap(day => Object.keys(day))).size}`);
    console.log(`✅ Sincronizados con Supabase: ${syncResult.syncedCount}`);
    
    console.log(colors.yellow.bold('\n=== PRÓXIMOS PASOS ===\n'));
    console.log('1. Copiar el script al VPS:');
    console.log(colors.yellow(`   scp ${scriptPath} radioapp@213.199.39.147:/home/radioapp/`));
    console.log('');
    console.log('2. Conectar al VPS y ejecutar:');
    console.log(colors.yellow('   ssh radioapp@213.199.39.147'));
    console.log(colors.yellow('   cd /home/radioapp && bash complete-organization-script.sh'));
    console.log('');
    console.log('3. Verificar la nueva estructura:');
    console.log(colors.yellow('   ls -la /home/radioapp/radio-recorder/recordings/'));
    console.log('');
    
    success('Organización completa preparada exitosamente');
    
  } catch (error) {
    error(`Error en la organización: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = {
  main,
  extractRadioId,
  extractDate,
  groupRecordingsByDateAndRadio
};