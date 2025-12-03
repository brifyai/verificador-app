#!/usr/bin/env node

/**
 * LIMPIEZA DE CACHÉ Y REINICIO DEL VPS
 * 
 * Este script limpia la caché del VPS y lo reinicia para resolver
 * el problema de las grabaciones que no se guardan.
 */

const axios = require('axios');
const fs = require('fs');

// Configuración del VPS
const VPS_CONFIG = {
  apiBaseUrl: 'http://213.199.39.147:5000/api',
  recordingsEndpoint: '/recordings',
  activeRecordingsEndpoint: '/active-recordings',
  restartEndpoint: '/restart'
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

// Función para limpiar caché del VPS
async function clearVPSCache() {
  step('Limpiando caché del VPS...');
  
  try {
    // Intentar limpiar caché vía API
    const response = await axios.post(`${VPS_CONFIG.apiBaseUrl}/clear-cache`, {}, {
      timeout: 10000
    });
    
    if (response.data && response.data.status === 'success') {
      success('Caché del VPS limpiado exitosamente');
      return true;
    } else {
      warning('No se pudo limpiar caché vía API');
      return false;
    }
  } catch (err) {
    warning(`Error limpiando caché: ${err.message}`);
    return false;
  }
}

// Función para verificar estado antes del reinicio
async function checkVPSStatus() {
  step('Verificando estado actual del VPS...');
  
  try {
    const response = await axios.get(`${VPS_CONFIG.apiBaseUrl}${VPS_CONFIG.activeRecordingsEndpoint}`, {
      timeout: 5000
    });
    
    if (response.data && response.data.status === 'success') {
      const activeCount = response.data.count || 0;
      info(`Grabaciones activas: ${activeCount}`);
      return true;
    }
    return false;
  } catch (err) {
    error(`Error verificando estado: ${err.message}`);
    return false;
  }
}

// Función para generar script de limpieza manual
function generateManualCleanupScript() {
  step('Generando script de limpieza manual...');
  
  const script = `#!/bin/bash

# ============================================
# LIMPIEZA MANUAL DEL VPS
# Generado el: ${new Date().toISOString()}
# ============================================

echo "==========================================="
echo "LIMPIEZA MANUAL DEL VPS"
echo "==========================================="

# Conectar al VPS
echo "🔗 Conectando al VPS..."
ssh radioapp@213.199.39.147 << 'EOF'

echo "🧹 Limpiando caché y archivos temporales..."

# Limpiar archivos temporales
cd /home/radioapp/radio-recorder
rm -rf temp/* 2>/dev/null
rm -rf logs/*.tmp 2>/dev/null
rm -rf cache/* 2>/dev/null

# Limpiar archivos de grabación antiguos (más de 7 días)
find recordings/ -name "*.mp3" -mtime +7 -delete 2>/dev/null

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
sudo systemctl restart radio-recorder 2>/dev/null || echo "Servicio no encontrado"

# Verificar estado
echo "📊 Verificando estado..."
ps aux | grep -i radio | grep -v grep || echo "No hay procesos de radio ejecutándose"

# Mostrar archivos actuales
echo "📁 Archivos actuales en recordings/:"
ls -la recordings/ 2>/dev/null || echo "Directorio recordings no encontrado"

echo "✅ Limpieza completada"
EOF

echo "✅ Script de limpieza manual generado"
`;

  const scriptPath = './manual-vps-cleanup.sh';
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  success(`Script de limpieza manual generado: ${scriptPath}`);
  return scriptPath;
}

// Función para generar comandos de diagnóstico
function generateDiagnosticCommands() {
  step('Generando comandos de diagnóstico...');
  
  const commands = `# COMANDOS DE DIAGNÓSTICO MANUAL

## 1. Conectar al VPS
ssh radioapp@213.199.39.147

## 2. Verificar estado del servicio
cd /home/radioapp/radio-recorder
ps aux | grep -i radio
systemctl status radio-recorder 2>/dev/null || echo "systemd no disponible"

## 3. Verificar archivos de grabación
ls -la recordings/
find recordings/ -name "*.mp3" -type f

## 4. Verificar logs recientes
tail -f logs/radio-recorder.log 2>/dev/null || echo "Log no encontrado"
journalctl -u radio-recorder -n 50 2>/dev/null || echo "journalctl no disponible"

## 5. Verificar espacio en disco
df -h
du -sh recordings/

## 6. Reiniciar manualmente (si es necesario)
sudo systemctl restart radio-recorder 2>/dev/null
# O kill y reiniciar proceso manualmente

## 7. Probar grabación
# Ir a http://localhost:3000/radios y hacer una grabación de prueba
# Luego verificar si aparece en:
ls -la recordings/
`;

  const commandsPath = './vps-diagnostic-commands.md';
  fs.writeFileSync(commandsPath, commands);
  
  success(`Comandos de diagnóstico generados: ${commandsPath}`);
  return commandsPath;
}

// Función principal
async function main() {
  console.log(colors.red.bold('\n=== LIMPIEZA DE CACHÉ Y REINICIO DEL VPS ===\n'));
  
  try {
    // 1. Verificar estado actual
    await checkVPSStatus();
    
    // 2. Intentar limpiar caché
    const cacheCleared = await clearVPSCache();
    
    // 3. Generar script de limpieza manual
    const manualScript = generateManualCleanupScript();
    
    // 4. Generar comandos de diagnóstico
    const diagnosticCommands = generateDiagnosticCommands();
    
    // 5. Mostrar resumen
    console.log(colors.cyan.bold('\n=== RESUMEN ===\n'));
    console.log(`🟡 Caché limpiado: ${cacheCleared ? 'Sí' : 'No (requiere intervención manual)'}`);
    console.log(`📄 Script manual: ${manualScript}`);
    console.log(`📋 Comandos diagnóstico: ${diagnosticCommands}`);
    
    console.log(colors.yellow.bold('\n=== PRÓXIMOS PASOS ===\n'));
    
    if (!cacheCleared) {
      console.log(colors.red('⚠️ LIMPIEZA MANUAL REQUERIDA:'));
      console.log('');
      console.log('1. Ejecutar script de limpieza manual:');
      console.log(colors.yellow(`   bash ${manualScript}`));
      console.log('');
      console.log('2. O ejecutar comandos manualmente:');
      console.log(colors.yellow('   ssh radioapp@213.199.39.147'));
      console.log(colors.yellow('   cd /home/radioapp/radio-recorder'));
      console.log(colors.yellow('   rm -rf temp/* cache/* logs/*.tmp'));
      console.log(colors.yellow('   sudo systemctl restart radio-recorder'));
      console.log('');
    }
    
    console.log(colors.blue('🔍 DIAGNÓSTICO:'));
    console.log('   - Las nuevas grabaciones no se guardaron en el VPS');
    console.log('   - El VPS puede tener problemas de caché o servicio');
    console.log('   - Se requiere limpieza manual del VPS');
    console.log('');
    
    console.log(colors.green('✅ DESPUÉS DE LA LIMPIEZA:'));
    console.log('   1. Ir a http://localhost:3000/radios');
    console.log('   2. Hacer una grabación de prueba');
    console.log('   3. Verificar que aparece en http://localhost:3000/grabaciones');
    console.log('');
    
    console.log(colors.magenta('📖 DOCUMENTACIÓN:'));
    console.log(`   - Ver ${diagnosticCommands} para comandos detallados`);
    console.log(`   - Ver ${manualScript} para limpieza automatizada`);
    
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
  clearVPSCache,
  generateManualCleanupScript
};