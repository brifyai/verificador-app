#!/usr/bin/env node

/**
 * SCRIPT DE ORGANIZACIÓN DE GRABACIONES USANDO LA API EXISTENTE
 * 
 * Este script utiliza la API existente de la aplicación para obtener
 * las grabaciones y generar la estructura de organización solicitada:
 * 
 * ESTRUCTURA FINAL:
 * /recordings/
 *   ├── 2025-12-03/
 *   │   ├── mijm9xci/ (Radio Chiloe)
 *   │   │   ├── grabacion1.mp3
 *   │   │   └── grabacion2.mp3
 *   │   └── mijm9xsi/ (Radio Digital)
 *   │       └── grabacion3.mp3
 */

const axios = require('axios');
const fs = require('fs');

// Configuración
const APP_API_BASE = 'http://localhost:3000/api';

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

// Función para obtener grabaciones desde la API de la aplicación
async function getRecordingsFromApp() {
  step('Obteniendo grabaciones desde la API de la aplicación...');
  
  try {
    const response = await axios.get(`${APP_API_BASE}/recordings-from-supabase`, {
      timeout: 30000
    });
    
    if (response.data && response.data.recordings) {
      info(`Encontradas ${response.data.recordings.length} grabaciones desde la aplicación`);
      return response.data.recordings;
    }
    
    warning('No se encontraron grabaciones en la respuesta de la API');
    return [];
  } catch (err) {
    error(`Error obteniendo grabaciones desde la aplicación: ${err.message}`);
    return [];
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
      grouped[date][radioId] = {
        recordings: [],
        radioInfo: {
          id: radioId,
          name: rec.radio_name || `Radio ${radioId}`,
          region: rec.radio_region || 'Región no especificada',
          city: rec.radio_city || 'Ciudad no especificada'
        }
      };
    }
    
    grouped[date][radioId].recordings.push({
      filename: filename,
      size: rec.size || 0,
      created: rec.created_at || new Date().toISOString(),
      download_url: rec.download_url || `http://213.199.39.147:5000/recordings/${filename}`
    });
  });
  
  if (unknownCount > 0) {
    warning(`${unknownCount} grabaciones tienen fecha desconocida y serán ignoradas`);
  }
  
  success(`Grabaciones agrupadas: ${Object.keys(grouped).length} días`);
  return grouped;
}

