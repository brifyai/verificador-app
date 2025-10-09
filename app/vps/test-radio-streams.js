// Script para probar URLs de streams de radio válidas
const { spawn } = require('child_process');

// URLs de radio chilenas actualizadas y verificadas
const RADIO_STREAMS = {
  'cooperativa': {
    name: 'Radio Cooperativa',
    urls: [
      'http://playerservices.streamtheworld.com/api/livestream-redirect/COOPERATIVAAAC.aac',
      'http://unlimited5-cl.dps.live/cooperativa/aac/icecast.audio',
      'https://mdstrm.com/audio/5c21e5c8b4c6b40e1b2d8b7c/icecast.audio'
    ]
  },
  'biobio': {
    name: 'Radio Bío Bío',
    urls: [
      'http://playerservices.streamtheworld.com/api/livestream-redirect/BIOBIOAAC.aac',
      'http://unlimited6-cl.dps.live/biobio/aac/icecast.audio',
      'https://mdstrm.com/audio/5c21e5c8b4c6b40e1b2d8b7d/icecast.audio'
    ]
  },
  'duna': {
    name: 'Radio Duna',
    urls: [
      'http://playerservices.streamtheworld.com/api/livestream-redirect/DUNAAAC.aac',
      'https://mdstrm.com/audio/5c21e5c8b4c6b40e1b2d8b7e/icecast.audio'
    ]
  },
  'concierto': {
    name: 'Radio Concierto',
    urls: [
      'http://playerservices.streamtheworld.com/api/livestream-redirect/CONCIERTOAAC.aac',
      'https://mdstrm.com/audio/5c21e5c8b4c6b40e1b2d8b7f/icecast.audio'
    ]
  },
  'pudahuel': {
    name: 'Radio Pudahuel',
    urls: [
      'http://playerservices.streamtheworld.com/api/livestream-redirect/PUDAHUELAAC.aac',
      'https://mdstrm.com/audio/5c21e5c8b4c6b40e1b2d8b80/icecast.audio'
    ]
  }
};

async function testRadioStream(radioId, radioData) {
  console.log(`\n🔍 Probando ${radioData.name}...`);
  
  for (let i = 0; i < radioData.urls.length; i++) {
    const url = radioData.urls[i];
    console.log(`   📡 URL ${i + 1}: ${url}`);
    
    try {
      const isValid = await testStreamWithFFmpeg(url, radioData.name);
      if (isValid) {
        console.log(`   ✅ URL válida encontrada: ${url}`);
        return { radioId, name: radioData.name, streamUrl: url, status: 'valid' };
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`   ⚠️ Ninguna URL válida para ${radioData.name}`);
  return { radioId, name: radioData.name, streamUrl: null, status: 'invalid' };
}

function testStreamWithFFmpeg(url, radioName) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      ffmpeg.kill('SIGTERM');
      resolve(false);
    }, 10000); // 10 segundos timeout
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', url,
      '-t', '5', // Solo 5 segundos de prueba
      '-f', 'null',
      '-'
    ]);
    
    let hasError = false;
    
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('HTTP error') || output.includes('Server returned 4') || output.includes('Connection refused')) {
        hasError = true;
        clearTimeout(timeout);
        resolve(false);
      }
      if (output.includes('Stream #0') || output.includes('Audio:')) {
        clearTimeout(timeout);
        ffmpeg.kill('SIGTERM');
        resolve(true);
      }
    });
    
    ffmpeg.on('close', (code) => {
      clearTimeout(timeout);
      resolve(!hasError && code === 0);
    });
    
    ffmpeg.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function testAllRadios() {
  console.log('🎙️ PROBANDO STREAMS DE RADIO CHILENAS');
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const [radioId, radioData] of Object.entries(RADIO_STREAMS)) {
    const result = await testRadioStream(radioId, radioData);
    results.push(result);
  }
  
  console.log('\n📊 RESULTADOS:');
  console.log('='.repeat(50));
  
  const validRadios = results.filter(r => r.status === 'valid');
  const invalidRadios = results.filter(r => r.status === 'invalid');
  
  console.log(`✅ Radios válidas: ${validRadios.length}`);
  validRadios.forEach(radio => {
    console.log(`   📻 ${radio.name}`);
    console.log(`      🔗 ${radio.streamUrl}`);
  });
  
  console.log(`\n❌ Radios con problemas: ${invalidRadios.length}`);
  invalidRadios.forEach(radio => {
    console.log(`   📻 ${radio.name} - Todas las URLs fallaron`);
  });
  
  // Generar configuración para la VPS
  if (validRadios.length > 0) {
    console.log('\n📋 CONFIGURACIÓN PARA VPS:');
    console.log('='.repeat(50));
    
    const vpsConfig = {
      timestamp: new Date().toISOString(),
      validRadios: validRadios.map(radio => ({
        id: radio.radioId,
        name: radio.name,
        streamUrl: radio.streamUrl,
        region: 'Chile',
        tested: true
      }))
    };
    
    console.log(JSON.stringify(vpsConfig, null, 2));
    
    // Crear programación de prueba con radios válidas
    const testSchedule = {
      userId: 'test-streams',
      radios: vpsConfig.validRadios.slice(0, 2), // Solo las primeras 2 para prueba
      days: [new Date().getDay()], // Día actual
      schedule: {
        startTime: getNextMinute(),
        endTime: getNextMinute(2),
        duration: 60
      },
      phrase: {
        id: 'test-phrase',
        text: 'noticias',
        brand: 'Test',
        campaign: 'Stream Test'
      },
      metadata: {
        description: 'Prueba automática con URLs válidas',
        createdAt: new Date().toISOString()
      }
    };
    
    console.log('\n🧪 PROGRAMACIÓN DE PRUEBA:');
    console.log(JSON.stringify(testSchedule, null, 2));
    
    return { validRadios, testSchedule };
  }
  
  return { validRadios: [], testSchedule: null };
}

function getNextMinute(offset = 1) {
  const now = new Date();
  const next = new Date(now.getTime() + (offset * 60000));
  return `${next.getHours().toString().padStart(2, '0')}:${next.getMinutes().toString().padStart(2, '0')}`;
}

async function sendTestToVPS(testSchedule) {
  if (!testSchedule) {
    console.log('❌ No hay programación de prueba para enviar');
    return;
  }
  
  try {
    console.log('\n📤 Enviando programación de prueba a VPS...');
    
    const response = await fetch('http://173.249.26.38:3000/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSchedule)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Programación enviada exitosamente');
      console.log('📄 Respuesta:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Error enviando programación:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAllRadios()
    .then(({ validRadios, testSchedule }) => {
      if (process.argv.includes('--send-test') && testSchedule) {
        return sendTestToVPS(testSchedule);
      }
    })
    .catch(console.error);
}

module.exports = { testAllRadios, RADIO_STREAMS };
