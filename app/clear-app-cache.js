#!/usr/bin/env node

/**
 * LIMPIAR CACHÉ DE LA APLICACIÓN Y FORZAR ACTUALIZACIÓN
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

// Verificar estado actual del VPS
async function checkVPS() {
  step('Verificando estado actual del VPS...');
  
  try {
    const response = await fetch('http://213.199.39.147:5000/api/recordings', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const data = await response.json();
    
    console.log(colors.cyan('📡 Estado del VPS:'));
    console.log(`   Count: ${data.count}`);
    console.log(`   Recordings: ${data.recordings?.length || 0}`);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('   Archivos encontrados:');
      data.recordings.forEach((rec, i) => {
        console.log(`     ${i + 1}. ${rec.filename}`);
      });
    } else {
      console.log('   ✅ Sin grabaciones (correcto)');
    }
    
    return data;
  } catch (err) {
    error(`Error verificando VPS: ${err.message}`);
    return { count: 0, recordings: [] };
  }
}

// Verificar estado de la aplicación
async function checkApp() {
  step('Verificando estado de la aplicación...');
  
  try {
    const response = await fetch('http://localhost:3000/api/recordings-from-supabase', {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Force-Refresh': 'true'
      }
    });
    const data = await response.json();
    
    console.log(colors.cyan('📱 Estado de la aplicación:'));
    console.log(`   Count: ${data.count}`);
    console.log(`   Recordings: ${data.recordings?.length || 0}`);
    console.log(`   Source: ${data.source}`);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('   Archivos mostrados:');
      data.recordings.forEach((rec, i) => {
        console.log(`     ${i + 1}. ${rec.filename}`);
        console.log(`        Radio: ${rec.radio_name || 'N/A'}`);
      });
    } else {
      console.log('   ✅ Sin grabaciones mostradas (correcto)');
    }
    
    return data;
  } catch (err) {
    error(`Error verificando aplicación: ${err.message}`);
    return { count: 0, recordings: [] };
  }
}

// Forzar limpieza de caché
async function forceCacheClear() {
  step('Forzando limpieza de caché...');
  
  try {
    // Hacer múltiples requests con headers anti-caché
    const urls = [
      'http://localhost:3000/api/recordings-from-supabase',
      'http://localhost:3000/api/recording-vps-fixed',
      'http://localhost:3000/api/vps-recording'
    ];
    
    for (const url of urls) {
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Force-Refresh': Date.now().toString()
        }
      });
      
      console.log(`   ✅ Cache cleared for: ${url}`);
    }
    
    success('Caché limpiado exitosamente');
  } catch (err) {
    warning(`Error limpiando caché: ${err.message}`);
  }
}

// Verificar después de la limpieza
async function verifyAfterClear() {
  step('Verificando después de limpiar caché...');
  
  const vpsData = await checkVPS();
  const appData = await checkApp();
  
  console.log(colors.cyan.bold('\n=== COMPARACIÓN DESPUÉS DE LIMPIAR CACHÉ ==='));
  console.log('');
  
  console.log(colors.yellow('📊 RESULTADOS:'));
  console.log(`   VPS: ${vpsData.recordings?.length || 0} grabaciones`);
  console.log(`   Aplicación: ${appData.recordings?.length || 0} grabaciones`);
  console.log('');
  
  if (vpsData.recordings?.length === 0 && appData.recordings?.length === 0) {
    success('🎉 ¡SISTEMA COMPLETAMENTE LIMPIO!');
    console.log('✅ VPS: Sin grabaciones');
    console.log('✅ Aplicación: Sin grabaciones');
    console.log('✅ Caché: Limpiado');
    console.log('');
    console.log(colors.green('🚀 LISTO PARA NUEVAS GRABACIONES'));
    console.log('Puedes hacer una nueva grabación en http://localhost:3000/radios');
    console.log('y aparecerá en http://localhost:3000/grabaciones');
  } else if (vpsData.recordings?.length === appData.recordings?.length) {
    success('✅ SINCRONIZACIÓN CORRECTA');
    console.log('VPS y aplicación están sincronizados.');
  } else {
    warning('⚠️ AÚN HAY DESINCRONIZACIÓN');
    console.log('Puede requerir reiniciar la aplicación.');
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== LIMPIEZA DE CACHÉ Y VERIFICACIÓN ===\n'));
  
  try {
    // Verificar estado antes
    await checkVPS();
    await checkApp();
    
    console.log('');
    
    // Forzar limpieza de caché
    await forceCacheClear();
    
    console.log('');
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar después
    await verifyAfterClear();
    
  } catch (err) {
    error(`Error en limpieza: ${err.message}`);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}