// Función para generar script de organización completo
function generateOrganizationScript(groupedRecordings) {
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
# SCRIPT DE ORGANIZACIÓN DE GRABACIONES
# Estructura: FECHA → RADIO → GRABACIONES
# Generado el: ${new Date().toISOString()}
# ============================================

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="\$BASE_PATH/recordings"

echo "==========================================="
echo "ORGANIZACIÓN DE GRABACIONES"
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

ESTRUCTURA DE ARCHIVOS:
${Object.entries(groupedRecordings).map(([date, radios]) => `
${date}/
${Object.entries(radios).map(([radioId, data]) => `  ${radioId}/
${data.recordings.map(rec => `    ${rec.filename}`).join('\n')}`).join('\n')}
`).join('\n')}

===========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/ORGANIZATION_REPORT.txt"
`;

  // Guardar script
  const scriptPath = './organization-script.sh';
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  success(`Script de organización generado: ${scriptPath}`);
  return scriptPath;
}

// Función para generar documentación de la nueva estructura
function generateStructureDocumentation(groupedRecordings) {
  step('Generando documentación de la estructura...');
  
  const doc = `# DOCUMENTACIÓN DE ORGANIZACIÓN DE GRABACIONES

## Estructura Implementada

La nueva estructura de organización de grabaciones es:

\`\`\`
/home/radioapp/radio-recorder/recordings/
├── 2025-12-03/
│   ├── mijm9xci/          # Radio Chiloe
│   │   ├── radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3
│   │   └── ...
│   └── mijm9xsi/          # Radio Digital
│       ├── radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3
│       └── ...
├── 2025-12-02/
│   └── ...
└── ...
\`\`\`

## Beneficios de esta Estructura

1. **Organización por Fecha**: Fácil localización de grabaciones por día
2. **Organización por Radio**: Agrupación lógica por estación de radio
3. **Escalabilidad**: Se adapta automáticamente a nuevas fechas y radios
4. **Mantenimiento**: Fácil limpieza y archivado de grabaciones antiguas

## Sincronización con Base de Datos

Cada grabación se guarda en la tabla \`recordings\` con:
- \`radio_id\`: Referencia a la tabla \`radios\`
- \`file_path\`: Ruta completa del archivo organizado
- \`metadata\`: Información adicional sobre la organización

## Comandos de Verificación

\`\`\`bash
# Ver estructura completa
ls -la /home/radioapp/radio-recorder/recordings/

# Ver grabaciones de una fecha específica
ls -la /home/radioapp/radio-recorder/recordings/2025-12-03/

# Ver grabaciones de una radio específica
ls -la /home/radioapp/radio-recorder/recordings/2025-12-03/mijm9xci/

# Ver reporte de organización
cat /home/radioapp/radio-recorder/ORGANIZATION_REPORT.txt
\`\`\`

## Próximos Pasos

1. Ejecutar el script de organización en el VPS
2. Verificar que la nueva estructura funciona correctamente
3. Actualizar la API de la aplicación para usar las nuevas rutas
4. Configurar mantenimiento automático de grabaciones antiguas

---
Generado el: ${new Date().toISOString()}
`;

  const docPath = './ORGANIZATION_DOCUMENTATION.md';
  fs.writeFileSync(docPath, doc);
  
  success(`Documentación generada: ${docPath}`);
  return docPath;
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== ORGANIZACIÓN DE GRABACIONES (API EXISTENTE) ===\n'));
  
  try {
    // 1. Obtener grabaciones desde la aplicación
    const recordings = await getRecordingsFromApp();
    if (recordings.length === 0) {
      warning('No se encontraron grabaciones para organizar');
      return;
    }
    
    info(`Procesando ${recordings.length} grabaciones desde la aplicación`);
    
    // 2. Agrupar por fecha y radio
    const groupedRecordings = groupRecordingsByDateAndRadio(recordings);
    
    // 3. Generar script de organización
    const scriptPath = generateOrganizationScript(groupedRecordings);
    
    // 4. Generar documentación
    const docPath = generateStructureDocumentation(groupedRecordings);
    
    // 5. Mostrar resumen final
    console.log(colors.cyan.bold('\n=== RESUMEN FINAL ===\n'));
    console.log(`📁 Estructura generada: FECHA → RADIO → GRABACIONES`);
    console.log(`📊 Total de archivos: ${Object.values(groupedRecordings).reduce((sum, day) => 
      sum + Object.values(day).reduce((daySum, radio) => daySum + radio.recordings.length, 0), 0)}`);
    console.log(`📅 Días procesados: ${Object.keys(groupedRecordings).length}`);
    console.log(`📻 Radios involucradas: ${new Set(Object.values(groupedRecordings).flatMap(day => Object.keys(day))).size}`);
    
    console.log(colors.yellow.bold('\n=== PRÓXIMOS PASOS ===\n'));
    console.log('1. El script de organización ha sido generado:');
    console.log(colors.yellow(`   📄 Script: ${scriptPath}`));
    console.log(colors.yellow(`   📚 Documentación: ${docPath}`));
    console.log('');
    console.log('2. Copiar el script al VPS:');
    console.log(colors.yellow(`   scp ${scriptPath} radioapp@213.199.39.147:/home/radioapp/`));
    console.log('');
    console.log('3. Conectar al VPS y ejecutar:');
    console.log(colors.yellow('   ssh radioapp@213.199.39.147'));
    console.log(colors.yellow('   cd /home/radioapp && bash organization-script.sh'));
    console.log('');
    console.log('4. Verificar la nueva estructura:');
    console.log(colors.yellow('   ls -la /home/radioapp/radio-recorder/recordings/'));
    console.log('');
    
    console.log(colors.green.bold('✅ ORGANIZACIÓN PREPARADA EXITOSAMENTE\n'));
    
    // Mostrar estructura que se creará
    console.log(colors.cyan.bold('ESTRUCTURA QUE SE CREARÁ:\n'));
    Object.entries(groupedRecordings).forEach(([date, radios]) => {
      console.log(colors.blue(`📁 ${date}/`));
      Object.entries(radios).forEach(([radioId, data]) => {
        console.log(colors.blue(`  📁 ${radioId}/ (${data.radioInfo.name})`));
        data.recordings.forEach(rec => {
          console.log(colors.blue(`    📄 ${rec.filename}`));
        });
      });
      console.log('');
    });
    
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