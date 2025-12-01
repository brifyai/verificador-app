// Script para verificar la leyenda de colores en el navegador
// COPIA Y PEGA ESTE CÓDIGO EN LA CONSOLA DEL NAVEGADOR en http://localhost:3000/radios

(function() {
  console.log('🎨 TEST DE LEYENDA DE COLORES');
  console.log('=====================================');
  
  // Buscar el contenedor de la leyenda
  const legendContainer = document.querySelector('.flex.flex-wrap.items-center.gap-4.text-xs.text-gray-400');
  
  if (legendContainer) {
    console.log('✅ Leyenda encontrada!');
    console.log('📍 Ubicación:', legendContainer);
    
    // Obtener todos los elementos de la leyenda
    const legendItems = legendContainer.querySelectorAll('.flex.items-center.gap-2');
    
    if (legendItems.length > 0) {
      console.log(`📊 Se encontraron ${legendItems.length} elementos en la leyenda:`);
      
      legendItems.forEach((item, index) => {
        const circle = item.querySelector('.w-2.h-2.rounded-full');
        const text = item.textContent.trim();
        
        let color = 'desconocido';
        if (circle) {
          const classes = circle.className;
          if (classes.includes('bg-green-500')) color = '🟢 verde (Online)';
          else if (classes.includes('bg-red-500')) color = '🔴 rojo (Offline)';
          else if (classes.includes('bg-yellow-500')) color = '🟡 amarillo (Activo sin verificar)';
          else if (classes.includes('bg-gray-300')) color = '⚪ gris (Inactivo)';
        }
        
        console.log(`  ${index + 1}. ${color}: "${text}"`);
      });
      
      console.log('\n✅ RESUMEN: La leyenda de colores está funcionando correctamente');
      console.log('📝 Los colores representan el estado de verificación de cada radio');
      
    } else {
      console.log('❌ No se encontraron elementos de leyenda dentro del contenedor');
    }
    
  } else {
    console.log('❌ Leyenda NO encontrada');
    console.log('🔍 Buscando contenedores similares...');
    
    // Buscar otros contenedores que podrían contener la leyenda
    const possibleContainers = document.querySelectorAll('.flex.flex-wrap.items-center.gap-4');
    console.log(`Se encontraron ${possibleContainers.length} contenedores similares:`);
    
    possibleContainers.forEach((container, index) => {
      console.log(`  ${index + 1}.`, container);
      console.log(`     Texto: "${container.textContent.trim().substring(0, 100)}..."`);
    });
  }
  
  console.log('\n📋 VERIFICACIÓN MANUAL:');
  console.log('Busca debajo del buscador de radios una línea que diga:');
  console.log('🟢 Online 🔴 Offline 🟡 Activo sin verificar ⚪ Inactivo');
  
})();

// Instrucciones para el usuario
console.log(`
🎯 INSTRUCCIONES:
1. Abre http://localhost:3000/radios
2. Abre la consola del navegador (F12 → Consola)
3. Copia y pega este código completo
4. Presiona Enter para ejecutar
5. Verifica que aparezca la leyenda con los 4 colores
`);