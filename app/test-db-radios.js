// Script para probar las URLs de radios desde la base de datos
const fetch = require('node-fetch');

async function testRadiosFromDB() {
  try {
    console.log('🔍 Verificando radios desde la base de datos...');
    
    // Llamar al endpoint que verifica las radios
    const response = await fetch('http://localhost:3000/api/radios/check-urls');
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('\n📊 ESTADÍSTICAS DE RADIOS:');
    console.log('='.repeat(50));
    console.log(`📻 Total de radios: ${data.stats.total}`);
    console.log(`✅ Radios activas: ${data.stats.active}`);
    console.log(`🔗 Con URL válida: ${data.stats.withUrl}`);
    console.log(`🎯 Listas para monitoreo: ${data.stats.readyForMonitoring}`);
    
    if (data.readyForMonitoring.length > 0) {
      console.log('\n✅ RADIOS LISTAS PARA MONITOREO:');
      console.log('='.repeat(50));
      data.readyForMonitoring.forEach((radio, index) => {
        console.log(`${index + 1}. 📻 ${radio.name}`);
        console.log(`   🆔 ID: ${radio.id}`);
        console.log(`   📍 Región: ${radio.region}`);
        console.log(`   🔗 URL: ${radio.streamUrl}`);
        console.log(`   📄 Fuente: ${radio.urlSource}`);
        console.log('');
      });
    }
    
    if (data.problematicRadios.length > 0) {
      console.log('⚠️ RADIOS CON PROBLEMAS:');
      console.log('='.repeat(50));
      data.problematicRadios.forEach((radio, index) => {
        console.log(`${index + 1}. ❌ ${radio.name} (${radio.region})`);
        console.log(`   🆔 ID: ${radio.id}`);
        console.log(`   ⚠️ Problema: ${radio.issue}`);
        console.log('');
      });
    }
    
    console.log('💡 RECOMENDACIONES:');
    console.log('='.repeat(50));
    data.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    
    // Crear programación de prueba si hay radios disponibles
    if (data.readyForMonitoring.length > 0) {
      console.log('\n🧪 CREANDO PROGRAMACIÓN DE PRUEBA...');
      
      const testRadios = data.readyForMonitoring.slice(0, 2); // Tomar las primeras 2
      const now = new Date();
      const nextMinute = new Date(now.getTime() + 60000);
      const startTime = `${nextMinute.getHours().toString().padStart(2, '0')}:${nextMinute.getMinutes().toString().padStart(2, '0')}`;
      
      const testSchedule = {
        userId: `db-test-${Date.now()}`,
        radioIds: testRadios.map(r => r.id),
        phraseId: 'phrase_test', // Necesitarás un ID válido de frase
        days: [now.getDay()], // Día actual
        startTime: startTime,
        endTime: startTime, // Mismo tiempo para prueba corta
        aiModel: 'estandar',
        description: 'Prueba automática con radios de la base de datos'
      };
      
      console.log('📋 Datos de prueba:');
      console.log(JSON.stringify(testSchedule, null, 2));
      
      // Probar el endpoint de monitoreo
      try {
        const monitoringResponse = await fetch('http://localhost:3000/api/monitoring/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testSchedule)
        });
        
        const monitoringResult = await monitoringResponse.json();
        
        if (monitoringResponse.ok) {
          console.log('\n✅ PRUEBA DE MONITOREO EXITOSA:');
          console.log('📄 Respuesta:', JSON.stringify(monitoringResult, null, 2));
        } else {
          console.log('\n❌ ERROR EN PRUEBA DE MONITOREO:');
          console.log('📄 Error:', JSON.stringify(monitoringResult, null, 2));
        }
        
      } catch (error) {
        console.log('\n❌ Error probando endpoint de monitoreo:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('   - El servidor Next.js esté corriendo (npm run dev)');
    console.log('   - La base de datos esté conectada');
    console.log('   - Existan radios en la tabla "radio"');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testRadiosFromDB();
}

module.exports = { testRadiosFromDB };
