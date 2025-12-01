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

async function findRadioPilmaiquen() {
  const token = getAuthToken();
  if (!token) {
    return;
  }

  console.log('🔍 Buscando Radio Pilmaiquen en la base de datos...');
  console.log('='.repeat(60));
  
  try {
    // Buscar radios que contengan "pilmaiquen" en el nombre
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
    
    // Buscar radios que contengan "pilmaiquen" en el nombre o URL
    const pilmaiquenRadios = radios.filter(radio => 
      radio.name.toLowerCase().includes('pilmaiquen') || 
      (radio.stream_url && radio.stream_url.toLowerCase().includes('pilmaiquen'))
    );
    
    if (pilmaiquenRadios.length === 0) {
      console.log('❌ No se encontró ninguna radio con "pilmaiquen" en el nombre');
      
      // Buscar radios que usen chiloestreaming.com:10977
      const chiloeRadios = radios.filter(radio => 
        radio.stream_url && radio.stream_url.includes('10977')
      );
      
      if (chiloeRadios.length > 0) {
        console.log('📡 Radios que usan el puerto 10977:');
        chiloeRadios.forEach(radio => {
          console.log(`   📻 ${radio.name} (${radio.id})`);
          console.log(`      URL: ${radio.stream_url}`);
          console.log(`      Región: ${radio.region}`);
          console.log(`      Estado: ${radio.status}`);
          console.log('');
        });
      }
    } else {
      console.log(`✅ Encontradas ${pilmaiquenRadios.length} radios relacionadas con Pilmaiquen:`);
      console.log('');
      
      pilmaiquenRadios.forEach(radio => {
        console.log(`📻 ${radio.name} (${radio.id})`);
        console.log(`   🌐 URL: ${radio.stream_url}`);
        console.log(`   📍 Región: ${radio.region}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log(`   📝 Descripción: ${radio.description || 'Sin descripción'}`);
        console.log('');
      });
    }
    
    // También buscar por otras variantes
    const alternativeSearches = ['pilmaiquén', 'pilmaiquen'];
    
    alternativeSearches.forEach(searchTerm => {
      const results = radios.filter(radio => 
        radio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (radio.description && radio.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      if (results.length > 0 && searchTerm !== 'pilmaiquen') {
        console.log(`🔍 Búsqueda alternativa "${searchTerm}":`);
        results.forEach(radio => {
          console.log(`   📻 ${radio.name} (${radio.id})`);
          console.log(`      URL: ${radio.stream_url}`);
          console.log(`      Región: ${radio.region}`);
          console.log(`      Estado: ${radio.status}`);
          console.log('');
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error al buscar Radio Pilmaiquen:', error.message);
  }
}

// Ejecutar la búsqueda
findRadioPilmaiquen();