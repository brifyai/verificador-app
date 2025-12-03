#!/usr/bin/env node

/**
 * SCRIPT DE VERIFICACIÓN DE SINCRONIZACIÓN CON VPS
 * 
 * Este script verifica específicamente la sincronización entre:
 * - VPS (servidor de grabaciones)
 * - Base de datos local (Supabase)
 * - Sistema de organización implementado
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

// Función para obtener grabaciones del VPS
async function getVPSRecordings() {
  step('Conectando al VPS para obtener grabaciones...');
  
  try {
    const response = await fetch('http://213.199.39.147:5000/api/recordings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Error del VPS: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const recordings = data.recordings || [];
    
    success(`VPS conectado: ${recordings.length} grabaciones encontradas`);
    return recordings;
  } catch (error) {
    error(`Error conectando al VPS: ${error.message}`);
    return [];
  }
}

// Función para obtener grabaciones de la base de datos
async function getDatabaseRecordings() {
  step('Consultando base de datos local...');
  
  try {
    const response = await fetch('http://localhost:3000/api/recordings-from-supabase');
    
    if (!response.ok) {
      throw new Error(`Error consultando BD: ${response.status}`);
    }

    const data = await response.json();
    const recordings = data.recordings || [];
    
    success(`Base de datos consultada: ${recordings.length} grabaciones encontradas`);
    return recordings;
  } catch (error) {
    error(`Error consultando base de datos: ${error.message}`);
    return [];
  }
}

// Función para obtener radios de la base de datos
async function getDatabaseRadios() {
  step('Consultando radios en base de datos...');
  
  try {
    const response = await fetch('http://localhost:3000/api/radios-direct');
    
    if (!response.ok) {
      throw new Error(`Error consultando radios: ${response.status}`);
    }

    const data = await response.json();
    const radios = data.data || [];
    
    success(`Radios consultadas: ${radios.length} radios encontradas`);
    return radios;
  } catch (error) {
    error(`Error consultando radios: ${error.message}`);
    return [];
  }
}

// Función para analizar sincronización
function analyzeSync(vpsRecordings, dbRecordings, radios) {
  step('Analizando estado de sincronización...');
  
  // Archivos problemáticos conocidos
  const problematicFiles = [
    'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
    'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
    'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
  ];

  // Filtrar VPS recordings (excluyendo problemáticos)
  const validVPSRecordings = vpsRecordings.filter(rec => 
    !problematicFiles.includes(rec.filename)
  );

  // Extraer radio_ids del VPS
  const vpsRadioIds = new Set();
  validVPSRecordings.forEach(rec => {
    const match = rec.filename.match(/^radio_([^_]+)_/);
    if (match) {
      vpsRadioIds.add(match[1]);
    }
  });

  // Extraer radio_ids de la base de datos
  const dbRadioIds = new Set();
  dbRecordings.forEach(rec => {
    if (rec.radio_id) {
      dbRadioIds.add(rec.radio_id.toString());
    }
  });

  // Verificar mapeo de radios
  const radioMappings = {};
  radios.forEach(radio => {
    if (radio.vps_id) {
      radioMappings[radio.vps_id] = {
        id: radio.id,
        name: radio.name,
        vps_id: radio.vps_id
      };
    }
  });

  const syncStatus = {
    vps: {
      total: vpsRecordings.length,
      valid: validVPSRecordings.length,
      problematic: vpsRecordings.length - validVPSRecordings.length,
      radioIds: Array.from(vpsRadioIds)
    },
    database: {
      total: dbRecordings.length,
      radioIds: Array.from(dbRadioIds)
    },
    mappings: radioMappings,
    sync: {
      vpsRecordingsInDB: 0,
      missingInDB: [],
      extraInDB: []
    }
  };

  // Verificar qué grabaciones del VPS están en la BD
  validVPSRecordings.forEach(vpsRec => {
    const existsInDB = dbRecordings.some(dbRec => 
      dbRec.filename === vpsRec.filename
    );
    
    if (existsInDB) {
      syncStatus.sync.vpsRecordingsInDB++;
    } else {
      syncStatus.sync.missingInDB.push(vpsRec.filename);
    }
  });

  // Verificar qué grabaciones están en BD pero no en VPS
  dbRecordings.forEach(dbRec => {
    const existsInVPS = validVPSRecordings.some(vpsRec => 
      vpsRec.filename === dbRec.filename
    );
    
    if (!existsInVPS) {
      syncStatus.sync.extraInDB.push(dbRec.filename);
    }
  });

  return syncStatus;
}

// Función para mostrar el reporte de sincronización
function showSyncReport(syncStatus) {
  console.log(colors.cyan.bold('\n=== REPORTE DE SINCRONIZACIÓN VPS ↔ BASE DE DATOS ===\n'));
  
  // Estado del VPS
  console.log(colors.yellow('📡 ESTADO DEL VPS:'));
  console.log(`   Total grabaciones: ${syncStatus.vps.total}`);
  console.log(`   Válidas: ${syncStatus.vps.valid}`);
  console.log(`   Problemáticas: ${syncStatus.vps.problematic}`);
  console.log(`   Radio IDs únicos: ${syncStatus.vps.radioIds.length}`);
  if (syncStatus.vps.radioIds.length > 0) {
    console.log(`   IDs: ${syncStatus.vps.radioIds.join(', ')}`);
  }
  console.log('');

  // Estado de la base de datos
  console.log(colors.yellow('💾 ESTADO DE BASE DE DATOS:'));
  console.log(`   Total grabaciones: ${syncStatus.database.total}`);
  console.log(`   Radio IDs únicos: ${syncStatus.database.radioIds.length}`);
  if (syncStatus.database.radioIds.length > 0) {
    console.log(`   IDs: ${syncStatus.database.radioIds.join(', ')}`);
  }
  console.log('');

  // Mapeo de radios
  console.log(colors.yellow('🔗 MAPEO DE RADIOS (VPS ↔ BD):'));
  const mappings = Object.entries(syncStatus.mappings);
  if (mappings.length > 0) {
    mappings.forEach(([vpsId, radio]) => {
      console.log(`   VPS ID "${vpsId}" → BD ID ${radio.id} (${radio.name})`);
    });
  } else {
    console.log('   ⚠️ No hay mapeos VPS ID → BD ID configurados');
  }
  console.log('');

  // Estado de sincronización
  console.log(colors.yellow('🔄 ESTADO DE SINCRONIZACIÓN:'));
  console.log(`   Grabaciones VPS en BD: ${syncStatus.sync.vpsRecordingsInDB}/${syncStatus.vps.valid}`);
  console.log(`   Faltantes en BD: ${syncStatus.sync.missingInDB.length}`);
  console.log(`   Extras en BD: ${syncStatus.sync.extraInDB.length}`);
  
  if (syncStatus.sync.missingInDB.length > 0) {
    console.log('');
    console.log(colors.red('⚠️ GRABACIONES DEL VPS QUE FALTAN EN BD:'));
    syncStatus.sync.missingInDB.slice(0, 5).forEach((filename, index) => {
      console.log(`   ${index + 1}. ${filename}`);
    });
    if (syncStatus.sync.missingInDB.length > 5) {
      console.log(`   ... y ${syncStatus.sync.missingInDB.length - 5} más`);
    }
  }

  if (syncStatus.sync.extraInDB.length > 0) {
    console.log('');
    console.log(colors.blue('ℹ️ GRABACIONES EN BD QUE NO ESTÁN EN VPS:'));
    syncStatus.sync.extraInDB.slice(0, 5).forEach((filename, index) => {
      console.log(`   ${index + 1}. ${filename}`);
    });
    if (syncStatus.sync.extraInDB.length > 5) {
      console.log(`   ... y ${syncStatus.sync.extraInDB.length - 5} más`);
    }
  }
  
  console.log('');
}

// Función para mostrar recomendaciones
function showRecommendations(syncStatus) {
  console.log(colors.magenta.bold('\n=== RECOMENDACIONES ===\n'));
  
  if (syncStatus.sync.missingInDB.length > 0) {
    console.log(colors.yellow('🔧 ACCIONES RECOMENDADAS:'));
    console.log('1. Sincronizar grabaciones faltantes:');
    console.log('   curl -X POST http://localhost:3000/api/organize-recordings');
    console.log('');
  }

  if (Object.keys(syncStatus.mappings).length === 0) {
    console.log(colors.red('⚠️ CONFIGURACIÓN FALTANTE:'));
    console.log('   - Agregar columna vps_id a la tabla radios');
    console.log('   - Mapear VPS IDs con IDs de la base de datos');
    console.log('');
  }

  if (syncStatus.vps.problematic > 0) {
    console.log(colors.yellow('🗑️ ARCHIVOS PROBLEMÁTICOS:'));
    console.log('   - Los archivos problemáticos serán excluidos automáticamente');
    console.log('   - Verificar y limpiar en el VPS si es necesario');
    console.log('');
  }

  const syncPercentage = syncStatus.vps.valid > 0 
    ? Math.round((syncStatus.sync.vpsRecordingsInDB / syncStatus.vps.valid) * 100)
    : 0;

  console.log(colors.green(`📊 PORCENTAJE DE SINCRONIZACIÓN: ${syncPercentage}%`));
  
  if (syncPercentage === 100) {
    console.log(colors.green('✅ ¡Sincronización completa!'));
  } else if (syncPercentage >= 80) {
    console.log(colors.yellow('⚠️ Sincronización parcial - revisar faltantes'));
  } else {
    console.log(colors.red('❌ Sincronización incompleta - requiere atención'));
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== VERIFICACIÓN DE SINCRONIZACIÓN VPS ===\n'));
  
  try {
    // Obtener datos de todas las fuentes
    const [vpsRecordings, dbRecordings, radios] = await Promise.all([
      getVPSRecordings(),
      getDatabaseRecordings(),
      getDatabaseRadios()
    ]);

    // Analizar sincronización
    const syncStatus = analyzeSync(vpsRecordings, dbRecordings, radios);
    
    // Mostrar reporte
    showSyncReport(syncStatus);
    showRecommendations(syncStatus);

    // Resumen final
    console.log(colors.cyan.bold('\n=== RESUMEN ===\n'));
    
    const isConnected = vpsRecordings.length > 0;
    const hasMappings = Object.keys(syncStatus.mappings).length > 0;
    const isSynced = syncStatus.sync.vpsRecordingsInDB === syncStatus.vps.valid && syncStatus.vps.valid > 0;
    
    console.log(`🔗 VPS conectado: ${isConnected ? '✅ Sí' : '❌ No'}`);
    console.log(`🗺️ Mapeos configurados: ${hasMappings ? '✅ Sí' : '❌ No'}`);
    console.log(`🔄 Sincronizado: ${isSynced ? '✅ Sí' : '❌ No'}`);
    
    if (isConnected && hasMappings && isSynced) {
      success('🎉 ¡Sistema completamente sincronizado con VPS!');
    } else if (isConnected) {
      warning('⚠️ VPS conectado pero requiere configuración adicional');
    } else {
      error('❌ No se puede conectar al VPS');
    }

  } catch (error) {
    error(`Error en verificación: ${error.message}`);
    console.error(error);
  }
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error ejecutando verificación:', error);
    process.exit(1);
  });
}

module.exports = {
  getVPSRecordings,
  getDatabaseRecordings,
  getDatabaseRadios,
  analyzeSync,
  main
};