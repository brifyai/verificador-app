const fs = require('fs');
const path = require('path');

// Leer el token de autenticación
function getAuthToken() {
  const tokenPaths = [
    path.join(__dirname, 'admin-token.txt'),
    path.join(__dirname, 'valid-token.txt')
  ];
  
  for (const tokenPath of tokenPaths) {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf8').trim();
    }
  }
  
  console.log('❌ No se encontró token de autenticación');
  return null;
}

async function findRadioByPort() {
  const token = getAuthToken();
  if (!token) {
    return;
  }

  console.log('🔍 Buscando radios que usen el puerto 10977...');
  console.log('='.repeat(60));
  
  try {
    // Buscar radios que contengan "10977" en la URL
    const response = await fetch('http://localhost:3000/api/radios-direct?limit=500', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const radios = data.radios || [];
    
    console.log(`📊 Total de radios en la base de datos: ${radios.length}`);
    console.log('');
    
    // Buscar radios que usen el puerto 10977
    const port10977Radios = radios.filter(radio => 
      radio.stream_url && radio.stream_url.includes('10977')
    );
    
    if (port10977Radios.length === 0) {
      console.log('❌ No se encontró ninguna radio que use el puerto 10977');
      
      // Buscar radios que usen chiloestreaming.com
      const chiloeRadios = radios.filter(radio => 
        radio.stream_url && radio.stream_url.includes('chiloestreaming.com')
      );
      
      if (chiloeRadios.length > 0) {
        console.log('📡 Radios que usan chiloestreaming.com:');
        chiloeRadios.forEach(radio => {
          console.log(`   📻 ${radio.name} (${radio.id})`);
          console.log(`      URL: ${radio.stream_url}`);
          console.log(`      Región: ${radio.region}`);
          console.log(`      Estado: ${radio.status}`);
          console.log('');
        });
      } else {
        console.log('❌ No se encontró ninguna radio que use chiloestreaming.com');
      }
    } else {
      console.log(`✅ Encontradas ${port10977Radios.length} radios que usan el puerto 10977:`);
      console.log('');
      
      port10977Radios.forEach(radio => {
        console.log(`📻 ${radio.name} (${radio.id})`);
        console.log(`   🌐 URL: ${radio.stream_url}`);
        console.log(`   📍 Región: ${radio.region}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log(`   📝 Descripción: ${radio.description || 'Sin descripción'}`);
        console.log('');
      });
    }
    
    // También buscar radios que puedan ser de Pilmaiquen por nombre
    console.log('🔍 Buscando radios que puedan ser de Pilmaiquen por nombre...');
    const possiblePilmaiquen = radios.filter(radio => {
      const name = radio.name.toLowerCase();
      return name.includes('pilmaiquen') || 
             name.includes('pilmaiquén') ||
             name.includes('pilma') ||
             (radio.description && radio.description.toLowerCase().includes('pilmaiquen'));
    });
    
    if (possiblePilmaiquen.length > 0) {
      console.log(`🎯 Posibles radios de Pilmaiquen encontradas: ${possiblePilmaiquen.length}`);
      possiblePilmaiquen.forEach(radio => {
        console.log(`   📻 ${radio.name} (${radio.id})`);
        console.log(`      URL: ${radio.stream_url}`);
        console.log(`      Región: ${radio.region}`);
        console.log(`      Estado: ${radio.status}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error al buscar radios por puerto:', error.message);
  }
}

// Ejecutar la búsqueda
findRadioByPort();