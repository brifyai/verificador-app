#!/usr/bin/env node

/**
 * DIAGNÓSTICO DEL PROBLEMA DE GRABACIONES
 * 
 * Analiza por qué las grabaciones no aparecen en la interfaz
 */

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

// Obtener grabaciones directamente del VPS
async function getVPSRecordings() {
  step('Obteniendo grabaciones del VPS...');
  
  try {
    const response = await fetch('http://213.199.39.147:5000/api/recordings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`VPS responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.recordings || [];
  } catch (err) {
    error(`Error conectando al VPS: ${err.message}`);
    return [];
  }
}

// Verificar si un archivo es problemático
function isProblematicFile(filename) {
  const problematicPatterns = [
    'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
    'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
    'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
  ];
  
  return problematicPatterns.includes(filename);
}

// Verificar si un archivo existe físicamente
async function checkFileExists(filename) {
  try {
    const response = await fetch(`http://213.199.39.147:5000/recordings/${filename}`, {
      method: 'HEAD'
    });
    
    return response.ok;
  } catch (err) {
    return false;
  }
}

// Analizar grabaciones del VPS
async function analyzeVPSRecordings() {
  step('Analizando grabaciones del VPS...');
  
  const recordings = await getVPSRecordings();
  
  if (recordings.length === 0) {
    warning('No hay grabaciones en el VPS');
    return;
  }
  
  console.log(colors.cyan(`\n📊 ANÁLISIS DE ${recordings.length} GRABACIONES:`));
  console.log('='.repeat(50));
  
  const analysis = {
    total: recordings.length,
    problematic: 0,
    valid: 0,
    existing: 0,
    missing: 0,
    details: []
  };
  
  for (const recording of recordings) {
    const filename = recording.filename;
    const isProblematic = isProblematicFile(filename);
    const exists = await checkFileExists(filename);
    
    const detail = {
      filename,
      isProblematic,
      exists,
      size: recording.file_size || 'N/A',
      date: recording.recorded_at || recording.created || 'N/A'
    };
    
    analysis.details.push(detail);
    
    if (isProblematic) {
      analysis.problematic++;
      console.log(colors.red(`🚫 PROBLEMÁTICO: ${filename}`));
      console.log(`   📏 Tamaño: ${detail.size}`);
      console.log(`   🕐 Fecha: ${detail.date}`);
      console.log(`   ❌ Existe: ${exists ? 'Sí' : 'No'}`);
    } else {
      analysis.valid++;
      if (exists) {
        analysis.existing++;
        console.log(colors.green(`✅ VÁLIDO: ${filename}`));
      } else {
        analysis.missing++;
        console.log(colors.yellow(`⚠️ FALTA: ${filename}`));
      }
      console.log(`   📏 Tamaño: ${detail.size}`);
      console.log(`   🕐 Fecha: ${detail.date}`);
      console.log(`   ✅ Existe: ${exists ? 'Sí' : 'No'}`);
    }
    console.log('');
  }
  
  return analysis;
}

// Mostrar resumen del diagnóstico
function showDiagnosisSummary(analysis) {
  console.log(colors.cyan.bold('\n=== RESUMEN DEL DIAGNÓSTICO ==='));
  console.log('');
  
  console.log(colors.yellow('📊 ESTADÍSTICAS:'));
  console.log(`   Total grabaciones: ${analysis.total}`);
  console.log(`   Problemáticas: ${analysis.problematic}`);
  console.log(`   Válidas: ${analysis.valid}`);
  console.log(`   Existen físicamente: ${analysis.existing}`);
  console.log(`   Faltan físicamente: ${analysis.missing}`);
  console.log('');
  
  console.log(colors.yellow('🔍 ANÁLISIS:'));
  
  if (analysis.problematic === analysis.total) {
    error('❌ TODAS las grabaciones son problemáticas y se excluyen automáticamente');
    console.log('   Esto explica por qué no aparecen en la interfaz.');
    console.log('   Las grabaciones que hiciste probablemente no se guardaron correctamente.');
  } else if (analysis.valid > 0 && analysis.missing === analysis.valid) {
    warning('⚠️ Las grabaciones válidas no existen físicamente');
    console.log('   El VPS tiene metadatos pero los archivos no están disponibles.');
    console.log('   Esto puede indicar un problema en el proceso de guardado.');
  } else if (analysis.valid > 0 && analysis.existing > 0) {
    success('✅ Hay grabaciones válidas que deberían aparecer');
    console.log('   Si no aparecen, puede ser un problema de sincronización.');
  }
  
  console.log('');
  
  console.log(colors.magenta.bold('💡 RECOMENDACIONES:'));
  
  if (analysis.problematic === analysis.total) {
    console.log('1. 🗑️ Limpiar archivos problemáticos del VPS');
    console.log('2. 🔄 Reiniciar el servicio de grabación');
    console.log('3. 🎯 Hacer una nueva grabación de prueba');
    console.log('4. 📊 Verificar que se guarde correctamente');
  } else if (analysis.missing > 0) {
    console.log('1. 🔍 Verificar el proceso de guardado de archivos');
    console.log('2. 📝 Revisar logs del VPS para errores');
    console.log('3. 🔄 Reiniciar el servicio si es necesario');
  }
  
  console.log('');
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== DIAGNÓSTICO DEL PROBLEMA DE GRABACIONES ===\n'));
  
  try {
    const analysis = await analyzeVPSRecordings();
    
    if (analysis) {
      showDiagnosisSummary(analysis);
    }
    
    console.log(colors.green.bold('\n✅ DIAGNÓSTICO COMPLETADO\n'));
    
  } catch (err) {
    error(`Error en diagnóstico: ${err.message}`);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}