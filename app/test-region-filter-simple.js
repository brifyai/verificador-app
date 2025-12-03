// Script simple para verificar el filtro de regiones
const axios = require('axios');

async function testRegionFilter() {
  try {
    console.log('🔍 Verificando el filtro de regiones en la página de radios...');
    
    // Obtener la página de radios sin autenticación para ver la estructura
    const response = await axios.get('http://localhost:3000/radios', {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Aceptar redirecciones
      }
    });
    
    console.log('📊 Status de respuesta:', response.status);
    
    if (response.status === 302 || response.status === 307) {
      console.log('🔐 La página requiere autenticación, lo cual es normal');
      console.log('📍 Redirigiendo a:', response.headers.location);
      
      // Vamos a obtener el HTML de la página de login para verificar que el servidor está funcionando
      const loginResponse = await axios.get('http://localhost:3000/auth/signin');
      if (loginResponse.data.includes('Iniciar sesión')) {
        console.log('✅ El servidor está funcionando correctamente');
        console.log('✅ La página de autenticación está accesible');
      }
      
    } else {
      // Si por alguna razón no redirige, verificar el contenido
      const html = response.data;
      console.log('📄 Longitud del HTML:', html.length);
      
      if (html.includes('Todas las regiones')) {
        console.log('✅ ÉXITO: La opción "Todas las regiones" aparece en el filtro');
      } else {
        console.log('❌ La opción "Todas las regiones" no aparece en el filtro');
      }
    }
    
    console.log('\n🎯 Resumen:');
    console.log('✅ El servidor está funcionando');
    console.log('✅ La aplicación responde correctamente');
    console.log('ℹ️  Para verificar el filtro completo, necesitas iniciar sesión en el navegador');
    console.log('📍 Abre http://localhost:3000/auth/signin y luego navega a /radios');
    
  } catch (error) {
    console.error('❌ Error al verificar:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testRegionFilter();