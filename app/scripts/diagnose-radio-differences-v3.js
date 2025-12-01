#!/usr/bin/env node

/**
 * Script con autenticación para diagnosticar diferencias entre radios Fmmas y Fmokey
 * Usando API key del service role
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuración
const API_BASE_URL = 'http://localhost:3000/api';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurado en .env.local');
  process.exit(1);
}

// Función para hacer peticiones HTTP con autenticación
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Radio-Diagnostic-Tool/3.0',
        'x-api-key': SERVICE_ROLE_KEY
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Función para obtener todas las radios
async function getAllRadios() {
  try {
    console.log('📡 Obteniendo lista de todas las radios...');
    const response = await makeRequest(`${API_BASE_URL}/radios`);
    
    if (response.status === 200 && response.data.success) {
      console.log(`✅ Encontradas ${response.data.data.length} radios`);
      return response.data.data;
    } else if (response.status === 401) {
      console.log('❌ Error de autenticación. Verificando API key...');
      return null;
    } else {
      console.log('❌ Error obteniendo radios:', response.data);
      return [];
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return null;
  }
}

// Función para buscar radios por nombre
function findRadiosByName(radios, name) {
  return radios.filter(radio => radio.name && radio.name.toLowerCase().includes(name.toLowerCase()));
}

// Función para analizar la estructura de una radio
function analyzeRadioStructure(radio) {
  const analysis = {
    id: radio.id,
    name: radio.name,
    platform: radio.streamPlatform,
    stream_url: radio.streamUrl,
    region: radio.region,
    status: radio.isActive ? 'ACTIVE' : 'INACTIVE',
    hasMetadata: !!radio.metadata,
    metadataKeys: radio.metadata ? Object.keys(radio.metadata) : [],
    metadataAnalysis: {
      hasPlatformData: !!(radio.metadata && radio.metadata.platformData),
      hasStreamPlatform: !!(radio.metadata && radio.metadata.streamPlatform),
      hasCity: !!(radio.metadata && radio.metadata.city),
      hasFrequency: !!(radio.metadata && radio.metadata.frequency),
      hasProgramadora: !!(radio.metadata && radio.metadata.programadora),
      hasWebsite: !!(radio.metadata && radio.metadata.website),
      hasDescription: !!(radio.metadata && radio.metadata.description),
      hasLogo: !!(radio.metadata && radio.metadata.logo),
      hasLastMonitored: !!(radio.metadata && radio.metadata.lastMonitored)
    },
    verificationStatus: radio.lastVerificationStatus,
    lastVerifiedAt: radio.lastVerifiedAt,
    lastMonitored: radio.lastMonitored,
    createdAt: radio.createdAt,
    updatedAt: radio.updatedAt
  };

  return analysis;
}

// Función para probar actualización de radio
async function testRadioUpdate(radioId, testData) {
  try {
    console.log(`🧪 Probando actualización de radio ${radioId}...`);
    
    const response = await makeRequest(
      `${API_BASE_URL}/radios/${radioId}`,
      'PUT',
      testData
    );
    
    return {
      success: response.status === 200,
      status: response.status,
      data: response.data,
      error: response.data?.error || null
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      error: error.message
    };
  }
}

// Función principal
async function main() {
  console.log('🔍 DIAGNÓSTICO CON AUTENTICACIÓN DE RADIOS Fmmas vs Fmokey');
  console.log('=========================================================\n');

  // Verificar que el servidor esté ejecutándose
  console.log('🔍 Verificando conectividad con el servidor...');
  try {
    const healthCheck = await makeRequest(`${API_BASE_URL}/health`);
    console.log(`✅ Servidor responde con status: ${healthCheck.status}`);
  } catch (error) {
    console.log('❌ No se puede conectar al servidor');
    console.log('   Asegúrate de ejecutar: cd app && npm run dev');
    process.exit(1);
  }

  // Obtener todas las radios
  const allRadios = await getAllRadios();
  
  if (allRadios === null) {
    console.log('❌ Falló la autenticación. Verifica que SUPABASE_SERVICE_ROLE_KEY esté correcto.');
    process.exit(1);
  }
  
  if (allRadios.length === 0) {
    console.log('❌ No se encontraron radios en el sistema.');
    return;
  }

  // Buscar radios Fmmas y Fmokey
  const fmmasRadios = findRadiosByName(allRadios, 'fmmas');
  const fmokeyRadios = findRadiosByName(allRadios, 'fmokey');

  console.log(`📻 Encontradas ${fmmasRadios.length} radios Fmmas`);
  console.log(`📻 Encontradas ${fmokeyRadios.length} radios Fmokey`);

  if (fmmasRadios.length === 0 && fmokeyRadios.length === 0) {
    console.log('❌ No se encontraron radios Fmmas ni Fmokey');
    
    // Mostrar algunas radios de ejemplo
    console.log('\n📋 Algunas radios disponibles:');
    allRadios.slice(0, 10).forEach(radio => {
      console.log(`  - ${radio.name} (${radio.region}) - Platform: ${radio.streamPlatform}`);
    });
    return;
  }

  // Analizar estructuras
  console.log('\n📊 ANÁLISIS DETALLADO DE ESTRUCTURA');
  console.log('====================================\n');

  if (fmmasRadios.length > 0) {
    console.log('🔍 Fmmas Radios:');
    fmmasRadios.forEach((radio, index) => {
      console.log(`\n ${index + 1}. ${radio.name} (${radio.region})`);
      const analysis = analyzeRadioStructure(radio);
      console.log(`     ID: ${analysis.id}`);
      console.log(`     Plataforma: ${analysis.platform}`);
      console.log(`     URL: ${analysis.stream_url}`);
      console.log(`     Estado: ${analysis.status}`);
      console.log(`     Verificación: ${analysis.verificationStatus}`);
      console.log(`     Último monitoreo: ${analysis.lastMonitored}`);
      console.log(`     Metadata keys: [${analysis.metadataKeys.join(', ')}]`);
      console.log(`     Tiene platformData: ${analysis.metadataAnalysis.hasPlatformData}`);
      console.log(`     Tiene streamPlatform: ${analysis.metadataAnalysis.hasStreamPlatform}`);
      console.log(`     Tiene city: ${analysis.metadataAnalysis.hasCity}`);
      console.log(`     Tiene frequency: ${analysis.metadataAnalysis.hasFrequency}`);
      console.log(`     Tiene programadora: ${analysis.metadataAnalysis.hasProgramadora}`);
    });
  }

  if (fmokeyRadios.length > 0) {
    console.log('\n🔍 Fmokey Radios:');
    fmokeyRadios.forEach((radio, index) => {
      console.log(`\n ${index + 1}. ${radio.name} (${radio.region})`);
      const analysis = analyzeRadioStructure(radio);
      console.log(`     ID: ${analysis.id}`);
      console.log(`     Plataforma: ${analysis.platform}`);
      console.log(`     URL: ${analysis.stream_url}`);
      console.log(`     Estado: ${analysis.status}`);
      console.log(`     Verificación: ${analysis.verificationStatus}`);
      console.log(`     Último monitoreo: ${analysis.lastMonitored}`);
      console.log(`     Metadata keys: [${analysis.metadataKeys.join(', ')}]`);
      console.log(`     Tiene platformData: ${analysis.metadataAnalysis.hasPlatformData}`);
      console.log(`     Tiene streamPlatform: ${analysis.metadataAnalysis.hasStreamPlatform}`);
      console.log(`     Tiene city: ${analysis.metadataAnalysis.hasCity}`);
      console.log(`     Tiene frequency: ${analysis.metadataAnalysis.hasFrequency}`);
      console.log(`     Tiene programadora: ${analysis.metadataAnalysis.hasProgramadora}`);
    });
  }

  // Pruebas de actualización
  console.log('\n🧪 PRUEBAS DE ACTUALIZACIÓN');
  console.log('============================\n');

  const testResults = [];

  // Probar con Fmmas
  if (fmmasRadios.length > 0) {
    const radio = fmmasRadios[0];
    console.log(`Probando Fmmas: ${radio.name} (${radio.region})`);
    
    const testData = {
      name: radio.name + ' (TEST)',
      streamPlatform: radio.streamPlatform,
      streamUrl: radio.streamUrl,
      region: radio.region,
      isActive: radio.isActive,
      metadata: {
        ...radio.metadata,
        city: radio.metadata?.city || 'Test City',
        description: 'Test description from diagnostic script'
      }
    };

    const result = await testRadioUpdate(radio.id, testData);
    testResults.push({
      radio: radio.name,
      type: 'Fmmas',
      id: radio.id,
      ...result
    });

    console.log(`   Resultado: ${result.success ? '✅ ÉXITO' : '❌ FALLA'}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
      if (result.data?.details) {
        console.log(`   Detalles: ${JSON.stringify(result.data.details)}`);
      }
    }
  }

  // Probar con Fmokey
  if (fmokeyRadios.length > 0) {
    const radio = fmokeyRadios[0];
    console.log(`\nProbando Fmokey: ${radio.name} (${radio.region})`);
    
    const testData = {
      name: radio.name + ' (TEST)',
      streamPlatform: radio.streamPlatform,
      streamUrl: radio.streamUrl,
      region: radio.region,
      isActive: radio.isActive,
      metadata: {
        ...radio.metadata,
        city: radio.metadata?.city || 'Test City',
        description: 'Test description from diagnostic script'
      }
    };

    const result = await testRadioUpdate(radio.id, testData);
    testResults.push({
      radio: radio.name,
      type: 'Fmokey',
      id: radio.id,
      ...result
    });

    console.log(`   Resultado: ${result.success ? '✅ ÉXITO' : '❌ FALLA'}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
      if (result.data?.details) {
        console.log(`   Detalles: ${JSON.stringify(result.data.details)}`);
      }
    }
  }

  // Comparar estructuras
  console.log('\n🔍 COMPARACIÓN DE ESTRUCTURAS');
  console.log('==============================\n');

  if (fmmasRadios.length > 0 && fmokeyRadios.length > 0) {
    const fmmasAnalysis = analyzeRadioStructure(fmmasRadios[0]);
    const fmokeyAnalysis = analyzeRadioStructure(fmokeyRadios[0]);

    console.log('Diferencias clave:');
    console.log(`Fmmas platform: ${fmmasAnalysis.platform}`);
    console.log(`Fmokey platform: ${fmokeyAnalysis.platform}`);
    console.log(`Fmmas metadata keys: [${fmmasAnalysis.metadataKeys.join(', ')}]`);
    console.log(`Fmokey metadata keys: [${fmokeyAnalysis.metadataKeys.join(', ')}]`);
    console.log(`Fmmas tiene platformData: ${fmmasAnalysis.metadataAnalysis.hasPlatformData}`);
    console.log(`Fmokey tiene platformData: ${fmokeyAnalysis.metadataAnalysis.hasPlatformData}`);
    console.log(`Fmmas tiene city: ${fmmasAnalysis.metadataAnalysis.hasCity}`);
    console.log(`Fmokey tiene city: ${fmokeyAnalysis.metadataAnalysis.hasCity}`);
  }

  // Reporte final
  console.log('\n📋 REPORTE FINAL');
  console.log('================\n');

  testResults.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.type}: ${result.radio}`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Status: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Guardar resultados
  const results = {
    timestamp: new Date().toISOString(),
    fmmasRadios: fmmasRadios.map(r => analyzeRadioStructure(r)),
    fmokeyRadios: fmokeyRadios.map(r => analyzeRadioStructure(r)),
    testResults,
    summary: {
      totalFmmas: fmmasRadios.length,
      totalFmokey: fmokeyRadios.length,
      fmmasWorking: testResults.filter(r => r.type === 'Fmmas' && r.success).length,
      fmokeyWorking: testResults.filter(r => r.type === 'Fmokey' && r.success).length
    }
  };

  fs.writeFileSync('radio-diagnostic-v3-results.json', JSON.stringify(results, null, 2));
  console.log(`\n💾 Resultados guardados en: radio-diagnostic-v3-results.json`);
}

// Ejecutar
main().catch(console.error);