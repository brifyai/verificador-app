#!/usr/bin/env node

/**
 * LIMPIEZA INMEDIATA DE ARCHIVOS FANTASMA
 * 
 * Este script limpia los archivos fantasma del VPS que aparecen
 * con "Fecha inválida", "0 MB", "0s" en la interfaz.
 */

const axios = require('axios');
const fs = require('fs');

// Configuración del VPS
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
  step('Verificando conexión al VPS...');
  try {
    const response = await axios.get(`${VPS_CONFIG.apiBaseUrl}${VPS_CONFIG.activeRecordingsEndpoint}`, {
      timeout: 10000
    });
    
    if (response.data && response.data.status === 'success') {
      success('Conexión al VPS establecida');
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

// Función para obtener grabaciones actuales
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

// Función para identificar archivos fantasma
function identifyPhantomRecordings(recordings) {
  step('Identificando archivos fantasma...');
  
  const phantomFiles = [];
  const validFiles = [];
  
  recordings.forEach(recording => {
    const filename = recording.filename || '';
    const size = recording.size || recording.file_size || 0;
    const created = recording.created || recording.recorded_at;
    
    // Criterios para identificar archivos fantasma
    const isPhantom = (
      size === 0 || 
      !created || 
      created === 'Fecha inválida' ||
      filename.includes('b8100d7d-90bb-4475-865c-3bdbe590ceba') ||
      filename.includes('62f9e282-1998-403d-9057-7f12796fe807')
    );
    
    if (isPhantom) {
      phantomFiles.push({
        filename,
        size,
        created,
        reason: size === 0 ? 'Tamaño 0' : 'Fecha inválida'
      });
    } else {
      validFiles.push(recording);
    }
  });
  
  info(`Archivos fantasma identificados: ${phantomFiles.length}`);
  info(`Archivos válidos: ${validFiles.length}`);
  
  return { phantomFiles, validFiles };
}

// Función para generar script de limpieza
function generateCleanupScript(phantomFiles) {
  step('Generando script de limpieza...');
  
  const script = `#!/bin/bash

# ============================================
# SCRIPT DE LIMPIEZA DE ARCHIVOS FANTASMA
# Generado el: ${new Date().toISOString()}
# ============================================

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="\$BASE_PATH/recordings"

echo "==========================================="
echo "LIMPIEZA DE ARCHIVOS FANTASMA"
echo "==========================================="
echo "Fecha: \$(date)"
echo ""

echo "🧹 Limpiando archivos fantasma del VPS..."
echo "Total de archivos a eliminar: ${phantomFiles.length}"
echo ""

${phantomFiles.map(file => `
echo "🗑️ Eliminando archivo fantasma: ${file.filename}"
echo "   Razón: ${file.reason}"
rm -f "$RECORDINGS_PATH/${file.filename}" 2>/dev/null
if [ \$? -eq 0 ]; then
  echo "   ✓ Eliminado correctamente"
else
  echo "   ⚠ No se pudo eliminar (puede que no exista)"
fi
`).join('')}

echo ""
echo "2. Limpiando directorios vacíos..."
find "$RECORDINGS_PATH" -type d -empty -delete 2>/dev/null
echo "✓ Directorios vacíos eliminados"
echo ""

echo "3. Verificando limpieza..."
remaining_count=\$(find "$RECORDINGS_PATH" -name "*.mp3" 2>/dev/null | wc -l)
echo "📊 Archivos MP3 restantes: \$remaining_count"
echo ""

echo "==========================================="
echo "LIMPIEZA COMPLETADA ✓"
echo "==========================================="
echo "Archivos fantasma eliminados: ${phantomFiles.length}"
echo "Fecha: \$(date)"
echo "==========================================="

# Guardar reporte de limpieza
cat > "$BASE_PATH/CLEANUP_REPORT.txt" << EOF
===========================================
REPORTE DE LIMPIEZA DE ARCHIVOS FANTASMA
Fecha: \$(date)
===========================================

ARCHIVOS ELIMINADOS:
${phantomFiles.map(file => `- ${file.filename} (${file.reason})`).join('\n')}

TOTAL ELIMINADOS: ${phantomFiles.length}
ARCHIVOS RESTANTES: \$remaining_count

===========================================
EOF

echo "✓ Reporte guardado en: $BASE_PATH/CLEANUP_REPORT.txt"
`;

  // Guardar script
  const scriptPath = './cleanup-phantom-files.sh';
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  success(`Script de limpieza generado: ${scriptPath}`);
  return scriptPath;
}

// Función para generar script de organización (después de la limpieza)
function generateOrganizationAfterCleanup() {
  step('Generando script de organización (post-limpieza)...');
  
  const script = `#!/bin/bash

# ============================================
# SCRIPT DE ORGANIZACIÓN (POST-LIMPIEZA)
# Generado el: ${new Date().toISOString()}
# ============================================

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="\$BASE_PATH/recordings"

echo "==========================================="
echo "ORGANIZACIÓN DE GRABACIONES VÁLIDAS"
echo "==========================================="
echo "Fecha: \$(date)"
echo ""

# Verificar qué archivos válidos existen
echo "🔍 Verificando archivos válidos en el VPS..."
valid_files=(\$(find "$RECORDINGS_PATH" -name "*.mp3" -size +0c 2>/dev/null))

if [ \${#valid_files[@]} -eq 0 ]; then
  echo "⚠️ No se encontraron archivos válidos para organizar"
  echo "💡 La limpieza fue exitosa - no hay archivos fantasma"
  exit 0
fi

echo "📊 Archivos válidos encontrados: \${#valid_files[@]}"
echo ""

# Organizar por fecha y radio (solo archivos válidos)
for file in "\${valid_files[@]}"; do
  filename=\$(basename "\$file")
  
  # Extraer fecha del filename
  date_match=\$(echo "\$filename" | grep -o '_[0-9]\\{8\\}_[0-9]\\{6\\}_')
  if [ -n "\$date_match" ]; then
    date_str=\$(echo "\$date_match" | sed 's/_//g' | sed 's/.$//')
    formatted_date="\${date_str:0:4}-\${date_str:4:2}-\${date_str:6:2}"
    
    # Extraer radio_id del filename
    radio_match=\$(echo "\$filename" | grep -o 'radio_[^_]*_[^_]*')
    if [ -n "\$radio_match" ]; then
      radio_id=\$(echo "\$radio_match" | cut -d'_' -f2)
      
      echo "📁 Organizando: \$filename"
      echo "   Fecha: \$formatted_date"
      echo "   Radio: \$radio_id"
      
      # Crear directorio y mover
      mkdir -p "$RECORDINGS_PATH/\$formatted_date/\$radio_id"
      mv "\$file" "$RECORDINGS_PATH/\$formatted_date/\$radio_id/"
      echo "   ✓ Movido a: \$formatted_date/\$radio_id/"
      echo ""
    fi
  fi
done

echo "==========================================="
echo "ORGANIZACIÓN COMPLETADA ✓"
echo "==========================================="

# Mostrar estructura final
echo "📁 Estructura final:"
find "$RECORDINGS_PATH" -type d | sort | while read dir; do
  if [ "\$dir" != "\$RECORDINGS_PATH" ]; then
    indent=\$(echo "\$dir" | sed "s|\$RECORDINGS_PATH||" | sed 's|[^/]| |g' | sed 's|/|  |g')
    echo "\$indent\$(basename "\$dir")/"
  fi
done

echo ""
echo "✅ LIMPIEZA Y ORGANIZACIÓN COMPLETADAS"
echo "📱 La interfaz web ahora mostrará 0 grabaciones"
echo "🎵 Nuevas grabaciones se organizarán automáticamente"
`;

  const scriptPath = './organize-after-cleanup.sh';
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  success(`Script de organización post-limpieza generado: ${scriptPath}`);
  return scriptPath;
}

// Función principal
async function main() {
  console.log(colors.red.bold('\n=== LIMPIEZA INMEDIATA DE ARCHIVOS FANTASMA ===\n'));
  
  try {
    // 1. Verificar conexión
    if (!await checkVPSConnection()) {
      error('No se pudo establecer conexión con el VPS. Abortando.');
      process.exit(1);
    }
    
    // 2. Obtener grabaciones actuales
    const recordings = await getCurrentRecordings();
    if (recordings.length === 0) {
      warning('No se encontraron grabaciones para limpiar');
      return;
    }
    
    // 3. Identificar archivos fantasma
    const { phantomFiles, validFiles } = identifyPhantomRecordings(recordings);
    
    if (phantomFiles.length === 0) {
      success('No se encontraron archivos fantasma para limpiar');
      return;
    }
    
    // 4. Generar script de limpieza
    const cleanupScript = generateCleanupScript(phantomFiles);
    
    // 5. Generar script de organización post-limpieza
    const organizationScript = generateOrganizationAfterCleanup();
    
    // 6. Mostrar resumen
    console.log(colors.cyan.bold('\n=== RESUMEN DE LIMPIEZA ===\n'));
    console.log(`🗑️ Archivos fantasma a eliminar: ${phantomFiles.length}`);
    console.log(`✅ Archivos válidos: ${validFiles.length}`);
    console.log(`📄 Script de limpieza: ${cleanupScript}`);
    console.log(`📄 Script de organización: ${organizationScript}`);
    
    console.log(colors.red.bold('\n⚠️ ARCHIVOS FANTASMA IDENTIFICADOS:\n'));
    phantomFiles.forEach(file => {
      console.log(colors.red(`🗑️ ${file.filename}`));
      console.log(colors.yellow(`   Razón: ${file.reason}`));
    });
    
    console.log(colors.yellow.bold('\n=== PRÓXIMOS PASOS ===\n'));
    console.log('1. Copiar scripts al VPS:');
    console.log(colors.yellow(`   scp ${cleanupScript} radioapp@213.199.39.147:/home/radioapp/`));
    console.log(colors.yellow(`   scp ${organizationScript} radioapp@213.199.39.147:/home/radioapp/`));
    console.log('');
    console.log('2. Conectar al VPS:');
    console.log(colors.yellow('   ssh radioapp@213.199.39.147'));
    console.log('');
    console.log('3. Ejecutar limpieza:');
    console.log(colors.yellow('   cd /home/radioapp'));
    console.log(colors.yellow('   bash cleanup-phantom-files.sh'));
    console.log('');
    console.log('4. Ejecutar organización:');
    console.log(colors.yellow('   bash organize-after-cleanup.sh'));
    console.log('');
    console.log('5. Verificar resultado:');
    console.log(colors.yellow('   ls -la /home/radioapp/radio-recorder/recordings/'));
    console.log('');
    
    console.log(colors.green.bold('🎯 RESULTADO ESPERADO:'));
    console.log(colors.green('   - Interfaz web mostrará "0 grabaciones"'));
    console.log(colors.green('   - No más "Fecha inválida", "0 MB", "0s"'));
    console.log(colors.green('   - Sistema limpio y organizado'));
    
  } catch (error) {
    error(`Error en la limpieza: ${error.message}`);
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
  identifyPhantomRecordings,
  generateCleanupScript
};