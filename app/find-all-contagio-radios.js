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

// Función para buscar todas las radios relacionadas con contagio o sonic.streamingchilenos.com
async function findAllRelatedRadios() {
  const token = getToken();
  
  try {
    console.log('🔍 Buscando todas las radios relacionadas con contagio o sonic.streamingchilenos.com...');
    
    // Obtener todas las radios
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
    
    // Buscar radios que contengan "contagio" en el nombre
    const contagioRadios = result.data.filter(radio => 
      radio.name && radio.name.toLowerCase().includes('contagio')
    );
    
    // Buscar radios que usen sonic.streamingchilenos.com
    const sonicRadios = result.data.filter(radio => 
      radio.streamUrl && radio.streamUrl.includes('sonic.streamingchilenos.com')
    );
    
    console.log('\n📻 Radios con "contagio" en el nombre:');
    if (contagioRadios.length > 0) {
      contagioRadios.forEach(radio => {
        console.log(`  - ${radio.name} (${radio.id}):`);
        console.log(`    URL: ${radio.streamUrl}`);
        console.log(`    Estado: ${radio.lastVerificationStatus}`);
        console.log(`    Plataforma: ${radio.streamPlatform}`);
        console.log(`    Región: ${radio.region}, ${radio.city}`);
        console.log(`    Última verificación: ${radio.lastVerifiedAt}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No se encontraron radios con "contagio" en el nombre');
    }
    
    console.log('\n📻 Radios con sonic.streamingchilenos.com:');
    if (sonicRadios.length > 0) {
      sonicRadios.forEach(radio => {
        console.log(`  - ${radio.name} (${radio.id}):`);
        console.log(`    URL: ${radio.streamUrl}`);
        console.log(`    Estado: ${radio.lastVerificationStatus}`);
        console.log(`    Plataforma: ${radio.streamPlatform}`);
        console.log(`    Región: ${radio.region}, ${radio.city}`);
        console.log(`    Última verificación: ${radio.lastVerifiedAt}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No se encontraron radios con sonic.streamingchilenos.com');
    }
    
    // Verificar si alguna fue actualizada recientemente
    const recentlyUpdated = [...contagioRadios, ...sonicRadios].filter(radio => {
      if (!radio.updatedAt) return false;
      const updatedTime = new Date(radio.updatedAt).getTime();
      const currentTime = new Date().getTime();
      const minutesAgo = (currentTime - updatedTime) / (1000 * 60);
      return minutesAgo < 10; // Actualizada en los últimos 10 minutos
    });
    
    if (recentlyUpdated.length > 0) {
      console.log('\n✅ Radios actualizadas recientemente:');
      recentlyUpdated.forEach(radio => {
        console.log(`  - ${radio.name} (${radio.id}): ${radio.updatedAt}`);
      });
    }
    
  } catch (error) {
    console.error('Error al buscar radios:', error);
  }
}

// Ejecutar
findAllRelatedRadios();