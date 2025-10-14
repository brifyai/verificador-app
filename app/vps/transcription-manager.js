// Sistema de transcripción automática para grabaciones de radio
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');
const PhraseDetector = require('./phrase-detector');

class TranscriptionManager {
  constructor(recordingsDir = './recordings') {
    this.recordingsDir = recordingsDir;
    this.isTranscribing = false;
    this.transcriptionQueue = [];
    this.supportedFormats = ['.mp3', '.wav', '.m4a', '.flac'];
    this.phraseDetector = new PhraseDetector();
    
    // Programar transcripciones automáticas entre 2-5 AM
    this.scheduleTranscriptions();
    
    console.log('🎙️ TranscriptionManager inicializado');
    console.log(`📁 Directorio de grabaciones: ${this.recordingsDir}`);
  }

  // Programar transcripciones automáticas
  scheduleTranscriptions() {
    // Ejecutar cada 30 minutos entre las 2:00 AM y 5:00 AM
    cron.schedule('*/30 2-4 * * *', async () => {
      console.log('🌙 Iniciando transcripciones automáticas nocturnas...');
      await this.processAllRecordings();
    }, {
      scheduled: true,
      timezone: "America/Santiago"
    });

    // También ejecutar a las 5:00 AM para finalizar
    cron.schedule('0 5 * * *', async () => {
      console.log('🌅 Finalizando transcripciones nocturnas...');
      await this.processAllRecordings();
    }, {
      scheduled: true,
      timezone: "America/Santiago"
    });

    console.log('⏰ Transcripciones programadas: 2:00-5:00 AM cada 30 minutos');
  }

