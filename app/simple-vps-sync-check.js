#!/usr/bin/env node

/**
 * VERIFICACIÓN SIMPLE DE SINCRONIZACIÓN CON VPS
 * 
 * Verifica la conexión y sincronización con el VPS de manera directa
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

// Verificar conexión directa al VPS
async function checkVPSConnection() {
  step('Verificando conexión directa al VPS...');
  
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
    const recordings = data.recordings || [];
    
    success(`VPS conectado: ${recordings.length} grabaciones encontradas`);
    
    // Mostrar detalles de las grabaciones
    if (recordings.length > 0) {
      console.log(colors.cyan('📁 Grabaciones encontradas en VPS:'));
      recordings.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.filename}`);
        console.log(`      📏 Tamaño: ${rec.file_size || 'N/A'} bytes`);
        console.log(`      🕐 Fecha: ${rec.recorded_at || rec.created || 'N/A'}`);
        console.log('');
      });
    }
    
    return recordings;
  } catch (err) {
    error(`Error conectando al VPS: ${err.message}`);
    return [];
  }
}

// Verificar grabaciones activas
async function checkActiveRecordings() {
  step('Verificando grabaciones activas...');
  
  try {
    const response = await fetch('http://213.199.39.147:5000/api/active-recordings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`VPS responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    success(`Grabaciones activas: ${data.count || 0}`);
    
    if (data.active_recordings) {
      const activeCount = Object.keys(data.active_recordings).length;
      console.log(colors.cyan(`🔴 Grabaciones activas: ${activeCount}`));
      
      if (activeCount > 0) {
        Object.entries(data.active_recordings).forEach(([id, recording]) => {
          console.log(`   📻 Radio ID: ${id}`);
          console.log(`      🕐 Inicio: ${recording.start_time || 'N/A'}`);
          console.log(`      📊 Estado: ${recording.status || 'N/A'}`);
        });
      }
    }
    
    return data;
  } catch (err) {
    error(`Error verificando grabaciones activas: ${err.message}`);
    return { count: 0, active_recordings: {} };
  }
}

// Verificar endpoint de organización
async function checkOrganizationEndpoint() {
  step('Verificando endpoint de organización...');
  
  try {
    const response = await fetch('http://localhost:3000/api/organize-recordings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Organization endpoint responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    success('Endpoint de organización disponible');
    console.log(colors.cyan('⚙️ Estado del servicio de organización:'));
    console.log(`   🔄 Organizando: ${data.data?.isOrganizing ? 'Sí' : 'No'}`);
    console.log(`   📁 Base Path: ${data.data?.config?.basePath || 'N/A'}`);
    console.log(`   🔄 Auto Organize: ${data.data?.config?.autoOrganize ? 'Sí' : 'No'}`);
    console.log(`   💾 Sync to Database: ${data.data?.config?.syncToDatabase ? 'Sí' : 'No'}`);
    
    return data;
  } catch (err) {
    warning(`Error verificando endpoint de organización: ${err.message}`);
    return null;
  }
}

// Verificar endpoint de grabaciones desde Supabase
async function checkSupabaseRecordings() {
  step('Verificando endpoint de grabaciones desde Supabase...');
  
  try {
    const response = await fetch('http://localhost:3000/api/recordings-from-supabase', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase endpoint responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    success(`Endpoint Supabase disponible: ${data.count || 0} grabaciones`);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log(colors.cyan('💾 Grabaciones en base de datos:'));
      data.recordings.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.filename}`);
        console.log(`      📻 Radio: ${rec.radio_name || 'N/A'}`);
        console.log(`      📁 Ruta: ${rec.file_path || 'N/A'}`);
      });
    }
    
    return data;
  } catch (err) {
    warning(`Error verificando endpoint Supabase: ${err.message}`);
    return { count: 0, recordings: [] };
  }
}

// Analizar sincronización
function analyzeSync(vpsRecordings, supabaseData) {
  step('Analizando sincronización...');
  
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

  const dbRecordings = supabaseData.recordings || [];
  
  // Verificar sincronización
  let syncedCount = 0;
  const missingInDB = [];
  const extraInDB = [];

  validVPSRecordings.forEach(vpsRec => {
    const existsInDB = dbRecordings.some(dbRec => 
      dbRec.filename === vpsRec.filename
    );
    
    if (existsInDB) {
      syncedCount++;
    } else {
      missingInDB.push(vpsRec.filename);
    }
  });

  dbRecordings.forEach(dbRec => {
    const existsInVPS = validVPSRecordings.some(vpsRec => 
      vpsRec.filename === dbRec.filename
    );
    
    if (!existsInVPS) {
      extraInDB.push(dbRec.filename);
    }
  });

  return {
    vps: {
      total: vpsRecordings.length,
      valid: validVPSRecordings.length,
      problematic: vpsRecordings.length - validVPSRecordings.length
    },
    database: {
      total: dbRecordings.length
    },
    sync: {
      synced: syncedCount,
      missingInDB,
      extraInDB,
      syncPercentage: validVPSRecordings.length > 0 
        ? Math.round((syncedCount / validVPSRecordings.length) * 100)
        : 0
    }
  };
}

// Mostrar reporte final
function showFinalReport(syncAnalysis) {
  console.log(colors.cyan.bold('\n=== REPORTE FINAL DE SINCRONIZACIÓN ===\n'));
  
  console.log(colors.yellow('📡 ESTADO DEL VPS:'));
  console.log(`   Total grabaciones: ${syncAnalysis.vps.total}`);
  console.log(`   Válidas: ${syncAnalysis.vps.valid}`);
  console.log(`   Problemáticas: ${syncAnalysis.vps.problematic}`);
  console.log('');
  
  console.log(colors.yellow('💾 ESTADO DE BASE DE DATOS:'));
  console.log(`   Total grabaciones: ${syncAnalysis.database.total}`);
  console.log('');
  
  console.log(colors.yellow('🔄 SINCRONIZACIÓN:'));
  console.log(`   Sincronizadas: ${syncAnalysis.sync.synced}/${syncAnalysis.vps.valid}`);
  console.log(`   Porcentaje: ${syncAnalysis.sync.syncPercentage}%`);
  console.log(`   Faltantes en BD: ${syncAnalysis.sync.missingInDB.length}`);
  console.log(`   Extras en BD: ${syncAnalysis.sync.extraInDB.length}`);
  console.log('');
  
  // Recomendaciones
  console.log(colors.magenta.bold('📋 RECOMENDACIONES:'));
  
  if (syncAnalysis.sync.syncPercentage === 100) {
    success('🎉 ¡Sincronización completa!');
  } else if (syncAnalysis.sync.syncPercentage >= 80) {
    warning('⚠️ Sincronización parcial - ejecutar organización manual');
    console.log('   curl -X POST http://localhost:3000/api/organize-recordings');
  } else {
    error('❌ Sincronización incompleta - requiere atención');
    console.log('   1. Verificar conexión al VPS');
    console.log('   2. Ejecutar organización manual');
    console.log('   3. Revisar mapeos de radios');
  }
  
  if (syncAnalysis.vps.problematic > 0) {
    warning(`🗑️ ${syncAnalysis.vps.problematic} archivos problemáticos serán excluidos`);
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== VERIFICACIÓN DE SINCRONIZACIÓN VPS ===\n'));
  
  try {
    // Verificar VPS
    const vpsRecordings = await checkVPSConnection();
    
    // Verificar grabaciones activas
    await checkActiveRecordings();
    
    // Verificar endpoints locales
    const orgStatus = await checkOrganizationEndpoint();
    const supabaseData = await checkSupabaseRecordings();
    
    // Analizar sincronización
    const syncAnalysis = analyzeSync(vpsRecordings, supabaseData);
    
    // Mostrar reporte final
    showFinalReport(syncAnalysis);
    
  } catch (err) {
    error(`Error en verificación: ${err.message}`);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}