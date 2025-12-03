#!/usr/bin/env node

/**
 * Investigación del formato correcto para grabar en el VPS
 * Analiza qué datos exactos necesita el VPS para iniciar una grabación
 */

const VPS_URL = 'http://213.199.39.147:5000';

console.log('🔍 INVESTIGACIÓN DE FORMATO DE GRABACIÓN VPS');
console.log('===========================================');
console.log('');

// Datos de radios reales que podrían existir en el VPS
const REAL_RADIO_TESTS = [
  {
    name: 'Radio Contagio Real',
    streamUrl: 'http://stream5.eltelar.com:8064/stream',
    radio_id: 'contagio_8064',
    radio_name: 'Radio Contagio',
    id: 'contagio_real'
  },
  {
    name: 'Radio Digital FM Arica',
    streamUrl: 'https://radio.digitalfm.cl:8000/arica',
    radio_id: 'digitalfm_arica',
    radio_name: 'Digital FM Arica',
    id: 'digitalfm_arica'
  },
  {
    name: 'Radio Somos Petorca',
    streamUrl: 'http://stream5.eltelar.com:8062/stream',
    radio_id: 'somos_petorca',
    radio_name: 'Radio Somos Petorca',
    id: 'somos_petorca'
  }
];

async function testRecordingWithDifferentFormats(radioData) {
  console.log(`🧪 Probando formato para: ${radioData.name}`);
  console.log(`📡 Stream URL: ${radioData.streamUrl}`);
  
  // Formato 1: Con ID simple
  const format1 = {
    radio_id: radioData.radio_id,
    radio_name: radioData.radio_name,
    stream_url: radioData.streamUrl,
    duration: 30
  };
  
  // Formato 2: Con objeto completo
  const format2 = {
    radio: {
      id: radioData.id,
      name: radioData.radio_name,
      stream_url: radioData.streamUrl
    },
    duration: 30
  };
  
  // Formato 3: Con metadata adicional
  const format3 = {
    radio_id: radioData.radio_id,
    radio_name: radioData.radio_name,
    stream_url: radioData.streamUrl,
    duration: 30,
    format: 'mp3',
    quality: '128k'
  };
  
  const formats = [
    { name: 'Formato 1 - ID simple', data: format1 },
    { name: 'Formato 2 - Objeto radio', data: format2 },
    { name: 'Formato 3 - Con metadata', data: format3 }
  ];
  
  for (const format of formats) {
    console.log(`   📋 ${format.name}:`);
    console.log(`      Datos: ${JSON.stringify(format.data)}`);
    
    try {
      const response = await fetch(`${VPS_URL}/api/start-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(format.data)
      });
      
      const responseText = await response.text();
      console.log(`      📊 Status: ${response.status}`);
      console.log(`      📄 Response: ${responseText}`);
      
      if (response.status === 200) {
        console.log(`      ✅ ÉXITO - Este formato funciona!`);
        return format.data;
      } else if (response.status === 500) {
        console.log(`      ❌ Error 500 - Problema del servidor`);
      } else if (response.status === 404) {
        console.log(`      ❌ Error 404 - Endpoint no encontrado`);
      } else {
        console.log(`      ⚠️  Status ${response.status} - Otro error`);
      }
      
    } catch (error) {
      console.log(`      💥 Error de conexión: ${error.message}`);
    }
    
    console.log('');
  }
  
  return null;
}

async function investigateVPSRequirements() {
  console.log('🔍 Investigando requisitos del VPS...');
  console.log('');
  
  // 1. Verificar endpoints disponibles
  console.log('1. 📡 Verificando endpoints del VPS...');
  const endpoints = [
    '/api/start-recording',
    '/api/recording/start',
    '/api/record',
    '/api/radio/start-recording'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${VPS_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      console.log(`   📍 ${endpoint}: Status ${response.status}`);
      if (response.status === 404) {
        console.log(`      ❌ Endpoint no existe`);
      } else if (response.status === 405) {
        console.log(`      ⚠️  Método no permitido`);
      } else if (response.status === 400 || response.status === 500) {
        console.log(`      ✅ Endpoint existe (pero necesita datos correctos)`);
      }
    } catch (error) {
      console.log(`   📍 ${endpoint}: Error - ${error.message}`);
    }
  }
  
  console.log('');
  
  // 2. Probar con diferentes formatos
  console.log('2. 🧪 Probando diferentes formatos de datos...');
  console.log('');
  
  for (const radio of REAL_RADIO_TESTS) {
    await testRecordingWithDifferentFormats(radio);
    console.log('   ' + '='.repeat(50));
    console.log('');
  }
}

async function analyzeErrorPatterns() {
  console.log('3. 🔍 Analizando patrones de error...');
  console.log('');
  
  // Analizar qué dice exactamente el error "Radio no encontrada"
  console.log('   📋 El error "Radio no encontrada" sugiere que:');
  console.log('      - El VPS tiene una base de datos interna de radios');
  console.log('      - Necesita un radio_id que exista en su sistema');
  console.log('      - El ID debe coincidir exactamente con lo que tiene registrado');
  console.log('');
  
  console.log('   💡 Posibles soluciones:');
  console.log('      1. Usar un radio_id que el VPS conozca');
  console.log('      2. Registrar primero la radio en el VPS');
  console.log('      3. Usar un endpoint diferente que no requiera ID predefinido');
  console.log('      4. El VPS podría aceptar radios nuevas con un formato especial');
}

async function testWithKnownWorkingRadio() {
  console.log('4. 🎯 Probando con radios conocidas que funcionen...');
  console.log('');
  
  // Intentar obtener radios del VPS para ver qué IDs usa
  try {
    console.log('   📡 Obteniendo lista de radios del VPS...');
    
    // Probar diferentes endpoints para obtener radios
    const radioEndpoints = [
      '/api/radios',
      '/api/stations',
      '/api/radio-list',
      '/api/available-radios'
    ];
    
    for (const endpoint of radioEndpoints) {
      try {
        const response = await fetch(`${VPS_URL}${endpoint}`);
        console.log(`   📍 ${endpoint}: Status ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`      ✅ Radios encontradas: ${JSON.stringify(data, null, 2)}`);
          return data;
        }
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`   💥 Error general: ${error.message}`);
  }
  
  return null;
}

