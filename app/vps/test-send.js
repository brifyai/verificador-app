// Script de prueba para enviar programación a la VPS
const VPS_URL = process.env.VPS_URL || 'http://173.249.26.38:3000';

// Datos de prueba
const testScheduleData = {
  userId: "user123",
  radios: [
    {
      id: "radio1",
      name: "Radio Cooperativa",
      streamUrl: "http://unlimited5-cl.dps.live/cooperativa/aac/icecast.audio"
    },
    {
      id: "radio2", 
      name: "Radio Bío Bío",
      streamUrl: "http://unlimited6-cl.dps.live/biobio/aac/icecast.audio"
    }
  ],
  days: [1, 2, 3, 4, 5], // Lunes a Viernes
  schedule: {
    startTime: "08:00",
    endTime: "08:05", // 5 minutos para prueba
    duration: 300 // 5 minutos en segundos
  },
  metadata: {
    description: "Grabación de prueba - noticias matutinas",
    tags: ["noticias", "mañana"]
  }
};

async function sendTestSchedule() {
  try {
    console.log('📡 Enviando programación de prueba a VPS...');
    console.log('🎯 URL:', `${VPS_URL}/api/schedule`);
    console.log('📋 Datos:', JSON.stringify(testScheduleData, null, 2));
    
    const response = await fetch(`${VPS_URL}/api/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testScheduleData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Programación enviada correctamente');
      console.log('📄 Respuesta:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Error del servidor VPS');
      console.error('📄 Respuesta:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

async function testManualRecording() {
  try {
    console.log('\n🎙️ Probando grabación manual...');
    
    const manualData = {
      radioId: "test_radio",
      radioName: "Radio Cooperativa",
      streamUrl: "http://unlimited5-cl.dps.live/cooperativa/aac/icecast.audio",
      duration: 30 // 30 segundos
    };
    
    const response = await fetch(`${VPS_URL}/api/record/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(manualData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Grabación manual iniciada');
      console.log('📄 Respuesta:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Error iniciando grabación manual');
      console.error('📄 Respuesta:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function checkVPSStatus() {
  try {
    console.log('\n🔍 Verificando estado de la VPS...');
    
    const response = await fetch(`${VPS_URL}/`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ VPS está activa');
      console.log('📄 Estado:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ VPS no responde correctamente');
    }
    
  } catch (error) {
    console.error('❌ No se puede conectar a la VPS:', error.message);
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🧪 Iniciando pruebas de VPS...\n');
  
  await checkVPSStatus();
  await sendTestSchedule();
  await testManualRecording();
  
  console.log('\n✅ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests();
}

module.exports = {
  sendTestSchedule,
  testManualRecording,
  checkVPSStatus
};
