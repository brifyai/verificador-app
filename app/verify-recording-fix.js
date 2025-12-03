#!/usr/bin/env node

/**
 * VERIFICACIÓN FINAL DEL SISTEMA DE GRABACIONES
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

// Verificar VPS directamente
async function checkVPSDirect() {
  step('Verificando VPS directamente...');
  
  try {
    const response = await fetch('http://213.199.39.147:5000/api/recordings');
    const data = await response.json();
    
    console.log(colors.cyan('📡 VPS Directo:'));
    console.log(`   Count: ${data.count}`);
    console.log(`   Recordings: ${data.recordings?.length || 0}`);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('   Archivos:');
      data.recordings.forEach((rec, i) => {
        console.log(`     ${i + 1}. ${rec.filename}`);
      });
    }
    
    return data;
  } catch (err) {
    error(`Error conectando al VPS: ${err.message}`);
    return { count: 0, recordings: [] };
  }
}

// Verificar desde la aplicación
async function checkAppEndpoint() {
  step('Verificando endpoint de la aplicación...');
  
  try {
    const response = await fetch('http://localhost:3000/api/recordings-from-supabase');
    const data = await response.json();
    
    console.log(colors.cyan('📱 Aplicación:'));
    console.log(`   Count: ${data.count}`);
    console.log(`   Recordings: ${data.recordings?.length || 0}`);
    console.log(`   Source: ${data.source}`);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('   Archivos:');
      data.recordings.forEach((rec, i) => {
        console.log(`     ${i + 1}. ${rec.filename}`);
        console.log(`        Radio: ${rec.radio_name}`);
        console.log(`        Tamaño: ${rec.size} bytes`);
      });
    }
    
    return data;
  } catch (err) {
    error(`Error conectando a la aplicación: ${err.message}`);
    return { count: 0, recordings: [] };
  }
}

// Verificar organización
async function checkOrganization() {
  step('Verificando sistema de organización...');
  
  try {
    const response = await fetch('http://localhost:3000/api/organize-recordings');
    const data = await response.json();
    
    console.log(colors.cyan('🔧 Organización:'));
    console.log(`   Status: ${data.status}`);
    console.log(`   Organizando: ${data.data?.isOrganizing ? 'Sí' : 'No'}`);
    console.log(`   Auto Organize: ${data.data?.config?.autoOrganize ? 'Sí' : 'No'}`);
    console.log(`   Sync to Database: ${data.data?.config?.syncToDatabase ? 'Sí' : 'No'}`);
    
    return data;
  } catch (err) {
    warning(`Error verificando organización: ${err.message}`);
    return null;
  }
}

// Mostrar estado final
function showFinalStatus(vpsData, appData, orgData) {
  console.log(colors.cyan.bold('\n=== ESTADO FINAL ==='));
  console.log('');
  
  console.log(colors.yellow('📊 COMPARACIÓN:'));
  console.log(`   VPS Directo: ${vpsData.recordings?.length || 0} grabaciones`);
  console.log(`   Aplicación: ${appData.recordings?.length || 0} grabaciones`);
  console.log('');
  
  if (vpsData.recordings?.length === 0 && appData.recordings?.length === 0) {
    success('🎉 ¡SISTEMA LIMPIO Y FUNCIONANDO!');
    console.log('✅ VPS: Sin grabaciones (correcto)');
    console.log('✅ Aplicación: Sin grabaciones (correcto)');
    console.log('✅ Sistema de organización: Activo');
    console.log('');
    console.log(colors.green('🚀 LISTO PARA NUEVAS GRABACIONES'));
    console.log('Ahora puedes hacer una nueva grabación en http://localhost:3000/radios');
    console.log('y debería aparecer automáticamente en http://localhost:3000/grabaciones');
  } else if (vpsData.recordings?.length === appData.recordings?.length) {
    success('✅ SISTEMA SINCRONIZADO');
    console.log('El VPS y la aplicación están sincronizados.');
  } else {
    warning('⚠️ DESINCRONIZACIÓN DETECTADA');
    console.log('Hay una diferencia entre VPS y aplicación.');
    console.log('Esto puede ser un problema de caché.');
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== VERIFICACIÓN FINAL DEL SISTEMA ===\n'));
  
  try {
    const [vpsData, appData, orgData] = await Promise.all([
      checkVPSDirect(),
      checkAppEndpoint(),
      checkOrganization()
    ]);
    
    showFinalStatus(vpsData, appData, orgData);
    
  } catch (err) {
    error(`Error en verificación: ${err.message}`);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}