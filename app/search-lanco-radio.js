#!/usr/bin/env node

// Script para buscar LANCO FM en la base de datos con diferentes criterios

require('dotenv').config();

async function searchLancoRadio() {
  console.log('🔍 Buscando LANCO FM en la base de datos...\n');
  
  try {
    // Importar el cliente directo
    const { supabaseDirect } = require('./lib/supabase-direct');
    
    // Verificar conexión
    console.log('🔍 Verificando conexión con Supabase...');
    const connectionTest = await supabaseDirect.testConnection();
    if (!connectionTest.success) {
      console.error('❌ Error de conexión:', connectionTest.message);
      return;
    }
    console.log('✅ Conexión exitosa');
    
    // Buscar con diferentes criterios
    const searchCriteria = [
      { field: 'name', value: 'LANCO FM', description: 'Nombre exacto' },
      { field: 'name', value: 'Lanco', description: 'Nombre parcial' },
      { field: 'city', value: 'LANCO', description: 'Ciudad' },
      { field: 'city', value: 'Lanco', description: 'Ciudad (minúsculas)' },
      { field: 'region', value: 'Los Ríos', description: 'Región' },
      { field: 'stream_url', value: 'chiloestreaming.com:10989', description: 'URL actual' },
      { field: 'stream_url', value: 'chiloestreaming.com', description: 'Dominio chiloestreaming' }
    ];
    
    let foundRadios = [];
    
    for (const criteria of searchCriteria) {
      console.log(`\n🔍 Buscando por ${criteria.description}: ${criteria.value}`);
      
      try {
        const radios = await supabaseDirect.getRadios({ 
          limit: 100,
          search: criteria.value
        });
        
        if (radios.length > 0) {
          console.log(`✅ Encontradas ${radios.length} radios`);
          
          // Filtrar resultados relevantes
          const relevantRadios = radios.filter(radio => {
            return radio[criteria.field]?.toLowerCase().includes(criteria.value.toLowerCase()) ||
                   radio.name.toLowerCase().includes('lanco') ||
                   radio.city.toLowerCase().includes('lanco') ||
                   radio.stream_url.includes('chiloestreaming.com:10989');
          });
          
          if (relevantRadios.length > 0) {
            console.log(`📻 Radios relevantes encontradas:`);
            relevantRadios.forEach(radio => {
              console.log(`   - ${radio.name} (${radio.city}, ${radio.region})`);
              console.log(`     URL: ${radio.stream_url}`);
              console.log(`     Estado: ${radio.status}`);
              console.log(`     ID: ${radio.id}`);
              console.log('');
              
              foundRadios.push({
                ...radio,
                foundBy: criteria.description
              });
            });
          }
        } else {
          console.log('❌ No se encontraron radios');
        }
        
      } catch (error) {
        console.log(`❌ Error en búsqueda: ${error.message}`);
      }
      
      // Pequeña pausa entre búsquedas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Eliminar duplicados
    const uniqueRadios = foundRadios.filter((radio, index, self) => 
      index === self.findIndex(r => r.id === radio.id)
    );
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN DE BÚSQUEDA');
    console.log(`${'='.repeat(60)}`);
    
    if (uniqueRadios.length > 0) {
      console.log(`🎉 Se encontraron ${uniqueRadios.length} radios únicas relacionadas con LANCO:`);
      
      uniqueRadios.forEach((radio, index) => {
        console.log(`\n${index + 1}. ${radio.name}`);
        console.log(`   📍 ${radio.city}, ${radio.region}`);
        console.log(`   🔗 URL: ${radio.stream_url}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log(`   🆔 ID: ${radio.id}`);
        console.log(`   🔍 Encontrado por: ${radio.foundBy}`);
        
        // Verificar si es el que queremos actualizar
        if (radio.stream_url.includes('10989')) {
          console.log(`   ⚠️  Esta es la radio con la URL problemática que queremos actualizar!`);
        }
      });
      
      // Encontrar la radio con URL problemática
      const problematicRadio = uniqueRadios.find(radio => 
        radio.stream_url.includes('chiloestreaming.com:10989')
      );
      
      if (problematicRadio) {
        console.log(`\n🎯 RADIO A ACTUALIZAR ENCONTRADA:`);
        console.log(`   Nombre: ${problematicRadio.name}`);
        console.log(`   ID: ${problematicRadio.id}`);
        console.log(`   URL actual: ${problematicRadio.stream_url}`);
        console.log(`   Nueva URL propuesta: https://streaming.chiloestreaming.com:10995/;stream.mp3`);
        
        // Preguntar si actualizar
        console.log(`\n¿Deseas actualizar esta radio con la nueva URL?`);
        console.log(`Ejecuta el siguiente comando para actualizar:`);
        console.log(`node update-specific-radio.js ${problematicRadio.id} "https://streaming.chiloestreaming.com:10995/;stream.mp3"`);
        
      } else {
        console.log(`\n⚠️  No se encontró ninguna radio con la URL problemática de chiloestreaming.com:10989`);
        console.log(`Pero se encontraron estas radios relacionadas con LANCO.`);
      }
      
    } else {
      console.log('❌ No se encontraron radios relacionadas con LANCO');
      console.log('\n💡 Sugerencias:');
      console.log('1. Verificar que la estación exista en la base de datos');
      console.log('2. Buscar con otros criterios (nombre alternativo, ciudad cercana)');
      console.log('3. Verificar si la estación fue eliminada o desactivada');
      console.log('4. Crear la estación si no existe');
    }
    
    // Mostrar todas las radios de Los Ríos para referencia
    console.log(`\n${'='.repeat(60)}`);
    console.log('📻 TODAS LAS RADIOS DE LA REGIÓN DE LOS RÍOS');
    console.log(`${'='.repeat(60)}`);
    
    try {
      const allRadios = await supabaseDirect.getRadios({ limit: 1000 });
      const losRiosRadios = allRadios.filter(radio => radio.region === 'Los Ríos');
      
      console.log(`Encontradas ${losRiosRadios.length} radios en Los Ríos:`);
      
      losRiosRadios.forEach((radio, index) => {
        console.log(`${index + 1}. ${radio.name} - ${radio.city}`);
        if (radio.stream_url.includes('chiloestreaming')) {
          console.log(`   🔗 ${radio.stream_url}`);
        }
      });
      
    } catch (error) {
      console.log('❌ Error obteniendo radios de Los Ríos:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar
searchLancoRadio().catch(console.error);