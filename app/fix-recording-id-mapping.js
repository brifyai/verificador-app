#!/usr/bin/env node

/**
 * Herramienta para mapear radios del frontend con radios del VPS
 * Soluciona el error HTTP 500 "Radio no encontrada"
 */

const VPS_URL = 'http://213.199.39.147:5000';

// Radios del frontend que el usuario quiere grabar
const FRONTEND_RADIOS = [
  {
    id: 'radio_contagio_real',
    name: 'Radio Contagio',
    stream_url: 'http://stream5.eltelar.com:8064/stream',
    city: 'Petorca'
  },
  {
    id: 'radio_somos_petorca',
    name: 'Radio Somos Petorca', 
    stream_url: 'http://stream5.eltelar.com:8062/stream',
    city: 'Petorca'
  },
  {
    id: 'radio_digital_fm_arica',
    name: 'Digital FM Arica',
    stream_url: 'https://radio.digitalfm.cl:8000/arica',
    city: 'Arica'
  }
];

async function getVPSRadios() {
  try {
    const response = await fetch(`${VPS_URL}/api/radios`);
    const data = await response.json();
    return data.radios || [];
  } catch (error) {
    console.error('❌ Error obteniendo radios del VPS:', error.message);
    return [];
  }
}

function findMatchingRadio(frontendRadio, vpsRadios) {
  // Buscar por nombre exacto o similar
  const nameMatches = vpsRadios.filter(vpsRadio => {
    const vpsName = vpsRadio.name.toLowerCase();
    const frontendName = frontendRadio.name.toLowerCase();
    
    // Coincidencia exacta o parcial
    return vpsName.includes(frontendName) || 
           frontendName.includes(vpsName) ||
           vpsName.includes('contagio') && frontendName.includes('contagio') ||
           vpsName.includes('somos') && frontendName.includes('somos') ||
           vpsName.includes('digital') && frontendName.includes('digital');
  });
  
  if (nameMatches.length > 0) {
    return nameMatches[0];
  }
  
  // Buscar por URL del stream
  const streamMatches = vpsRadios.filter(vpsRadio => {
    const vpsStream = vpsRadio.stream_url.toLowerCase();
    const frontendStream = frontendRadio.stream_url.toLowerCase();
    
    return vpsStream === frontendStream ||
           vpsStream.includes(frontendStream) ||
           frontendStream.includes(vpsStream);
  });
  
  if (streamMatches.length > 0) {
    return streamMatches[0];
  }
  
  // Buscar por ciudad
  const cityMatches = vpsRadios.filter(vpsRadio => {
    const vpsCity = (vpsRadio.metadata?.city || '').toLowerCase();
    const frontendCity = frontendRadio.city.toLowerCase();
    
    return vpsCity === frontendCity ||
           vpsCity.includes(frontendCity) ||
           frontendCity.includes(vpsCity);
  });
  
  if (cityMatches.length > 0) {
    return cityMatches[0];
  }
  
  return null;
}