  // Crear estructura de carpetas para grabación
  createRecordingFolder(radioName, timestamp) {
    let date;
    
    // Manejar diferentes formatos de timestamp
    try {
      if (typeof timestamp === 'string' && timestamp.includes('_')) {
        // Si el timestamp ya tiene formato personalizado, usar fecha actual
        date = new Date();
      } else {
        date = new Date(timestamp);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ Timestamp inválido: ${timestamp}, usando fecha actual`);
        date = new Date();
      }
    } catch (error) {
      console.warn(`⚠️ Error parseando timestamp: ${timestamp}, usando fecha actual`);
      date = new Date();
    }
    
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    
    const folderName = `${radioName}_${dateStr}_${timeStr}`;
    const folderPath = path.join(this.recordingsDir, folderName);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`📁 Carpeta creada: ${folderPath}`);
    }
    
    return {
      folderPath,
      folderName,
      audioFileName: `${folderName}.mp3`
    };
  }

  // Procesar todas las grabaciones pendientes
  async processAllRecordings() {
    if (this.isTranscribing) {
      console.log('⚠️ Ya hay transcripciones en proceso, saltando...');
      return;
    }

    this.isTranscribing = true;
    
    try {
      console.log('🔍 Buscando grabaciones sin transcribir...');
      
      const recordingFolders = this.findRecordingFolders();
      const pendingTranscriptions = [];

      for (const folder of recordingFolders) {
        const audioFiles = this.findAudioFiles(folder.path);
        
        for (const audioFile of audioFiles) {
          const transcriptionExists = this.checkTranscriptionExists(folder.path, audioFile);
          
          if (!transcriptionExists) {
            pendingTranscriptions.push({
              folderPath: folder.path,
              folderName: folder.name,
              audioFile: audioFile,
              audioPath: path.join(folder.path, audioFile)
            });
          }
        }
      }

      console.log(`📊 Encontradas ${pendingTranscriptions.length} grabaciones sin transcribir`);

      if (pendingTranscriptions.length > 0) {
        await this.processPendingTranscriptions(pendingTranscriptions);
      } else {
        console.log('✅ Todas las grabaciones ya están transcritas');
      }

    } catch (error) {
      console.error('❌ Error procesando transcripciones:', error);
    } finally {
      this.isTranscribing = false;
    }
  }

  // Encontrar carpetas de grabaciones
  findRecordingFolders() {
    const folders = [];
    
    if (!fs.existsSync(this.recordingsDir)) {
      console.log('⚠️ Directorio de grabaciones no existe');
      return folders;
    }

    const items = fs.readdirSync(this.recordingsDir);
    
    for (const item of items) {
      const itemPath = path.join(this.recordingsDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        folders.push({
          name: item,
          path: itemPath,
          created: stat.birthtime
        });
      }
    }

    return folders.sort((a, b) => b.created - a.created); // Más recientes primero
  }

  // Encontrar archivos de audio en una carpeta
  findAudioFiles(folderPath) {
    const audioFiles = [];
    
    try {
      const files = fs.readdirSync(folderPath);
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (this.supportedFormats.includes(ext)) {
          audioFiles.push(file);
        }
      }
    } catch (error) {
      console.error(`❌ Error leyendo carpeta ${folderPath}:`, error.message);
    }

    return audioFiles;
  }

  // Verificar si ya existe transcripción
  checkTranscriptionExists(folderPath, audioFile) {
    const baseName = path.parse(audioFile).name;
    const transcriptionFiles = [
      `${baseName}_transcription.txt`,
      `${baseName}_transcription.json`,
      'transcription.txt',
      'transcription.json'
    ];

    for (const transcFile of transcriptionFiles) {
      const transcPath = path.join(folderPath, transcFile);
      if (fs.existsSync(transcPath)) {
        return true;
      }
    }

    return false;
  }

  // Procesar transcripciones pendientes
  async processPendingTranscriptions(pendingList) {
    console.log(`🎙️ Iniciando transcripción de ${pendingList.length} archivos...`);
    
    let processed = 0;
    let errors = 0;

    for (const item of pendingList) {
      try {
        console.log(`\n📝 Transcribiendo: ${item.folderName}/${item.audioFile}`);
        
        const result = await this.transcribeAudio(item);
        
        if (result.success) {
          processed++;
          console.log(`✅ Transcripción completada: ${item.folderName}`);
          
          // 🔍 DETECCIÓN AUTOMÁTICA DE FRASES
          console.log(`🔍 Iniciando detección automática de frases...`);
          try {
            const detectionResult = await this.phraseDetector.detectPhrasesInTranscription(
              item.folderPath,
              item.folderName
            );
            
            if (detectionResult.success && detectionResult.matches > 0) {
              console.log(`   ✅ Detección completada: ${detectionResult.matches} coincidencias`);
            }
          } catch (detectionError) {
            console.error(`   ⚠️ Error en detección de frases:`, detectionError.message);
            // No detener el proceso si falla la detección
          }
        } else {
          errors++;
          console.log(`❌ Error en transcripción: ${item.folderName} - ${result.error}`);
        }

        // Pausa entre transcripciones para no sobrecargar el sistema
        await this.sleep(2000);

      } catch (error) {
        errors++;
        console.error(`❌ Error procesando ${item.folderName}:`, error.message);
      }
    }

    console.log(`\n📊 RESUMEN DE TRANSCRIPCIONES:`);
    console.log(`✅ Procesadas exitosamente: ${processed}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📁 Total: ${pendingList.length}`);
  }

  // Transcribir un archivo de audio
  async transcribeAudio(item) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const outputFile = path.join(item.folderPath, 'transcription.txt');
      const metadataFile = path.join(item.folderPath, 'transcription.json');

      // Usar Whisper desde el entorno virtual
      const whisperPath = '/root/radio-api/whisper-env/bin/whisper';
      const whisperProcess = spawn(whisperPath, [
        item.audioPath,
        '--model', 'base',
        '--language', 'Spanish',
        '--output_format', 'txt',
        '--output_dir', item.folderPath,
        '--verbose', 'False'
      ]);

      let stderr = '';

      whisperProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      whisperProcess.on('close', (code) => {
        const processingTime = Date.now() - startTime;

        if (code === 0) {
          // Buscar el archivo de transcripción generado
          const possibleFiles = [
            path.join(item.folderPath, `${path.parse(item.audioFile).name}.txt`),
            outputFile
          ];

          let transcriptionText = '';
          let transcriptionFound = false;

          for (const file of possibleFiles) {
            if (fs.existsSync(file)) {
              transcriptionText = fs.readFileSync(file, 'utf8').trim();
              transcriptionFound = true;
              
              // Mover a nombre estándar si es necesario
              if (file !== outputFile) {
                fs.renameSync(file, outputFile);
              }
              break;
            }
          }

          if (transcriptionFound && transcriptionText) {
            // Crear metadata de la transcripción
            const metadata = {
              audioFile: item.audioFile,
              folderName: item.folderName,
              transcriptionLength: transcriptionText.length,
              wordCount: transcriptionText.split(/\s+/).length,
              processingTime: processingTime,
              timestamp: new Date().toISOString(),
              model: 'whisper-base',
              language: 'es',
              success: true
            };

            fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

            console.log(`   📝 Transcripción: ${transcriptionText.substring(0, 100)}...`);
            console.log(`   📊 ${metadata.wordCount} palabras en ${processingTime}ms`);

            resolve({ success: true, transcription: transcriptionText, metadata });
          } else {
            resolve({ success: false, error: 'No se generó transcripción' });
          }
        } else {
          console.error(`   ❌ Whisper falló con código ${code}: ${stderr}`);
          resolve({ success: false, error: `Whisper error: ${stderr}` });
        }
      });

      whisperProcess.on('error', (error) => {
        console.error(`   ❌ Error ejecutando Whisper: ${error.message}`);
        resolve({ success: false, error: error.message });
      });
    });
  }

  // Función auxiliar para pausas
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obtener estadísticas de transcripciones
  getTranscriptionStats() {
    const folders = this.findRecordingFolders();
    let totalRecordings = 0;
    let transcribed = 0;
    let pending = 0;

    for (const folder of folders) {
      const audioFiles = this.findAudioFiles(folder.path);
      totalRecordings += audioFiles.length;

      for (const audioFile of audioFiles) {
        if (this.checkTranscriptionExists(folder.path, audioFile)) {
          transcribed++;
        } else {
          pending++;
        }
      }
    }

    return {
      totalFolders: folders.length,
      totalRecordings,
      transcribed,
      pending,
      transcriptionRate: totalRecordings > 0 ? (transcribed / totalRecordings * 100).toFixed(1) : 0
    };
  }

  // Forzar transcripción inmediata (para pruebas)
  async forceTranscription() {
    console.log('🚀 Forzando transcripción inmediata...');
    await this.processAllRecordings();
  }
}

module.exports = TranscriptionManager;
