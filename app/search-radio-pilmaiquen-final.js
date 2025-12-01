const fs = require('fs');
const path = require('path');

// Leer el token válido desde el archivo
const tokenPath = path.join(__dirname, 'valid-token.txt');
let authToken;

try {
  authToken = fs.readFileSync(tokenPath, 'utf8').trim();
  console.log('✅ Token cargado:', authToken.substring(0, 50) + '...');
} catch (error) {
  console.error('❌ Error al leer el token:', error.message);
  process.exit(1);
}

// Configuración de la API
const API_BASE = 'http://localhost:3000/api';

// Headers para las peticiones
const headers = {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
};

async function searchRadioPilmaiquen() {
  console.log('🎯 Búsqueda específica de Radio Pilmaiquen');
  console.log('========================================');
  
  try {
    // Primero buscar por nombre
    console.log('\n🔍 Buscando radios con nombre que contiene: pilmaiquen');
    const response1 = await fetch(`${API_BASE}/radios-direct?name=ilike.pilmaiquen`, { headers });
    
    if (!response1.ok) {
      throw new Error(`HTTP error! status: ${response1.status}`);
    }
    
    const data1 = await response1.json();
    console.log(`📊 Encontradas ${data1.length} radios con "pilmaiquen"`);
    
    if (data1.length > 0) {
      console.log('📻 Radios encontradas:');
      data1.forEach(radio => {
        console.log(`  - ${radio.name} (${radio.region}): ${radio.stream_url}`);
      });
      return data1;
    }
    
    // Buscar con acento
    console.log('\n🔍 Buscando radios con nombre que contiene: pilmaiquén');
    const response2 = await fetch(`${API_BASE}/radios-direct?name=ilike.pilmaiqu%C3%A9n`, { headers });
    const data2 = await response2.json();
    console.log(`📊 Encontradas ${data2.length} radios con "pilmaiquén"`);
    
    if (data2.length > 0) {
      console.log('📻 Radios encontradas:');
      data2.forEach(radio => {
        console.log(`  - ${radio.name} (${radio.region}): ${radio.stream_url}`);
      });
      return data2;
    }
    
    // Buscar por URL
    console.log('\n🔍 Buscando radios con URL que contiene: chiloestreaming.com');
    const response3 = await fetch(`${API_BASE}/radios-direct?stream_url=ilike.chiloestreaming.com`, { headers });
    const data3 = await response3.json();
    console.log(`📊 Encontradas ${data3.length} radios con "chiloestreaming.com"`);
    
    if (data3.length > 0) {
      console.log('📻 Radios encontradas:');
      data3.forEach(radio => {
        console.log(`  - ${radio.name} (${radio.region}): ${radio.stream_url}`);
      });
      return data3;
    }
    
    // Buscar por puerto 10989
    console.log('\n🔍 Buscando radios con URL que contiene: 10989');
    const response4 = await fetch(`${API_BASE}/radios-direct?stream_url=ilike.10989`, { headers });
    const data4 = await response4.json();
    console.log(`📊 Encontradas ${data4.length} radios con "10989"`);
    
    if (data4.length > 0) {
      console.log('📻 Radios encontradas:');
      data4.forEach(radio => {
        console.log(`  - ${radio.name} (${radio.region}): ${radio.stream_url}`);
      });
      return data4;
    }
    
    console.log('\n❌ No se encontró Radio Pilmaiquen con las búsquedas directas');
    return [];
    
  } catch (error) {
    console.error('❌ Error en la búsqueda:', error.message);
    return [];
  }
}

// Ejecutar la búsqueda
searchRadioPilmaiquen()
  .then(results => {
    if (results.length === 0) {
      console.log('\n💡 Sugerencias:');
      console.log('   - Verifica el nombre exacto de la radio');
      console.log('   - Busca en el panel de administración web');
      console.log('   - Contacta al administrador del sistema');
      console.log('   - La radio podría tener un nombre diferente');
    }
    console.log('\n✅ Búsqueda completada');
  })
  .catch(error => {
    console.error('❌ Error general:', error.message);
  });