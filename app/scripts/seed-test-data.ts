import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Iniciando inserción de datos de prueba...');

  // 1. Crear usuarios de prueba
  console.log('👤 Creando usuarios...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ondaverificada.com' },
    update: {},
    create: {
      email: 'admin@ondaverificada.com',
      name: 'Administrador Sistema',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      active: true,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'usuario@test.com' },
    update: {},
    create: {
      email: 'usuario@test.com',
      name: 'Usuario de Prueba',
      password: await bcrypt.hash('test123', 10),
      role: 'USER',
      active: true,
    },
  });

  // 2. Crear radios de prueba
  console.log('📻 Creando radios...');
  const radios = await Promise.all([
    prisma.radio.create({
      data: {
        name: 'Radio Cooperativa',
        streamUrl: 'https://mdstrm.com/audio/5c9e1e2e9b618b0a30fccb59/icecast.audio',
        platform: 'ICECAST',
        region: 'Metropolitana',
        description: 'Radio informativa nacional',
        status: 'ACTIVE',
        priority: 1,
        costPerHour: 5000.0,
        metadata: {
          city: 'Santiago',
          frequency: '93.3 FM',
          genre: 'Noticias'
        }
      }
    }),
    prisma.radio.create({
      data: {
        name: 'Radio Bío Bío',
        streamUrl: 'https://unlimited5-cl.dps.live/biobio/aac/icecast.audio',
        platform: 'ICECAST',
        region: 'Biobío',
        description: 'Radio regional del sur',
        status: 'ACTIVE',
        priority: 1,
        costPerHour: 3500.0,
        metadata: {
          city: 'Concepción',
          frequency: '96.5 FM',
          genre: 'Noticias'
        }
      }
    }),
    prisma.radio.create({
      data: {
        name: 'Radio Pudahuel',
        streamUrl: 'https://streaming.radiopudahuel.cl:8000/stream',
        platform: 'ICECAST',
        region: 'Metropolitana',
        description: 'Radio musical popular',
        status: 'ACTIVE',
        priority: 2,
        costPerHour: 2500.0,
        metadata: {
          city: 'Santiago',
          frequency: '90.5 FM',
          genre: 'Música'
        }
      }
    }),
    prisma.radio.create({
      data: {
        name: 'Radio Valparaíso',
        streamUrl: 'https://stream.radiovalparaiso.cl/live',
        platform: 'HTTP_STREAM',
        region: 'Valparaíso',
        description: 'Radio porteña tradicional',
        status: 'ACTIVE',
        priority: 2,
        costPerHour: 3000.0,
        metadata: {
          city: 'Valparaíso',
          frequency: '103.5 FM',
          genre: 'Variada'
        }
      }
    }),
    prisma.radio.create({
      data: {
        name: 'Radio Antofagasta',
        streamUrl: 'https://streaming.radioantofagasta.cl/stream',
        platform: 'SHOUTCAST',
        region: 'Antofagasta',
        description: 'Radio del norte grande',
        status: 'ACTIVE',
        priority: 3,
        costPerHour: 2000.0,
        metadata: {
          city: 'Antofagasta',
          frequency: '98.1 FM',
          genre: 'Regional'
        }
      }
    })
  ]);

  // 3. Crear frases publicitarias de prueba
  console.log('🎯 Creando frases publicitarias...');
  const phrases = await Promise.all([
    prisma.phrase.create({
      data: {
        phrase: 'Coca Cola la chispa de la vida',
        brand: 'Coca-Cola',
        campaign: 'Campaña Verano 2024',
        category: 'PRODUCT',
        description: 'Slogan principal de Coca-Cola',
        confidence: 0.9,
        priority: 1,
        active: true
      }
    }),
    prisma.phrase.create({
      data: {
        phrase: 'Samsung Galaxy el futuro en tus manos',
        brand: 'Samsung',
        campaign: 'Lanzamiento Galaxy S24',
        category: 'PRODUCT',
        description: 'Promoción de nuevos smartphones',
        confidence: 0.85,
        priority: 1,
        active: true
      }
    }),
    prisma.phrase.create({
      data: {
        phrase: 'Banco de Chile siempre contigo',
        brand: 'Banco de Chile',
        campaign: 'Servicios Bancarios 2024',
        category: 'SERVICE',
        description: 'Campaña institucional bancaria',
        confidence: 0.88,
        priority: 2,
        active: true
      }
    }),
    prisma.phrase.create({
      data: {
        phrase: 'Falabella todo lo que necesitas',
        brand: 'Falabella',
        campaign: 'CyberDay 2024',
        category: 'PROMOTION',
        description: 'Promoción de tienda departamental',
        confidence: 0.87,
        priority: 1,
        active: true
      }
    }),
    prisma.phrase.create({
      data: {
        phrase: 'Entel la red que te conecta',
        brand: 'Entel',
        campaign: 'Conectividad Nacional',
        category: 'SERVICE',
        description: 'Servicios de telecomunicaciones',
        confidence: 0.86,
        priority: 2,
        active: true
      }
    })
  ]);

  // 4. Crear sesiones de monitoreo
  console.log('🔍 Creando sesiones de monitoreo...');
  const sessions = await Promise.all([
    prisma.monitoringSession.create({
      data: {
        radioId: radios[0].id,
        userId: adminUser.id,
        status: 'COMPLETED',
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T18:00:00Z'),
        captureInterval: 30,
        captureDuration: 10,
        totalCaptures: 120,
        totalDetections: 8,
        lastCaptureAt: new Date('2024-01-15T17:59:00Z'),
        lastDetectionAt: new Date('2024-01-15T16:45:00Z'),
        configuration: {
          autoStart: true,
          detectAllPhrases: true
        }
      }
    }),
    prisma.monitoringSession.create({
      data: {
        radioId: radios[1].id,
        userId: testUser.id,
        status: 'COMPLETED',
        startTime: new Date('2024-01-16T09:00:00Z'),
        endTime: new Date('2024-01-16T17:00:00Z'),
        captureInterval: 45,
        captureDuration: 15,
        totalCaptures: 96,
        totalDetections: 5,
        lastCaptureAt: new Date('2024-01-16T16:58:00Z'),
        lastDetectionAt: new Date('2024-01-16T15:30:00Z'),
        configuration: {
          autoStart: true,
          detectAllPhrases: true
        }
      }
    }),
    prisma.monitoringSession.create({
      data: {
        radioId: radios[2].id,
        userId: adminUser.id,
        status: 'ACTIVE',
        startTime: new Date('2024-01-17T07:00:00Z'),
        captureInterval: 60,
        captureDuration: 20,
        totalCaptures: 45,
        totalDetections: 3,
        lastCaptureAt: new Date(),
        lastDetectionAt: new Date('2024-01-17T14:20:00Z'),
        configuration: {
          autoStart: true,
          detectAllPhrases: false,
          selectedPhrases: [phrases[0].id, phrases[1].id]
        }
      }
    })
  ]);

  // 5. Crear capturas de audio
  console.log('🎵 Creando capturas de audio...');
  const captures = [];
  for (let i = 0; i < 20; i++) {
    const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
    const capture = await prisma.capture.create({
      data: {
        sessionId: randomSession.id,
        audioPath: `/audio/captures/capture_${Date.now()}_${i}.mp3`,
        duration: 10.0 + Math.random() * 5,
        fileSize: BigInt(Math.floor(1000000 + Math.random() * 2000000)),
        format: 'mp3',
        bitrate: 128,
        sampleRate: 44100,
        status: 'TRANSCRIBED',
        capturedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        processedAt: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000),
        transcriptionText: `Transcripción de audio ${i + 1} con contenido publicitario detectado`,
        confidence: 0.8 + Math.random() * 0.2,
        provider: ['groq', 'openai', 'assemblyai'][Math.floor(Math.random() * 3)],
        processingTime: 1000 + Math.random() * 3000,
        cost: 50 + Math.random() * 200,
        metadata: {
          quality: 'high',
          noiseLevel: 'low'
        }
      }
    });
    captures.push(capture);
  }

  // 6. Crear detecciones realistas
  console.log('🎯 Creando detecciones...');
  const detections = [];
  
  // Detecciones para diferentes fechas y estados
  const detectionData = [
    {
      phraseIndex: 0, // Coca-Cola
      radioIndex: 0,
      sessionIndex: 0,
      captureIndex: 0,
      detectedText: 'Coca Cola la chispa de la vida',
      confidence: 0.95,
      similarity: 0.98,
      cost: 1500,
      verified: true,
      timestamp: new Date('2024-01-15T10:30:00Z')
    },
    {
      phraseIndex: 1, // Samsung
      radioIndex: 1,
      sessionIndex: 1,
      captureIndex: 1,
      detectedText: 'Samsung Galaxy el futuro está en tus manos',
      confidence: 0.87,
      similarity: 0.92,
      cost: 2200,
      verified: true,
      timestamp: new Date('2024-01-16T14:15:00Z')
    },
    {
      phraseIndex: 2, // Banco de Chile
      radioIndex: 0,
      sessionIndex: 0,
      captureIndex: 2,
      detectedText: 'Banco de Chile siempre contigo en cada momento',
      confidence: 0.91,
      similarity: 0.89,
      cost: 1800,
      verified: false,
      timestamp: new Date('2024-01-15T16:45:00Z')
    },
    {
      phraseIndex: 3, // Falabella
      radioIndex: 2,
      sessionIndex: 2,
      captureIndex: 3,
      detectedText: 'Falabella todo lo que necesitas y más',
      confidence: 0.89,
      similarity: 0.94,
      cost: 2500,
      verified: true,
      timestamp: new Date('2024-01-17T12:20:00Z')
    },
    {
      phraseIndex: 4, // Entel
      radioIndex: 1,
      sessionIndex: 1,
      captureIndex: 4,
      detectedText: 'Entel la red que te conecta con el mundo',
      confidence: 0.88,
      similarity: 0.91,
      cost: 1900,
      verified: false,
      timestamp: new Date('2024-01-16T15:30:00Z')
    },
    // Más detecciones para tener datos suficientes
    {
      phraseIndex: 0, // Coca-Cola otra vez
      radioIndex: 2,
      sessionIndex: 2,
      captureIndex: 5,
      detectedText: 'Coca Cola la chispa de la vida siempre',
      confidence: 0.93,
      similarity: 0.96,
      cost: 1600,
      verified: true,
      timestamp: new Date('2024-01-17T14:20:00Z')
    },
    {
      phraseIndex: 1, // Samsung otra vez
      radioIndex: 0,
      sessionIndex: 0,
      captureIndex: 6,
      detectedText: 'Samsung Galaxy el futuro en tus manos ahora',
      confidence: 0.86,
      similarity: 0.90,
      cost: 2100,
      verified: false,
      timestamp: new Date('2024-01-15T12:10:00Z')
    },
    {
      phraseIndex: 3, // Falabella otra vez
      radioIndex: 1,
      sessionIndex: 1,
      captureIndex: 7,
      detectedText: 'Falabella todo lo que necesitas está aquí',
      confidence: 0.90,
      similarity: 0.93,
      cost: 2400,
      verified: true,
      timestamp: new Date('2024-01-16T11:45:00Z')
    }
  ];

  for (const data of detectionData) {
    const detection = await prisma.detection.create({
      data: {
        sessionId: sessions[data.sessionIndex].id,
        captureId: captures[data.captureIndex].id,
        radioId: radios[data.radioIndex].id,
        phraseId: phrases[data.phraseIndex].id,
        detectedText: data.detectedText,
        originalText: `Transcripción completa que incluye: "${data.detectedText}" junto con otro contenido del programa.`,
        confidence: data.confidence,
        similarity: data.similarity,
        timestamp: data.timestamp,
        audioTimestamp: Math.random() * 10,
        verified: data.verified,
        falsePositive: false,
        cost: data.cost,
        metadata: {
          processingTime: 1200 + Math.random() * 800,
          algorithm: 'similarity_match',
          contextWords: ['publicidad', 'comercial', 'anuncio']
        }
      }
    });
    detections.push(detection);
  }

  console.log('✅ Datos de prueba creados exitosamente:');
  console.log(`   👤 ${2} usuarios`);
  console.log(`   📻 ${radios.length} radios`);
  console.log(`   🎯 ${phrases.length} frases publicitarias`);
  console.log(`   🔍 ${sessions.length} sesiones de monitoreo`);
  console.log(`   🎵 ${captures.length} capturas de audio`);
  console.log(`   🎯 ${detections.length} detecciones`);
  console.log('');
  console.log('🔐 Credenciales de prueba:');
  console.log('   Admin: admin@ondaverificada.com / admin123');
  console.log('   Usuario: usuario@test.com / test123');
}

main()
  .catch((e) => {
    console.error('❌ Error al insertar datos de prueba:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });