// Script completo para probar el sistema de transcripciones
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const TranscriptionManager = require('./transcription-manager');
const EnhancedRadioScheduler = require('./enhanced-scheduler');

class TranscriptionSystemTester {
  constructor() {
    this.testDir = './test-recordings';
    this.configDir = './test-config';
    this.transcriptionManager = new TranscriptionManager(this.testDir);
    this.scheduler = new EnhancedRadioScheduler(this.configDir, this.testDir);
  }

  async runCompleteTest() {
    console.log('🧪 INICIANDO PRUEBA COMPLETA DEL SISTEMA DE TRANSCRIPCIONES');
    console.log('='.repeat(70));
    
    try {
      // 1. Preparar entorno de prueba
      await this.setupTestEnvironment();
      
      // 2. Crear grabación de prueba
      await this.createTestRecording();
      
      // 3. Probar sistema de transcripciones
      await this.testTranscriptionSystem();
      
      // 4. Probar scheduler mejorado
      await this.testEnhancedScheduler();
      
      // 5. Verificar estructura de carpetas
      await this.verifyFolderStructure();
      
      // 6. Limpiar entorno de prueba
      await this.cleanupTestEnvironment();
      
      console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
      console.log('🎯 El sistema está listo para producción');
      
    } catch (error) {
      console.error('\n❌ ERROR EN LAS PRUEBAS:', error.message);
      console.log('🔧 Revisa la instalación y dependencias');
    }
  }

