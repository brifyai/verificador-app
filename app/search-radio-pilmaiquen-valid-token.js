#!/usr/bin/env node

/**
 * Script para buscar Radio Pilmaiquen usando un token válido
 * Este script busca específicamente la radio que tiene problemas con el streaming
 */

const fs = require('fs');
const path = require('path');

// Leer el token válido del archivo
const tokenPath = path.join(__dirname, 'valid-token.txt');
let authToken;

try {
  authToken = fs.readFileSync(tokenPath, 'utf8').trim();
  console.log('✅ Token válido encontrado');
} catch (error) {
  console.error('❌ No se encontró el archivo valid-token.txt');
  console.log('💡 Por favor ejecuta: node get-valid-token.js');
  process.exit(1);
}

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';
const headers = {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
};

/**
 * Buscar radios por nombre
 */
async function searchRadioByName(name) {
  try {
    console.log(`📡 Buscando radios con nombre que contiene: ${name}`);
    
    const response = await fetch(`${API_BASE_URL}/radios-direct?name=ilike.${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error al buscar por nombre "${name}":`, error.message);
    return null;
  }
}

/**
 * Buscar radios por URL
 */
async function searchRadioByUrl(urlPattern) {
  try {
    console.log(`📡 Buscando radios con URL que contiene: ${urlPattern}`);
    
    const response = await fetch(`${API_BASE_URL}/radios-direct?stream_url=ilike.${encodeURIComponent(urlPattern)}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error al buscar por URL "${urlPattern}":`, error.message);
    return null;
  }
}

/**
 * Buscar todas las radios de chiloestreaming.com
 */
async function searchChiloeStreamingRadios() {
  try {
    console.log(`📡 Buscando todas las radios de chiloestreaming.com...`);
    
    const response = await fetch(`${API_BASE_URL}/radios-direct?stream_url=ilike.%25chiloestreaming.com%25`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error al buscar radios de chiloestreaming.com:`, error.message);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🎯 Búsqueda específica de Radio Pilmaiquen');
  console.log('========================================');
  console.log('🔍 Buscando Radio Pilmaiquen o Futaleufu...\n');

  // Búsquedas específicas
  const searches = [
    { type: 'nombre', value: 'pilmaiquen' },
    { type: 'nombre', value: 'pilmaiquén' },
    { type: 'nombre', value: 'futaleufu' },
    { type: 'nombre', value: 'futaleufú' },
    { type: 'nombre', value: 'rem futaleufu' },
    { type: 'url', value: '10977' },
    { type: 'url', value: 'chiloestreaming.com' }
  ];

  let foundRadios = [];

  // Realizar búsquedas
  for (const search of searches) {
    let result;
    
    if (search.type === 'nombre') {
      result = await searchRadioByName(search.value);
    } else if (search.type === 'url') {
      result = await searchRadioByUrl(search.value);
    }

    if (result && result.length > 0) {
      console.log(`✅ Encontradas ${result.length} radios con "${search.value}":`);
      result.forEach(radio => {
        console.log(`   📻 ${radio.name} - ${radio.stream_url} (${radio.region})`);
        foundRadios.push(radio);
      });
      console.log('');
    } else {
      console.log(`❌ No se encontraron radios con "${search.value}"`);
    }
  }

  // Búsqueda general de chiloestreaming.com
  console.log('\n📡 Buscando todas las radios de chiloestreaming.com...');
  const chiloeRadios = await searchChiloeStreamingRadios();
  
  if (chiloeRadios && chiloeRadios.length > 0) {
    console.log(`✅ Encontradas ${chiloeRadios.length} radios de chiloestreaming.com:`);
    chiloeRadios.forEach(radio => {
      console.log(`   📻 ${radio.name} - ${radio.stream_url} (${radio.region})`);
      
      // Si no está ya en foundRadios, agregarla
      if (!foundRadios.find(r => r.id === radio.id)) {
        foundRadios.push(radio);
      }
    });
  } else {
    console.log('❌ No se encontraron radios de chiloestreaming.com');
  }

  // Resumen final
  console.log('\n📊 RESUMEN DE BÚSQUEDA');
  console.log('=====================');
  
  if (foundRadios.length > 0) {
    console.log(`✅ Se encontraron ${foundRadios.length} radios relacionadas:`);
    foundRadios.forEach(radio => {
      console.log(`   📻 ${radio.name} (${radio.id})`);
      console.log(`      URL: ${radio.stream_url}`);
      console.log(`      Región: ${radio.region}`);
      console.log(`      Estado: ${radio.status}`);
      console.log('');
    });

    // Buscar específicamente la que tiene el puerto 10977
    const radio10977 = foundRadios.find(radio => radio.stream_url.includes('10977'));
    
    if (radio10977) {
      console.log('🎯 RADIO ENCONTRADA CON PUERTO 10977:');
      console.log('=====================================');
      console.log(`   ID: ${radio10977.id}`);
      console.log(`   Nombre: ${radio10977.name}`);
      console.log(`   URL actual: ${radio10977.stream_url}`);
      console.log(`   Región: ${radio10977.region}`);
      console.log(`   Estado: ${radio10977.status}`);
      console.log('');
      console.log('💡 La URL correcta debería ser:');
      console.log(`   https://streaming.chiloestreaming.com:10976/`);
      console.log('');
      console.log('📝 Para actualizarla, ejecuta:');
      console.log(`   node update-radio-url.js ${radio10977.id} "https://streaming.chiloestreaming.com:10976/"`);
    } else {
      console.log('❌ No se encontró ninguna radio con el puerto 10977');
      console.log('💡 Pero se encontraron estas radios de chiloestreaming.com:');
      foundRadios.forEach(radio => {
        console.log(`   - ${radio.name}: ${radio.stream_url}`);
      });
    }
  } else {
    console.log('❌ No se encontraron radios relacionadas con Pilmaiquen o chiloestreaming.com');
    console.log('');
    console.log('💡 Sugerencias:');
    console.log('   - Verifica el nombre exacto de la radio');
    console.log('   - Busca en el panel de administración web');
    console.log('   - Contacta al administrador del sistema');
    console.log('   - La radio podría tener un nombre diferente');
  }
}

// Ejecutar el script
main().catch(error => {
  console.error('❌ Error en la búsqueda:', error);
  process.exit(1);
});