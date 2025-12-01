// Script para verificar regiones desde el navegador
// Este código debe ejecutarse en la consola del navegador en http://localhost:3000/radios

(function() {
  console.log('🔍 Verificando nombres de regiones en el frontend...');
  
  // Obtener todas las opciones del select de regiones
  let regionSelect = document.querySelector('select[name="region"], select[id*="region"], select[class*="region"]');
  
  if (!regionSelect) {
    console.log('❌ No se encontró el select de regiones');
    
    // Intentar encontrar cualquier select con opciones de regiones
    const allSelects = document.querySelectorAll('select');
    let foundRegionSelect = null;
    
    for (const select of allSelects) {
      const options = Array.from(select.options).map(opt => opt.text);
      if (options.some(text => text.toLowerCase().includes('valparaíso') || text.toLowerCase().includes('metropolitana'))) {
        foundRegionSelect = select;
        break;
      }
    }
    
    if (foundRegionSelect) {
      console.log('✅ Encontrado select de regiones:', foundRegionSelect);
      regionSelect = foundRegionSelect;
    } else {
      console.log('💡 Buscando en todos los elementos del DOM...');
      // Buscar cualquier elemento que mencione regiones
      const allElements = document.querySelectorAll('*');
      const regionElements = [];
      
      for (const element of allElements) {
        const text = element.textContent || '';
        if (text.toLowerCase().includes('valparaíso') || text.toLowerCase().includes('metropolitana')) {
          regionElements.push(element);
        }
      }
      
      console.log('Elementos que mencionan regiones:', regionElements.slice(0, 5));
      return;
    }
  }
  
  // Obtener todas las opciones de región
  const regionOptions = Array.from(regionSelect.options)
    .map(option => option.text.trim())
    .filter(text => text && !text.toLowerCase().includes('selecciona') && !text.toLowerCase().includes('todas'));
  
  console.log('\n📋 Regiones encontradas en el filtro:');
  console.log('=====================================');
  regionOptions.forEach((region, index) => {
    console.log(`${index + 1}. "${region}"`);
  });
  
  console.log('\n🎯 Análisis del orden solicitado:');
  console.log('=====================================');
  
  const valparaisoIndex = regionOptions.findIndex(region => 
    region.toLowerCase().includes('valparaíso')
  );
  
  const metropolitanaIndex = regionOptions.findIndex(region => 
    region.toLowerCase().includes('metropolitana')
  );
  
  const ohigginsIndex = regionOptions.findIndex(region => 
    region.toLowerCase().includes('o\'higgins') || region.toLowerCase().includes('ohiggins')
  );
  
  console.log(`Valparaíso está en posición: ${valparaisoIndex + 1}`);
  console.log(`Metropolitana está en posición: ${metropolitanaIndex + 1}`);
  console.log(`O'Higgins está en posición: ${ohigginsIndex + 1}`);
  
  if (valparaisoIndex < metropolitanaIndex && metropolitanaIndex < ohigginsIndex) {
    console.log('✅ El orden ES CORRECTO según lo solicitado');
  } else {
    console.log('❌ El orden NO es el solicitado');
    console.log('Se necesita: Valparaíso < Metropolitana < O\'Higgins');
  }
  
  console.log('\n💡 Para copiar los nombres exactos:');
  console.log('=====================================');
  console.log('const regionNames = ' + JSON.stringify(regionOptions, null, 2) + ';');
  
})();

// Instrucciones de uso:
// 1. Abre http://localhost:3000/radios
// 2. Abre la consola del navegador (F12)
// 3. Copia y pega este código completo
// 4. Presiona Enter para ejecutar