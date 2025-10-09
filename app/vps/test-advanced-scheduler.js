#!/usr/bin/env node

/**
 * Script de prueba para el Advanced Radio Scheduler
 * 
 * Este script crea programaciones de prueba para verificar que el scheduler
 * funciona correctamente con diferentes días y horarios.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Test del Advanced Radio Scheduler');
console.log('=' .repeat(50));

// Crear directorio de configuración si no existe
const configDir = './config';
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log('📁 Directorio config creado');
}

// Datos de prueba
const testSchedules = [
  {
    name: 'Test Diario - Mañana',
    data: {
      userId: 'test_user_1',
      radios: [
        {
          id: 'radio_test_1',
          name: 'Radio Test FM',
          streamUrl: 'http://playerservices.streamtheworld.com/api/livestream-redirect/COOPERATIVAAAC.aac',
          region: 'RM',
          hasValidUrl: true
        },
        {
          id: 'radio_test_2', 
          name: 'Radio Prueba',
          streamUrl: 'http://playerservices.streamtheworld.com/api/livestream-redirect/CONCIERTOAAC.aac',
          region: 'Valparaíso',
          hasValidUrl: true
        }
      ],
      days: [1, 2, 3, 4, 5], // Lunes a Viernes
      schedule: {
        startTime: '08:00',
        endTime: '08:05', // 5 minutos para prueba
        duration: 300 // 5 minutos en segundos
      },
      phrase: {
        id: 'test_phrase_1',
        text: 'Radio Cooperativa',
        brand: 'Cooperativa',
        campaign: 'Test Campaign',
        category: 'BRAND',
        description: 'Frase de prueba'
      },
      detection: {
        aiModel: 'estandar',
        language: 'es',
        autoTranscription: true,
        phraseDetection: true
      },
      metadata: {
        description: 'Programación de prueba - Mañana',
        createdAt: new Date().toISOString(),
        totalRadios: 2,
        source: 'test_script',
        estimatedCost: 50
      }
    }
  },
  {
    name: 'Test Fines de Semana',
    data: {
      userId: 'test_user_2',
      radios: [
        {
          id: 'radio_weekend',
          name: 'Radio Weekend',
          streamUrl: 'http://playerservices.streamtheworld.com/api/livestream-redirect/COOPERATIVAAAC.aac',
          region: 'Santiago',
          hasValidUrl: true
        }
      ],
      days: [6, 0], // Sábado y Domingo
      schedule: {
        startTime: '10:00',
        endTime: '10:03', // 3 minutos para prueba
        duration: 180
      },
      phrase: {
        id: 'test_phrase_weekend',
        text: 'fin de semana',
        brand: 'Test Brand',
        campaign: 'Weekend Test',
        category: 'PROMO',
        description: 'Frase de prueba fin de semana'
      },
      detection: {
        aiModel: 'premium',
        language: 'es',
        autoTranscription: true,
        phraseDetection: true
      },
      metadata: {
        description: 'Programación de prueba - Fin de semana',
        createdAt: new Date().toISOString(),
        totalRadios: 1,
        source: 'test_script',
        estimatedCost: 25
      }
    }
  },
  {
    name: 'Test Horario Nocturno',
    data: {
      userId: 'test_user_3',
      radios: [
        {
          id: 'radio_night',
          name: 'Radio Nocturna',
          streamUrl: 'http://playerservices.streamtheworld.com/api/livestream-redirect/CONCIERTOAAC.aac',
          region: 'Concepción',
          hasValidUrl: true
        }
      ],
      days: [1, 3, 5], // Lunes, Miércoles, Viernes
      schedule: {
        startTime: '23:58', // Casi medianoche para probar
        endTime: '23:59', // 1 minuto
        duration: 60
      },
      phrase: {
        id: 'test_phrase_night',
        text: 'programa nocturno',
        brand: 'Night Radio',
        campaign: 'Night Test',
        category: 'PROGRAM',
        description: 'Frase de prueba nocturna'
      },
      detection: {
        aiModel: 'estandar',
        language: 'es',
        autoTranscription: true,
        phraseDetection: true
      },
      metadata: {
        description: 'Programación de prueba - Nocturna',
        createdAt: new Date().toISOString(),
        totalRadios: 1,
        source: 'test_script',
        estimatedCost: 10
      }
    }
  }
];

// Función para crear programación de prueba inmediata
function createImmediateTest() {
  const now = new Date();
  const testTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutos desde ahora
  
  const immediateTest = {
    userId: 'test_immediate',
    radios: [
      {
        id: 'radio_immediate',
        name: 'Radio Test Inmediato',
        streamUrl: 'http://playerservices.streamtheworld.com/api/livestream-redirect/COOPERATIVAAAC.aac',
        region: 'Test',
        hasValidUrl: true
      }
    ],
    days: [now.getDay()], // Día actual
    schedule: {
      startTime: `${testTime.getHours().toString().padStart(2, '0')}:${testTime.getMinutes().toString().padStart(2, '0')}`,
      endTime: `${testTime.getHours().toString().padStart(2, '0')}:${(testTime.getMinutes() + 1).toString().padStart(2, '0')}`,
      duration: 60 // 1 minuto
    },
    phrase: {
      id: 'test_immediate_phrase',
      text: 'test inmediato',
      brand: 'Test Immediate',
      campaign: 'Immediate Test',
      category: 'TEST',
      description: 'Prueba inmediata del scheduler'
    },
    detection: {
      aiModel: 'estandar',
      language: 'es',
      autoTranscription: true,
      phraseDetection: true
    },
    metadata: {
      description: `Prueba inmediata - se ejecutará a las ${testTime.toLocaleTimeString()}`,
      createdAt: new Date().toISOString(),
      totalRadios: 1,
      source: 'immediate_test',
      estimatedCost: 5
    }
  };

  return {
    name: `Test Inmediato - ${testTime.toLocaleTimeString()}`,
    data: immediateTest
  };
}

// Crear archivos de programación
function createTestSchedules() {
  console.log('📝 Creando programaciones de prueba...\n');

  // Agregar test inmediato
  const immediateTest = createImmediateTest();
  testSchedules.unshift(immediateTest);

  testSchedules.forEach((schedule, index) => {
    const timestamp = Date.now() + index;
    const scheduleId = `schedule_${schedule.data.userId}_${timestamp}`;
    const filePath = path.join(configDir, `${scheduleId}.json`);
    
    // Agregar ID y timestamp
    const enrichedData = {
      ...schedule.data,
      id: scheduleId,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    fs.writeFileSync(filePath, JSON.stringify(enrichedData, null, 2));
    
    console.log(`✅ ${schedule.name}`);
    console.log(`   📁 Archivo: ${scheduleId}.json`);
    console.log(`   👤 Usuario: ${schedule.data.userId}`);
    console.log(`   📻 Radios: ${schedule.data.radios.length}`);
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const daysList = schedule.data.days.map(d => dayNames[d]).join(', ');
    console.log(`   📅 Días: ${daysList}`);
    console.log(`   ⏰ Horario: ${schedule.data.schedule.startTime} - ${schedule.data.schedule.endTime}`);
    console.log(`   🔍 Frase: "${schedule.data.phrase.text}"`);
    console.log('');
  });
}

// Función para mostrar instrucciones
function showInstructions() {
  console.log('📋 Instrucciones para probar:');
  console.log('=' .repeat(50));
  console.log('');
  console.log('1. Iniciar el servidor VPS:');
  console.log('   npm start');
  console.log('');
  console.log('2. O iniciar solo el scheduler:');
  console.log('   node advanced-scheduler.js');
  console.log('');
  console.log('3. Verificar estado:');
  console.log('   curl http://localhost:3000/api/status');
  console.log('');
  console.log('4. Ver programaciones activas:');
  console.log('   curl http://localhost:3000/api/schedules');
  console.log('');
  console.log('5. Ver grabaciones activas:');
  console.log('   curl http://localhost:3000/api/recordings/active');
  console.log('');
  console.log('⚠️  Nota: Las grabaciones requieren FFmpeg instalado');
  console.log('');
  console.log('🗂️  Los archivos de configuración están en: ./config/');
  console.log('🎵 Las grabaciones se guardarán en: ./recordings/');
  console.log('📝 Los logs se guardarán en: ./logs/');
}

// Función para limpiar tests anteriores
function cleanupPreviousTests() {
  try {
    const files = fs.readdirSync(configDir);
    const testFiles = files.filter(file => 
      file.includes('test_user') || file.includes('test_immediate')
    );
    
    if (testFiles.length > 0) {
      console.log('🧹 Limpiando tests anteriores...');
      testFiles.forEach(file => {
        fs.unlinkSync(path.join(configDir, file));
        console.log(`   🗑️  Eliminado: ${file}`);
      });
      console.log('');
    }
  } catch (error) {
    // Ignorar errores de limpieza
  }
}

// Ejecutar
function main() {
  try {
    cleanupPreviousTests();
    createTestSchedules();
    showInstructions();
    
    console.log('✅ Tests creados correctamente');
    console.log(`📊 Total de programaciones de prueba: ${testSchedules.length}`);
    
  } catch (error) {
    console.error('❌ Error creando tests:', error.message);
    process.exit(1);
  }
}

// Verificar si se ejecuta directamente
if (require.main === module) {
  main();
}

module.exports = { createTestSchedules, cleanupPreviousTests };
