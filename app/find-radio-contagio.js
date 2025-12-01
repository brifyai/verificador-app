const fs = require('fs');
const path = require('path');

// Leer el token desde el archivo
function getToken() {
  const tokenPaths = [
    path.join(__dirname, 'admin-token.txt'),
    path.join(__dirname, 'valid-token.txt')
  ];
  
  for (const tokenPath of tokenPaths) {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf8').trim();
    }
  }
  throw new Error('No se encontró token de autenticación');
}

// Función para buscar Radio Contagio
async function findRadioContagio() {
  const token = getToken();
  
  try {
    console.log('🔍 Buscando Radio Contagio en la base de datos...');
    
    const response = await fetch('http://localhost:3000/api/radios-direct?limit=500', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener radios: ${response.status}`);
    }

    const radios = await response.json();
    console.log(`📊 Total de radios encontradas: ${radios.length}`);
    
    // Buscar Radio Contagio por ID
    const radioContagio = radios.find(radio => radio.id === 'radio_mijm9yge_lagcxh3');
    
    if (radioContagio) {
      console.log('✅ ¡Radio Contagio encontrada!');
      console.log('📊 Información de Radio Contagio:');
      console.log(`   ID: ${radioContagio.id}`);
      console.log(`   Nombre: ${radioContagio.name || 'Sin nombre'}`);
      console.log(`   URL: ${radioContagio.stream_url || 'Sin URL'}`);
      console.log(`   Estado: ${radioContagio.status || 'Sin estado'}`);
      console.log(`   Región: ${radioContagio.region || 'Sin región'}`);
      console.log(`   Última verificación: ${radioContagio.last_verified || 'Nunca'}`);
      
      return radioContagio;
    } else {
      console.log('❌ Radio Contagio no encontrada con ID: radio_mijm9yge_lagcxh3');
      
      // Buscar por nombre o URL
      const possibleMatches = radios.filter(radio => 
        (radio.name && radio.name.toLowerCase().includes('contagio')) ||
        (radio.stream_url && radio.stream_url.includes('sonic.streamingchilenos.com'))
      );
      
      if (possibleMatches.length > 0) {
        console.log('🤔 Posibles coincidencias encontradas:');
        possibleMatches.forEach(radio => {
          console.log(`   - ID: ${radio.id}, Nombre: ${radio.name || 'Sin nombre'}, URL: ${radio.stream_url || 'Sin URL'}`);
        });
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error al buscar Radio Contagio:', error);
    return null;
  }
}

// Ejecutar
findRadioContagio().then(radio => {
  if (radio) {
    console.log('\n✅ Radio Contagio encontrada en la base de datos');
  } else {
    console.log('\n❌ Radio Contagio no encontrada en la base de datos');
  }
}).catch(console.error);