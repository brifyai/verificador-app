// Script para verificar el funcionamiento del filtro de regiones
const axios = require('axios');

async function testRegionFilter() {
  try {
    // Obtener la página de radios
    const response = await axios.get('http://localhost:3000/radios', {
      headers: {
        'Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkB2ZXJpZmljYWRvci5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMxNDQwMDAsImV4cCI6MTczMzIzMDQwMH0.jc_BSSX1RCsM_8zJspGf0w3tW5s1vOFQm2LqO8bDk3c'
      }
    });
    
    // Buscar en el HTML si aparece "Todas las regiones" en el filtro
    const html = response.data;
    
    if (html.includes('Todas las regiones')) {
      console.log('✅ ÉXITO: La opción "Todas las regiones" aparece en el filtro');
      
      // Verificar si el filtro está configurado correctamente
      if (html.includes('value="all"')) {
        console.log('✅ ÉXITO: El valor "all" está presente en el filtro');
      } else {
        console.log('⚠️  ADVERTENCIA: El valor "all" no se encontró en el filtro');
      }
      
      // Verificar si hay radios cargadas
      if (html.includes('Región Metropolitana') || html.includes('Antofagasta')) {
        console.log('✅ ÉXITO: Se están mostrando radios de diferentes regiones');
      } else {
        console.log('ℹ️  INFO: No se encontraron radios específicas en la respuesta');
      }
      
    } else {
      console.log('❌ ERROR: La opción "Todas las regiones" no aparece en el filtro');
      console.log('Buscando el filtro de región en el HTML...');
      
      // Buscar el select de regiones
      const regionSelectMatch = html.match(/<select[^>]*>.*?<\/select>/gs);
      if (regionSelectMatch) {
        console.log('Filtros de región encontrados:', regionSelectMatch.length);
        regionSelectMatch.forEach((select, index) => {
          console.log(`Filtro ${index + 1}:`, select.substring(0, 200) + '...');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error al verificar el filtro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data.substring(0, 500));
    }
  }
}

testRegionFilter();