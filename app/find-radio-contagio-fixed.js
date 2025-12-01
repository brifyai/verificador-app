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

// Función para buscar Radio Contagio en la base de datos
async function findRadioContagio() {
  const token = getToken();
  
  try {
    console.log('🔍 Buscando Radio Contagio en la base de datos...');
    
    // Primero obtener todas las radios (con límite alto para no paginar)
    const response = await fetch('http://localhost:3000/api/radios-direct?limit=500', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener radios: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('📊 Total de radios encontradas:', result.pagination?.total || 'Desconocido');
    
    if (!result.data || !Array.isArray(result.data)) {
      throw new Error('La respuesta no contiene datos válidos');
    }
    
    // Buscar Radio Contagio por nombre
    const radioContagio = result.data.find(radio => 
      radio.name && radio.name.toLowerCase().includes('contagio')
    );
    
    if (radioContagio) {
      console.log('✅ Radio Contagio encontrada:');
      console.log('📻 Nombre:', radioContagio.name);
      console.log('🆔 ID:', radioContagio.id);
      console.log('🔗 URL del stream:', radioContagio.streamUrl);
      console.log('📍 Región:', radioContagio.region);
      console.log('🏙️ Ciudad:', radioContagio.city);
      console.log('📊 Estado de verificación:', radioContagio.lastVerificationStatus);
      console.log('🕐 Última verificación:', radioContagio.lastVerifiedAt);
      console.log('📝 Plataforma:', radioContagio.streamPlatform);
      
      // Verificar si la URL coincide con la que estamos investigando
      if (radioContagio.streamUrl && radioContagio.streamUrl.includes('sonic.streamingchilenos.com:7113')) {
        console.log('⚠️  La URL actual contiene el puerto 7113 (el problema que estamos investigando)');
      } else if (radioContagio.streamUrl && radioContagio.streamUrl.includes('sonic.streamingchilenos.com:7114')) {
        console.log('✅ La URL ya fue actualizada al puerto 7114 (correcto)');
      }
      
      return radioContagio;
    } else {
      console.log('❌ Radio Contagio no encontrada en la base de datos');
      
      // Mostrar algunas radios que contengan "sonic.streamingchilenos.com" para ver si hay alguna relacionada
      const relatedRadios = result.data.filter(radio => 
        radio.streamUrl && radio.streamUrl.includes('sonic.streamingchilenos.com')
      );
      
      if (relatedRadios.length > 0) {
        console.log('\n📻 Radios con sonic.streamingchilenos.com encontradas:');
        relatedRadios.forEach(radio => {
          console.log(`  - ${radio.name}: ${radio.streamUrl} (${radio.lastVerificationStatus})`);
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
findRadioContagio();