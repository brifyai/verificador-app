const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function createTestAudioData() {
  try {
    console.log('🎵 Creando datos de prueba para audios...');

    // 0. Crear un usuario de prueba
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Usuario de Prueba',
          password: 'test123', // Password temporal
          role: 'USER'
        }
      });
      console.log('👤 Usuario creado:', user.name);
    }

    // 1. Crear o encontrar radio
    let radio = await prisma.radio.findFirst({
      where: { name: 'Radio Nacional' }
    });

    if (!radio) {
      radio = await prisma.radio.create({
        data: {
          name: 'Radio Nacional',
          streamUrl: 'https://ejemplo.com/stream',
          platform: 'HTTP_STREAM',
          region: 'Santiago',
          status: 'ACTIVE'
        }
      });
      console.log('📻 Radio creada:', radio.name);
    }

    // Crear o obtener una frase de prueba
    let phrase = await prisma.phrase.findFirst({
      where: { phrase: 'Coca-Cola' }
    });

    if (!phrase) {
      phrase = await prisma.phrase.create({
        data: {
          phrase: 'Coca-Cola',
          brand: 'Coca-Cola',
          campaign: 'Campaña Verano 2024',
          category: 'PRODUCT',
          confidence: 0.7,
          active: true
        }
      });
      console.log('🎯 Frase creada:', phrase.phrase);
    }

    // 3. Crear una sesión de monitoreo
    const session = await prisma.monitoringSession.create({
      data: {
        radioId: radio.id,
        userId: user.id, // Usar el ID del usuario creado
        status: 'ACTIVE',
        startTime: new Date('2024-01-15T08:30:00Z'),
        captureInterval: 300,
        captureDuration: 30
      }
    });
    console.log('🔄 Sesión de monitoreo creada:', session.id);

    // 4. Crear una captura de audio
    const audioPath = path.join('captures', 'Radio_Nacional_2024-01-15_08-30-00_coca_cola.wav');
    
    const capture = await prisma.capture.create({
      data: {
        sessionId: session.id,
        audioPath: audioPath,
        duration: 30.0,
        fileSize: BigInt(1024 * 50), // 50KB simulado
        format: 'mp3',
        bitrate: 128,
        sampleRate: 44100,
        status: 'COMPLETED',
        capturedAt: new Date('2024-01-15T08:30:00Z'),
        processedAt: new Date('2024-01-15T08:30:30Z'),
        transcriptionText: 'Y ahora un mensaje de nuestros auspiciadores... Coca-Cola te invita a disfrutar el verano con su nueva campaña refrescante. La chispa de la vida está aquí.',
        confidence: 0.95
      }
    });
    console.log('🎵 Captura de audio creada:', capture.id);

    // 5. Crear una detección de frase
    const detection = await prisma.detection.create({
      data: {
        sessionId: session.id,
        captureId: capture.id,
        radioId: radio.id,
        phraseId: phrase.id,
        detectedText: 'Coca-Cola te invita a disfrutar el verano',
        originalText: capture.transcriptionText,
        confidence: 0.94,
        similarity: 0.92,
        audioTimestamp: 8.3,
        metadata: {
          isAdvertisement: true,
          advertisementType: 'product',
          detectedPhrases: ['Coca-Cola', 'verano'],
          brandMentions: ['Coca-Cola'],
          summary: 'Publicidad de Coca-Cola promocionando la marca con campaña de verano',
          timestamp: new Date()
        }
      }
    });
    console.log('🎯 Detección creada:', detection.id);

    // 6. Crear segunda captura para Samsung
    const audioPath2 = path.join('captures', 'Radio_Mitre_2024-01-15_12-00-00_samsung.wav');
    
    // Crear radio Mitre si no existe
    let radioMitre = await prisma.radio.findFirst({
      where: { name: 'Radio Mitre' }
    });

    if (!radioMitre) {
      radioMitre = await prisma.radio.create({
        data: {
          name: 'Radio Mitre',
          streamUrl: 'https://ejemplo.com/mitre',
          platform: 'HTTP_STREAM',
          region: 'Buenos Aires',
          status: 'ACTIVE'
        }
      });
    }

    // Crear frase Samsung
    let phraseSamsung = await prisma.phrase.findFirst({
      where: { phrase: 'Samsung Galaxy' }
    });

    if (!phraseSamsung) {
      phraseSamsung = await prisma.phrase.create({
        data: {
          phrase: 'Samsung Galaxy',
          brand: 'Samsung',
          campaign: 'Galaxy S24 Launch',
          category: 'PRODUCT',
          confidence: 0.8,
          active: true
        }
      });
    }

    const sessionMitre = await prisma.monitoringSession.create({
      data: {
        radioId: radioMitre.id,
        userId: user.id, // Usar el ID del usuario creado
        status: 'ACTIVE',
        startTime: new Date('2024-01-15T12:00:00Z'),
        captureInterval: 300,
        captureDuration: 30
      }
    });

    const captureMitre = await prisma.capture.create({
      data: {
        sessionId: sessionMitre.id,
        audioPath: 'captures/Radio_Mitre_2024-01-15_12-00-00_samsung.wav',
        duration: 30.0,
        fileSize: BigInt(1024 * 48),
        format: 'mp3',
        bitrate: 128,
        sampleRate: 44100,
        status: 'COMPLETED',
        capturedAt: new Date('2024-01-15T12:00:00Z'),
        processedAt: new Date('2024-01-15T12:00:30Z'),
        transcriptionText: 'Descubre el nuevo Samsung Galaxy S24 con inteligencia artificial avanzada. La innovación que cambiará tu forma de vivir la tecnología.',
        confidence: 0.93
      }
    });

    const detectionMitre = await prisma.detection.create({
      data: {
        sessionId: sessionMitre.id,
        captureId: captureMitre.id,
        radioId: radioMitre.id,
        phraseId: phraseSamsung.id,
        detectedText: 'Samsung Galaxy S24',
        originalText: 'Nuevo Samsung Galaxy S24, la innovación que estabas esperando',
        confidence: 0.95,
        similarity: 0.92,
        audioTimestamp: 15.5,
        metadata: {
          isAdvertisement: true,
          advertisementType: 'product',
          detectedPhrases: ['Samsung Galaxy S24', 'innovación', 'inteligencia artificial'],
          brandMentions: ['Samsung'],
          summary: 'Publicidad del Samsung Galaxy S24 destacando sus características de inteligencia artificial y innovación tecnológica',
          timestamp: new Date()
        }
      }
    });

    console.log('✅ Datos de prueba creados exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - 2 Radios: ${radio.name}, ${radioMitre.name}`);
    console.log(`   - 2 Frases: ${phrase.phrase}, ${phraseSamsung.phrase}`);
    console.log(`   - 2 Sesiones de monitoreo`);
    console.log(`   - 2 Capturas de audio`);
    console.log(`   - 2 Detecciones de publicidad`);
    console.log(`🎵 Los audios deberían aparecer ahora en /audios`);

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAudioData();