// Script de prueba para verificar la leyenda de colores en la página de radios
// Este script se ejecuta en la consola del navegador

console.log('🎨 TEST DE LEYENDA DE COLORES');
console.log('=====================================');

// Función para verificar si la leyenda existe
function checkColorLegend() {
  const legendContainer = document.querySelector('.flex.flex-wrap.items-center.gap-4.text-xs.text-gray-400');
  
  if (!legendContainer) {
    console.log('❌ No se encontró el contenedor de la leyenda');
    return false;
  }
  
  console.log('✅ Contenedor de leyenda encontrado');
  
  // Verificar cada elemento de la leyenda
  const legendItems = legendContainer.querySelectorAll('.flex.items-center.gap-1');
  
  if (legendItems.length !== 4) {
    console.log(`❌ Se esperaban 4 elementos de leyenda, se encontraron ${legendItems.length}`);
    return false;
  }
  
  console.log('✅ Se encontraron los 4 elementos de leyenda');
  
  // Verificar cada elemento específico
  const expectedItems = [
    { color: 'green-500', text: 'Online' },
    { color: 'red-500', text: 'Offline' },
    { color: 'yellow-500', text: 'Activo sin verificar' },
    { color: 'white', text: 'Inactivo' }
  ];
  
  let allCorrect = true;
  
  legendItems.forEach((item, index) => {
    const circle = item.querySelector('.lucide-circle');
    const text = item.querySelector('span')?.textContent;
    
    if (!circle) {
      console.log(`❌ Elemento ${index + 1}: No se encontró el círculo`);
      allCorrect = false;
      return;
    }
    
    if (!text) {
      console.log(`❌ Elemento ${index + 1}: No se encontró el texto`);
      allCorrect = false;
      return;
    }
    
    // Verificar que el texto coincida
    if (text !== expectedItems[index].text) {
      console.log(`❌ Elemento ${index + 1}: Texto esperado "${expectedItems[index].text}", encontrado "${text}"`);
      allCorrect = false;
      return;
    }
    
    // Verificar que el círculo tenga la clase de color correcta
    const hasCorrectColor = Array.from(circle.classList).some(className => 
      className.includes(expectedItems[index].color)
    );
    
    if (!hasCorrectColor) {
      console.log(`❌ Elemento ${index + 1}: Color esperado ${expectedItems[index].color}, clases encontradas:`, Array.from(circle.classList));
      allCorrect = false;
      return;
    }
    
    console.log(`✅ Elemento ${index + 1}: ${text} - ${expectedItems[index].color}`);
  });
  
  return allCorrect;
}

// Función principal de prueba
function runColorLegendTest() {
  console.log('1. Buscando leyenda de colores...');
  
  // Esperar un momento para que se renderice la página
  setTimeout(() => {
    const success = checkColorLegend();
    
    if (success) {
      console.log('\n🎉 ¡TEST COMPLETADO EXITOSAMENTE!');
      console.log('La leyenda de colores está correctamente implementada.');
      console.log('\nLeyenda encontrada:');
      console.log('🟢 Online - Radio verificada y funcionando');
      console.log('🔴 Offline - Radio verificada pero sin conexión');
      console.log('🟡 Activo sin verificar - Radio activa pero no verificada');
      console.log('⚪ Inactivo - Radio desactivada');
    } else {
      console.log('\n❌ TEST FALLIDO');
      console.log('La leyenda de colores no está correctamente implementada.');
    }
  }, 2000);
}

// Ejecutar el test
console.log('Ejecutando test de leyenda de colores...');
runColorLegendTest();

// Información adicional
console.log('\n📋 INSTRUCCIONES:');
console.log('- Abre http://localhost:3000/radios');
console.log('- Busca la leyenda debajo del buscador de radios');
console.log('- Deberías ver los 4 colores con sus descripciones');