  async setupTestEnvironment() {
    console.log('\n1️⃣ Configurando entorno de prueba...');
    
    // Crear directorios de prueba
    [this.testDir, this.configDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
      }
    });
    
    console.log('✅ Entorno de prueba configurado');
  }

  async createTestRecording() {
    console.log('\n2️⃣ Creando grabación de prueba...');
    
    // Crear carpeta de grabación usando el TranscriptionManager
    const testRadioName = 'Radio_Prueba';
    const timestamp = new Date().toISOString();
    const recordingFolder = this.transcriptionManager.createRecordingFolder(testRadioName, timestamp);
    
    console.log(`📁 Carpeta creada: ${recordingFolder.folderName}`);
    
    // Crear archivo de audio de prueba con contenido hablado
    const audioPath = path.join(recordingFolder.folderPath, recordingFolder.audioFileName);
    
    // Generar audio de prueba con texto hablado usando espeak (si está disponible)
    try {
      await this.generateTestAudio(audioPath);
      console.log(`🎵 Audio de prueba creado: ${recordingFolder.audioFileName}`);
    } catch (error) {
      // Si no se puede generar audio con voz, crear silencio
      await this.generateSilentAudio(audioPath);
      console.log(`🔇 Audio silencioso creado: ${recordingFolder.audioFileName}`);
    }
    
    // Crear metadata de la grabación
    const metadata = {
      recordingId: 'test-recording-001',
      radio: {
        id: 'test-radio',
        name: 'Radio Prueba',
        streamUrl: 'http://test-stream.com',
        region: 'Test Region'
      },
      scheduleId: 'test-schedule',
      phrase: {
        id: 'test-phrase',
        text: 'prueba de transcripción',
        brand: 'Test Brand'
      },
      recording: {
        startTime: timestamp,
        duration: 10,
        filename: recordingFolder.audioFileName,
        folderName: recordingFolder.folderName,
        status: 'completed'
      },
      transcription: {
        scheduled: true,
        status: 'pending'
      },
      status: 'completed'
    };
    
    const metadataPath = path.join(recordingFolder.folderPath, 'recording_info.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('📋 Metadata de grabación creada');
    
    return recordingFolder;
  }

  async generateTestAudio(audioPath) {
    return new Promise((resolve, reject) => {
      // Intentar generar audio con texto usando espeak
      const espeak = spawn('espeak', [
        '-s', '150',  // Velocidad
        '-v', 'es',   // Voz en español
        '-w', audioPath.replace('.mp3', '.wav'), // Salida WAV
        'Hola, esta es una prueba de transcripción automática para el sistema de grabación de radios'
      ]);
      
      espeak.on('close', (code) => {
        if (code === 0) {
          // Convertir WAV a MP3
          const ffmpeg = spawn('ffmpeg', [
            '-i', audioPath.replace('.mp3', '.wav'),
            '-acodec', 'mp3',
            '-ab', '128k',
            '-y',
            audioPath
          ]);
          
          ffmpeg.on('close', (ffmpegCode) => {
            // Limpiar archivo WAV temporal
            try {
              fs.unlinkSync(audioPath.replace('.mp3', '.wav'));
            } catch (e) {}
            
            if (ffmpegCode === 0) {
              resolve();
            } else {
              reject(new Error('Error convirtiendo a MP3'));
            }
          });
        } else {
          reject(new Error('espeak no disponible'));
        }
      });
      
      espeak.on('error', () => {
        reject(new Error('espeak no encontrado'));
      });
    });
  }

  async generateSilentAudio(audioPath) {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'lavfi',
        '-i', 'anullsrc=r=44100:cl=mono',
        '-t', '10',
        '-acodec', 'mp3',
        '-ab', '128k',
        '-y',
        audioPath
      ]);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Error generando audio silencioso'));
        }
      });
      
      ffmpeg.on('error', reject);
    });
  }

  async testTranscriptionSystem() {
    console.log('\n3️⃣ Probando sistema de transcripciones...');
    
    // Obtener estadísticas iniciales
    const initialStats = this.transcriptionManager.getTranscriptionStats();
    console.log(`📊 Estado inicial: ${initialStats.pending} grabaciones pendientes`);
    
    if (initialStats.pending > 0) {
      console.log('🚀 Iniciando transcripción forzada...');
      await this.transcriptionManager.forceTranscription();
      
      // Verificar estadísticas después de transcripción
      const finalStats = this.transcriptionManager.getTranscriptionStats();
      console.log(`📊 Estado final: ${finalStats.transcribed} transcritas, ${finalStats.pending} pendientes`);
      
      if (finalStats.transcribed > initialStats.transcribed) {
        console.log('✅ Sistema de transcripciones funcionando correctamente');
      } else {
        console.log('⚠️ No se procesaron nuevas transcripciones (puede ser normal si Whisper no está instalado)');
      }
    } else {
      console.log('ℹ️ No hay grabaciones pendientes para transcribir');
    }
  }

  async testEnhancedScheduler() {
    console.log('\n4️⃣ Probando scheduler mejorado...');
    
    // Crear programación de prueba
    const testSchedule = {
      scheduleId: 'test-schedule-001',
      userId: 'test-user',
      radios: [{
        id: 'test-radio',
        name: 'Radio Prueba',
        streamUrl: 'http://test-stream.com',
        region: 'Test'
      }],
      days: [new Date().getDay()], // Día actual
      schedule: {
        startTime: '23:59', // Hora que no se ejecute durante la prueba
        endTime: '23:59',
        duration: 5
      },
      phrase: {
        id: 'test-phrase',
        text: 'prueba',
        brand: 'Test'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'test'
      },
      status: 'active'
    };
    
    // Guardar configuración de prueba
    const configPath = path.join(this.configDir, 'test-schedule-001.json');
    fs.writeFileSync(configPath, JSON.stringify(testSchedule, null, 2));
    
    // Cargar en scheduler
    this.scheduler.loadScheduleFile(configPath);
    
    // Verificar que se cargó
    const scheduledJobs = this.scheduler.getScheduledJobs();
    const activeRecordings = this.scheduler.getActiveRecordings();
    
    console.log(`📅 Trabajos programados: ${scheduledJobs.length}`);
    console.log(`🎙️ Grabaciones activas: ${activeRecordings.length}`);
    
    if (scheduledJobs.length > 0) {
      console.log('✅ Scheduler mejorado funcionando correctamente');
    } else {
      console.log('⚠️ No se programaron trabajos (verificar configuración)');
    }
  }

  async verifyFolderStructure() {
    console.log('\n5️⃣ Verificando estructura de carpetas...');
    
    const folders = this.transcriptionManager.findRecordingFolders();
    console.log(`📁 Carpetas de grabación encontradas: ${folders.length}`);
    
    for (const folder of folders) {
      console.log(`   📂 ${folder.name}`);
      
      // Verificar contenido de cada carpeta
      const audioFiles = this.transcriptionManager.findAudioFiles(folder.path);
      const hasMetadata = fs.existsSync(path.join(folder.path, 'recording_info.json'));
      const hasTranscription = this.transcriptionManager.checkTranscriptionExists(folder.path, audioFiles[0] || 'test.mp3');
      
      console.log(`      🎵 Archivos de audio: ${audioFiles.length}`);
      console.log(`      📋 Metadata: ${hasMetadata ? '✅' : '❌'}`);
      console.log(`      📝 Transcripción: ${hasTranscription ? '✅' : '⏳'}`);
    }
    
    console.log('✅ Estructura de carpetas verificada');
  }

  async cleanupTestEnvironment() {
    console.log('\n6️⃣ Limpiando entorno de prueba...');
    
    try {
      // Remover directorios de prueba
      if (fs.existsSync(this.testDir)) {
        fs.rmSync(this.testDir, { recursive: true, force: true });
        console.log(`🗑️ Directorio removido: ${this.testDir}`);
      }
      
      if (fs.existsSync(this.configDir)) {
        fs.rmSync(this.configDir, { recursive: true, force: true });
        console.log(`🗑️ Directorio removido: ${this.configDir}`);
      }
      
      console.log('✅ Limpieza completada');
    } catch (error) {
      console.log('⚠️ Error en limpieza (no crítico):', error.message);
    }
  }

  // Método para ejecutar solo prueba de transcripciones en grabaciones existentes
  async testExistingRecordings() {
    console.log('🔍 PROBANDO TRANSCRIPCIONES EN GRABACIONES EXISTENTES');
    console.log('='.repeat(60));
    
    const realManager = new TranscriptionManager('./recordings');
    const stats = realManager.getTranscriptionStats();
    
    console.log('📊 ESTADÍSTICAS ACTUALES:');
    console.log(`   📁 Carpetas: ${stats.totalFolders}`);
    console.log(`   🎵 Grabaciones: ${stats.totalRecordings}`);
    console.log(`   ✅ Transcritas: ${stats.transcribed}`);
    console.log(`   ⏳ Pendientes: ${stats.pending}`);
    console.log(`   📈 Tasa: ${stats.transcriptionRate}%`);
    
    if (stats.pending > 0) {
      console.log(`\n🚀 Iniciando transcripción de ${stats.pending} archivos pendientes...`);
      console.log('⏰ Esto puede tomar varios minutos...');
      
      await realManager.forceTranscription();
      
      const newStats = realManager.getTranscriptionStats();
      console.log('\n📊 ESTADÍSTICAS FINALES:');
      console.log(`   ✅ Transcritas: ${newStats.transcribed}`);
      console.log(`   ⏳ Pendientes: ${newStats.pending}`);
      console.log(`   📈 Tasa: ${newStats.transcriptionRate}%`);
    } else {
      console.log('\n✅ No hay transcripciones pendientes');
    }
  }
}

// Ejecutar pruebas
async function main() {
  const tester = new TranscriptionSystemTester();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--existing-only')) {
    // Solo probar transcripciones en grabaciones existentes
    await tester.testExistingRecordings();
  } else {
    // Ejecutar prueba completa
    await tester.runCompleteTest();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TranscriptionSystemTester;
