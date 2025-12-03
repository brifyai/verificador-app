#!/usr/bin/env node

/**
 * SCRIPT DE ORGANIZACIÓN DE GRABACIONES
 * 
 * Organiza grabaciones en estructura: FECHA → RADIO → GRABACIONES
 * Utiliza las APIs existentes de la aplicación
 */

const axios = require('axios');
const fs = require('fs');

// Configuración
const API_BASE = 'http://localhost:3000/api';

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

// Función para extraer fecha del filename
function extractDate(filename) {
  const match = filename.match(/_(\d{8})_/);
  if (match) {
    const dateStr = match[1]; // YYYYMMDD
    return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
  }
  return new Date().toISOString().slice(0, 10);
}

// Función para extraer radio ID del filename
function extractRadioId(filename) {
  const match = filename.match(/^radio_([^_]+)_/);
  return match ? match[1] : 'unknown';
}

// Cliente de APIs
class APIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getRadios() {
    try {
      const response = await axios.get(`${this.baseUrl}/radios-direct`);
      return response.data?.radios || [];
    } catch (error) {
      error(`Error obteniendo radios: ${error.message}`);
      return [];
    }
  }

  async getRecordings() {
    try {
      const response = await axios.get(`${this.baseUrl}/recordings-from-supabase`);
      return response.data?.recordings || [];
    } catch (error) {
      error(`Error obteniendo grabaciones: ${error.message}`);
      return [];
    }
  }

  async getVPSRecordings() {
    try {
      const response = await axios.get(`${this.baseUrl}/vps-recording`);
      return response.data?.active_recordings || {};
    } catch (error) {
      error(`Error obteniendo grabaciones VPS: ${error.message}`);
      return {};
    }
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== ORGANIZACIÓN DE GRABACIONES ===\n'));
  
  try {
    const client = new APIClient(API_BASE);
    
    // 1. Obtener datos
    step('Obteniendo datos de las APIs...');
    const [radios, recordings, vpsRecordings] = await Promise.all([
      client.getRadios(),
      client.getRecordings(),
      client.getVPSRecordings()
    ]);
    
    success(`Obtenidos: ${radios.length} radios, ${recordings.length} grabaciones, ${Object.keys(vpsRecordings).length} activas`);
    
    // 2. Crear mapa de radios
    const radioMap = {};
    radios.forEach(radio => {
      radioMap[radio.id_radio] = radio;
    });
    
    // 3. Combinar todas las grabaciones
    const allRecordings = [
      ...recordings,
      ...Object.entries(vpsRecordings).map(([radioId, rec]) => ({
        radio_id: radioId,
        filename: `radio_${radioId}_${rec.recording_id || 'active'}_${new Date().toISOString().slice(0,10).replace(/-/g, '')}_${Date.now()}.mp3`,
        radio_name: rec.radio_name || `Radio ${radioId}`,
        recorded_at: rec.start_time || new Date().toISOString()
      }))
    ];
    
    if (allRecordings.length === 0) {
      warning('No hay grabaciones para organizar');
      return;
    }
    
    // 4. Agrupar por fecha y radio
    step('Agrupando grabaciones por fecha y radio...');
    const grouped = {};
    
    allRecordings.forEach(rec => {
      const date = extractDate(rec.filename);
      const radioId = rec.radio_id || extractRadioId(rec.filename);
      
      if (!grouped[date]) grouped[date] = {};
      if (!grouped[date][radioId]) grouped[date][radioId] = [];
      
      grouped[date][radioId].push({
        filename: rec.filename,
        radio_name: rec.radio_name || radioMap[radioId]?.name || `Radio ${radioId}`,
        recorded_at: rec.recorded_at
      });
    });
    
    // 5. Generar estructura local para pruebas
    step('Generando estructura local...');
    const testPath = './test-recordings';
    fs.rmSync(testPath, { recursive: true, force: true });
    fs.mkdirSync(testPath, { recursive: true });
    
    Object.entries(grouped).forEach(([date, radios]) => {
      Object.entries(radios).forEach(([radioId, recordings]) => {
        const dirPath = `${testPath}/${date}/${radioId}`;
        fs.mkdirSync(dirPath, { recursive: true });
        
        recordings.forEach(rec => {
          const filePath = `${dirPath}/${rec.filename}`;
          fs.writeFileSync(filePath, `Grabación de ${rec.radio_name} - ${rec.recorded_at}`);
        });
      });
    });
    
    // 6. Generar script para VPS
    step('Generando script para VPS...');
    const script = generateVPSScript(grouped, radioMap);
    fs.writeFileSync('./organize-vps-script.sh', script);
    fs.chmodSync('./organize-vps-script.sh', '755');
    
    // 7. Mostrar resumen
    console.log(colors.cyan.bold('\n=== RESUMEN ===\n'));
    console.log(`📁 Estructura: FECHA → RADIO → GRABACIONES`);
    console.log(`📊 Total archivos: ${allRecordings.length}`);
    console.log(`📅 Días: ${Object.keys(grouped).length}`);
    console.log(`📻 Radios: ${new Set(Object.values(grouped).flatMap(day => Object.keys(day))).size}`);
    console.log(`📂 Estructura local: ${testPath}`);
    console.log(`📜 Script VPS: organize-vps-script.sh`);
    
    console.log(colors.yellow.bold('\n=== ESTRUCTURA CREADA ===\n'));
    Object.entries(grouped).forEach(([date, radios]) => {
      console.log(`📅 ${date}/`);
      Object.entries(radios).forEach(([radioId, recordings]) => {
        const radioName = recordings[0]?.radio_name || radioMap[radioId]?.name || `Radio ${radioId}`;
        console.log(`  📻 ${radioId}/ (${radioName}) - ${recordings.length} archivos`);
      });
    });
    
    console.log(colors.yellow.bold('\n=== PRÓXIMOS PASOS ===\n'));
    console.log('1. Verificar estructura local:');
    console.log(`   ls -la ${testPath}/`);
    console.log('');
    console.log('2. Para organizar en VPS:');
    console.log('   scp organize-vps-script.sh radioapp@213.199.39.147:/home/radioapp/');
    console.log('   ssh radioapp@213.199.39.147');
    console.log('   cd /home/radioapp && bash organize-vps-script.sh');
    console.log('');
    
    success('Organización completada exitosamente');
    
  } catch (err) {
    error(`Error: ${err.message}`);
    process.exit(1);
  }
}

