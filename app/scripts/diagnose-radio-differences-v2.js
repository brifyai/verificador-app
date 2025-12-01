#!/usr/bin/env node

/**
 * Script mejorado para diagnosticar diferencias entre radios Fmmas y Fmokey
 * Usando el endpoint correcto de la API local
 */

const https = require('https');
const http = require('http');

// Configuración - Usar la API local
const API_BASE_URL = 'http://localhost:3000/api';

// Función para hacer peticiones HTTP
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
        'User-Agent': 'Radio-Diagnostic-Tool/2.0'
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
    
    if (response.status === 200 && response.data.radios) {
      console.log(`✅ Encontradas ${response.data.radios.length} radios`);
      return response.data.radios;
    } else {
      console.log('❌ Error obteniendo radios:', response.data);
      return [];
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return [];
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
    platform: radio.platform,
    stream_url: radio.stream_url,
    region: radio.region,
    status: radio.status,
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
    verificationStatus: radio.last_verification_status,
    lastVerifiedAt: radio.last_verified_at,
    createdAt: radio.created_at,
    updatedAt: radio.updated_at
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
  console.log('🔍 DIAGNÓSTICO MEJORADO DE RADIOS Fmmas vs Fmokey');
  console.log('=================================================\n');

  // Obtener todas las radios
  const allRadios = await getAllRadios();
  
  if (allRadios.length === 0) {
    console.log('❌ No se pudieron obtener las radios. Verifica que el servidor esté ejecutándose.');
    console.log('   Ejecuta: cd app && npm run dev');
    return;
  }

  // Buscar radios Fmmas y Fmokey
  const fmmasRadios = findRadiosByName(allRadios, 'fmmas');
  const fmokeyRadios = findRadiosByName(allRadios, 'fmokey');

  console.log(`📻 Encontradas ${fmmasRadios.length} radios Fmmas`);
  console.log(`📻 Encontradas ${fmokeyRadios.length} radios Fmokey`);

  if (fmmasRadios.length === 0 && fmokeyRadios.length === 0) {
    console.log('❌ No se encontraron radios Fmmas ni Fmokey');
    return;
  }

  // Analizar estructuras
  console.log('\n📊 ANÁLISIS DE ESTRUCTURA');
  console.log('==========================\n');

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
      console.log(`     Metadata keys: [${analysis.metadataKeys.join(', ')}]`);
      console.log(`     Tiene platformData: ${analysis.metadataAnalysis.hasPlatformData}`);
      console.log(`     Tiene streamPlatform: ${analysis.metadataAnalysis.hasStreamPlatform}`);
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
      console.log(`     Metadata keys: [${analysis.metadataKeys.join(', ')}]`);
      console.log(`     Tiene platformData: ${analysis.metadataAnalysis.hasPlatformData}`);
      console.log(`     Tiene streamPlatform: ${analysis.metadataAnalysis.hasStreamPlatform}`);
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
      platform: radio.platform,
      stream_url: radio.stream_url,
      region: radio.region,
      status: radio.status,
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
    }
  }

  // Probar con Fmokey
  if (fmokeyRadios.length > 0) {
    const radio = fmokeyRadios[0];
    console.log(`\nProbando Fmokey: ${radio.name} (${radio.region})`);
    
    const testData = {
      name: radio.name + ' (TEST)',
      platform: radio.platform,
      stream_url: radio.stream_url,
      region: radio.region,
      status: radio.status,
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
  const fs = require('fs');
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

  fs.writeFileSync('radio-diagnostic-v2-results.json', JSON.stringify(results, null, 2));
  console.log(`\n💾 Resultados guardados en: radio-diagnostic-v2-results.json`);
}

// Ejecutar
main().catch(console.error);