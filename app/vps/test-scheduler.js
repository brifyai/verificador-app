// Script para probar el sistema de scheduler
const RadioScheduler = require('./scheduler');
const fs = require('fs');
const path = require('path');

async function testScheduler() {
  console.log('🧪 PROBANDO SISTEMA DE SCHEDULER');
  console.log('='.repeat(50));

  // Crear directorios de prueba
  const testConfigDir = './test-config';
  const testRecordingsDir = './test-recordings';
  
  if (!fs.existsSync(testConfigDir)) {
    fs.mkdirSync(testConfigDir, { recursive: true });
  }
  if (!fs.existsSync(testRecordingsDir)) {
    fs.mkdirSync(testRecordingsDir, { recursive: true });
  }

  // Crear scheduler de prueba
  const scheduler = new RadioScheduler(testConfigDir, testRecordingsDir);

  // Crear una programación de prueba que se ejecute en 1 minuto
  const now = new Date();
  const testTime = new Date(now.getTime() + 60000); // 1 minuto desde ahora
  const testHour = testTime.getHours();
  const testMinute = testTime.getMinutes();
  const testDay = testTime.getDay(); // Día de la semana actual

  const testSchedule = {
    userId: 'test-user',
    radios: [
      {
        id: 'test-radio-1',
        name: 'Radio Prueba 1',
        streamUrl: 'http://unlimited5-cl.dps.live/cooperativa/aac/icecast.audio', // URL real para prueba
        region: 'RM'
      }
    ],
    days: [testDay], // Día actual
    schedule: {
      startTime: `${testHour.toString().padStart(2, '0')}:${testMinute.toString().padStart(2, '0')}`,
      endTime: `${testHour.toString().padStart(2, '0')}:${(testMinute + 1).toString().padStart(2, '0')}`, // 1 minuto de duración
      duration: 60 // 60 segundos
    },
    phrase: {
      id: 'test-phrase',
      text: 'noticias',
      brand: 'Test Brand',
      campaign: 'Test Campaign'
    },
    metadata: {
      description: 'Prueba automática del scheduler',
      createdAt: new Date().toISOString(),
      source: 'test-script'
    }
  };

  // Guardar programación de prueba
  const scheduleFile = path.join(testConfigDir, 'schedule_test_' + Date.now() + '.json');
  fs.writeFileSync(scheduleFile, JSON.stringify(testSchedule, null, 2));

  console.log('📅 Programación de prueba creada:');
  console.log(`   📁 Archivo: ${scheduleFile}`);
  console.log(`   ⏰ Se ejecutará a las: ${testSchedule.schedule.startTime}`);
  console.log(`   📻 Radio: ${testSchedule.radios[0].name}`);
  console.log(`   🔍 Frase: "${testSchedule.phrase.text}"`);
  console.log(`   ⏱️ Duración: ${testSchedule.schedule.duration} segundos`);

  // Esperar a que el scheduler cargue la nueva programación
  console.log('\n⏳ Esperando que el scheduler detecte la nueva programación...');
  
  setTimeout(() => {
    const scheduledJobs = scheduler.getScheduledJobs();
    console.log(`✅ Programaciones cargadas: ${scheduledJobs.length}`);
    
    if (scheduledJobs.length > 0) {
      console.log('📋 Programaciones activas:', scheduledJobs);
    }
    
    // Monitorear grabaciones activas cada 10 segundos
    const monitor = setInterval(() => {
      const activeRecordings = scheduler.getActiveRecordings();
      
      if (activeRecordings.length > 0) {
        console.log(`🎙️ Grabaciones activas: ${activeRecordings.length}`);
        activeRecordings.forEach(recording => {
          console.log(`   📻 ${recording.radio} - Iniciada: ${recording.startTime.toLocaleTimeString()}`);
        });
      } else {
        console.log('⏸️ No hay grabaciones activas');
      }
    }, 10000);
    
    // Detener monitoreo después de 5 minutos
    setTimeout(() => {
      clearInterval(monitor);
      console.log('\n🏁 Prueba completada');
      
      // Limpiar archivos de prueba
      try {
        fs.unlinkSync(scheduleFile);
        fs.rmdirSync(testConfigDir);
        console.log('🧹 Archivos de prueba eliminados');
      } catch (error) {
        console.log('⚠️ Error limpiando archivos de prueba:', error.message);
      }
      
      process.exit(0);
    }, 300000); // 5 minutos
    
  }, 5000); // 5 segundos para que cargue

  console.log('\n💡 Consejos para la prueba:');
  console.log('   - La grabación debería iniciarse automáticamente en 1 minuto');
  console.log('   - Verifica que ffmpeg esté instalado');
  console.log('   - La URL del stream debe ser válida');
  console.log('   - Los archivos se guardarán en ./test-recordings/');
  console.log('\n⏰ Esperando...');
}

// Función para crear una programación de prueba inmediata
function createImmediateTest() {
  const now = new Date();
  const testMinute = now.getMinutes() + 1; // Próximo minuto
  const testHour = now.getHours();
  
  return {
    userId: 'immediate-test',
    radios: [
      {
        id: 'immediate-radio',
        name: 'Radio Inmediata',
        streamUrl: 'http://unlimited6-cl.dps.live/biobio/aac/icecast.audio',
        region: 'RM'
      }
    ],
    days: [now.getDay()],
    schedule: {
      startTime: `${testHour.toString().padStart(2, '0')}:${testMinute.toString().padStart(2, '0')}`,
      endTime: `${testHour.toString().padStart(2, '0')}:${(testMinute + 1).toString().padStart(2, '0')}`,
      duration: 30 // 30 segundos para prueba rápida
    },
    phrase: {
      id: 'immediate-phrase',
      text: 'radio',
      brand: 'Test Inmediato',
      campaign: 'Prueba Rápida'
    }
  };
}

if (require.main === module) {
  testScheduler().catch(console.error);
}

module.exports = { testScheduler, createImmediateTest };