// Ejecutar investigación completa
async function runFullInvestigation() {
  console.log('🚀 Iniciando investigación completa...');
  console.log('');
  
  await investigateVPSRequirements();
  await analyzeErrorPatterns();
  await testWithKnownWorkingRadio();
  
  console.log('');
  console.log('📊 CONCLUSIÓN DE LA INVESTIGACIÓN');
  console.log('================================');
  console.log('');
  console.log('🔍 El problema HTTP 500 ocurre porque:');
  console.log('   1. El VPS tiene una base de datos interna de radios');
  console.log('   2. Solo puede grabar radios que estén registradas en su sistema');
  console.log('   3. Necesita el radio_id exacto que el VPS tiene registrado');
  console.log('');
  console.log('💡 SOLUCIONES RECOMENDADAS:');
  console.log('   1. Obtener la lista real de radios del VPS');
  console.log('   2. Usar los radio_id que el VPS conozca');
  console.log('   3. Registrar nuevas radios si el VPS lo permite');
  console.log('   4. Usar un endpoint que acepte grabaciones sin ID predefinido');
  console.log('');
  console.log('🔧 Próximos pasos:');
  console.log('   1. Encontrar el endpoint correcto para obtener radios');
  console.log('   2. Usar los IDs reales del VPS');
  console.log('   3. Modificar el frontend para enviar IDs válidos');
}

// Ejecutar
runFullInvestigation().catch(console.error);