async function createRadioMapping() {
  console.log('🗺️  CREANDO MAPEO DE RADIOS');
  console.log('=============================');
  console.log('');
  
  const vpsRadios = await getVPSRadios();
  console.log(`📡 Radios encontradas en VPS: ${vpsRadios.length}`);
  console.log('');
  
  const mapping = {};
  const unmatched = [];
  
  for (const frontendRadio of FRONTEND_RADIOS) {
    console.log(`🔍 Buscando coincidencia para: ${frontendRadio.name}`);
    console.log(`   Stream: ${frontendRadio.stream_url}`);
    
    const match = findMatchingRadio(frontendRadio, vpsRadios);
    
    if (match) {
      mapping[frontendRadio.id] = {
        frontend_id: frontendRadio.id,
        frontend_name: frontendRadio.name,
        vps_id: match.id_radio,
        vps_name: match.name,
        vps_stream_url: match.stream_url,
        confidence: 'high'
      };
      
      console.log(`   ✅ Encontrado: ${match.name} (ID: ${match.id_radio})`);
    } else {
      unmatched.push(frontendRadio);
      console.log(`   ❌ No encontrado`);
    }
    
    console.log('');
  }
  
  console.log('📊 RESULTADOS DEL MAPEO');
  console.log('========================');
  console.log('');
  
  console.log('✅ Radios mapeadas exitosamente:');
  Object.values(mapping).forEach(mapping => {
    console.log(`   • ${mapping.frontend_name} → ${mapping.vps_name} (ID: ${mapping.vps_id})`);
  });
  
  console.log('');
  console.log('❌ Radios sin coincidencia:');
  unmatched.forEach(radio => {
    console.log(`   • ${radio.name} (${radio.stream_url})`);
  });
  
  console.log('');
  console.log('💡 USANDO EL MAPEO EN EL FRONTEND:');
  console.log('');
  console.log('// En tu componente de grabación:');
  console.log('const RADIO_MAPPING = {');
  Object.entries(mapping).forEach(([frontendId, mapping]) => {
    console.log(`  '${frontendId}': ${mapping.vps_id}, // ${mapping.frontend_name} → ${mapping.vps_name}`);
  });
  console.log('};');
  console.log('');
  console.log('// Al grabar:');
  console.log('const vpsRadioId = RADIO_MAPPING[radio.id] || radio.id;');
  console.log('const recordingData = {');
  console.log('  radio_id: vpsRadioId,');
  console.log('  radio_name: radio.name,');
  console.log('  stream_url: radio.stream_url,');
  console.log('  duration: 30');
  console.log('};');
  
  return { mapping, unmatched };
}

// Buscar radios específicas mencionadas en el error
async function findSpecificRadios() {
  console.log('🔍 BÚSQUEDA ESPECÍFICA DE RADIOS');
  console.log('=================================');
  console.log('');
  
  const vpsRadios = await getVPSRadios();
  
  // Radios mencionadas en los errores
  const searchTerms = [
    'contagio',
    'somos',
    'petorca',
    'digital',
    'arica',
    '8064',
    '8062'
  ];
  
  console.log('📡 Buscando radios que contengan:');
  searchTerms.forEach(term => console.log(`   • ${term}`));
  console.log('');
  
  const matches = {};
  
  searchTerms.forEach(term => {
    const termLower = term.toLowerCase();
    const matchesForTerm = vpsRadios.filter(radio => {
      const name = radio.name.toLowerCase();
      const stream = radio.stream_url.toLowerCase();
      const city = (radio.metadata?.city || '').toLowerCase();
      
      return name.includes(termLower) ||
             stream.includes(termLower) ||
             city.includes(termLower);
    });
    
    if (matchesForTerm.length > 0) {
      matches[term] = matchesForTerm.slice(0, 3); // Máximo 3 por término
    }
  });
  
  console.log('🎯 RESULTADOS DE BÚSQUEDA:');
  console.log('');
  
  Object.entries(matches).forEach(([term, radios]) => {
    console.log(`📍 Búsqueda "${term}":`);
    radios.forEach(radio => {
      console.log(`   • ID: ${radio.id_radio} - ${radio.name}`);
      console.log(`     Stream: ${radio.stream_url}`);
      console.log(`     Ciudad: ${radio.metadata?.city || 'N/A'}`);
      console.log('');
    });
  });
  
  // Buscar Digital FM Arica específicamente
  console.log('🔍 Búsqueda específica de Digital FM Arica:');
  const digitalArica = vpsRadios.find(radio => 
    radio.name.toLowerCase().includes('digital') && 
    radio.stream_url.includes('8000/arica')
  );
  
  if (digitalArica) {
    console.log(`   ✅ Encontrado: ID ${digitalArica.id_radio} - ${digitalArica.name}`);
  } else {
    console.log('   ❌ Digital FM Arica no encontrada');
  }
  
  return matches;
}

// Ejecutar
async function main() {
  await createRadioMapping();
  console.log('\n' + '='.repeat(60) + '\n');
  await findSpecificRadios();
}

main().catch(console.error);