// Generar script para VPS
function generateVPSScript(grouped, radioMap) {
  const totalFiles = Object.values(grouped).reduce((sum, day) => 
    sum + Object.values(day).reduce((daySum, radio) => daySum + radio.length, 0), 0);
  
  return `#!/bin/bash

# Script de organización de grabaciones
# Estructura: FECHA → RADIO → GRABACIONES

BASE_PATH="/home/radioapp/radio-recorder"
RECORDINGS_PATH="\$BASE_PATH/recordings"

echo "==========================================="
echo "ORGANIZANDO GRABACIONES"
echo "Estructura: FECHA → RADIO → GRABACIONES"
echo "Total archivos: ${totalFiles}"
echo "==========================================="

# Crear estructura y mover archivos
${Object.entries(grouped).map(([date, radios]) => `
echo "→ Organizando fecha: ${date}"
mkdir -p "$RECORDINGS_PATH/${date}"
${Object.entries(radios).map(([radioId, recordings]) => `
echo "  → Radio: ${radioId} (${recordings[0]?.radio_name || radioMap[radioId]?.name || `Radio ${radioId}`}) - ${recordings.length} archivos"
mkdir -p "$RECORDINGS_PATH/${date}/${radioId}"
${recordings.map(rec => `
if [ -f "$RECORDINGS_PATH/${rec.filename}" ]; then
  mv "$RECORDINGS_PATH/${rec.filename}" "$RECORDINGS_PATH/${date}/${radioId}/"
  echo "    ✓ Movido: ${rec.filename}"
fi`).join('\n')}
`).join('\n')}
`).join('\n')}

echo ""
echo "✓ Organización completada"
echo "✓ Permisos establecidos"
chown -R radioapp:radioapp "$BASE_PATH"
chmod -R 755 "$BASE_PATH"

echo "==========================================="
echo "ESTRUCTURA FINAL:"
${Object.entries(grouped).map(([date, radios]) => `
echo "  $RECORDINGS_PATH/${date}/"
${Object.entries(radios).map(([radioId, recordings]) => `
echo "    └── ${radioId}/ - ${recordings.length} archivos"`).join('')}
`).join('')}
echo "==========================================="
`;
}

// Ejecutar
if (require.main === module) {
  main();
}