// Scheduler mejorado con sistema de transcripciones automáticas
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { spawn } = require('child_process');
const TranscriptionManager = require('./transcription-manager');

class EnhancedRadioScheduler {
  constructor(configDir = './config', recordingsDir = './recordings') {
    this.configDir = configDir;
    this.recordingsDir = recordingsDir;
    this.transcriptionManager = new TranscriptionManager(recordingsDir);
    this.activeRecordings = new Map();
    this.scheduledJobs = new Map();
    
    console.log('🚀 Enhanced Radio Scheduler iniciado');
    console.log(`📁 Configuraciones: ${this.configDir}`);
    console.log(`🎵 Grabaciones: ${this.recordingsDir}`);
    console.log(`🎙️ Sistema de transcripciones: ACTIVO`);
    
    this.init();
  }

  init() {
    // Crear directorios si no existen
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }

    // Cargar programaciones existentes
    this.loadExistingSchedules();
  }

  // Cargar programaciones existentes al iniciar
  loadExistingSchedules() {
    try {
      const configFiles = fs.readdirSync(this.configDir)
        .filter(file => file.startsWith('schedule_') && file.endsWith('.json'));

      console.log(`📋 Cargando ${configFiles.length} programaciones existentes...`);

      for (const configFile of configFiles) {
        const configPath = path.join(this.configDir, configFile);
        this.loadScheduleFile(configPath);
      }

      console.log(`✅ ${this.scheduledJobs.size} programaciones cargadas`);
    } catch (error) {
      console.error('❌ Error cargando programaciones:', error);
    }
  }

  // Cargar un archivo de programación específico
  loadScheduleFile(configPath) {
    try {
      const scheduleData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Verificar status (puede ser 'active', 'ACTIVE', 'PAUSED', etc.)
      const status = (scheduleData.status || '').toUpperCase();
      
      if (status !== 'ACTIVE' && status !== 'active') {
        console.log(`⏸️ Programación inactiva: ${scheduleData.scheduleId} (status: ${scheduleData.status})`);
        return;
      }

      this.createCronJobs(scheduleData);
      console.log(`✅ Programación cargada: ${scheduleData.scheduleId}`);
      
    } catch (error) {
      console.error(`❌ Error cargando ${configPath}:`, error.message);
    }
  }

  // Crear trabajos cron para una programación
  createCronJobs(scheduleData) {
    const { scheduleId, days, schedule, radios } = scheduleData;
    
    // Validar datos requeridos
    if (!scheduleId) {
      console.error('❌ Error: scheduleId no definido en scheduleData:', scheduleData);
      return;
    }
    
    if (!schedule || !schedule.startTime) {
      console.error('❌ Error: schedule.startTime no definido para', scheduleId);
      return;
    }
    
    if (!radios || radios.length === 0) {
      console.error('❌ Error: No hay radios definidas para', scheduleId);
      return;
    }
    
    // Parsear hora de inicio
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    
    // Crear un cron job para cada día
    days.forEach(dayOfWeek => {
      const cronPattern = `${startMinute} ${startHour} * * ${dayOfWeek}`;
      const jobId = `${scheduleId}_day_${dayOfWeek}`;
      
      console.log(`⏰ Programando: ${cronPattern} para ${scheduleId} (${radios.length} radios)`);
      
      const job = cron.schedule(cronPattern, () => {
        console.log(`🚀 Ejecutando grabaciones programadas: ${scheduleId}`);
        this.executeScheduledRecordings(scheduleData);
      }, {
        scheduled: true,
        timezone: "America/Santiago"
      });
      
      this.scheduledJobs.set(jobId, {
        job: job,
        scheduleId: scheduleId,
        cronPattern: cronPattern,
        dayOfWeek: dayOfWeek,
        scheduleData: scheduleData
      });
    });
  }

  // Ejecutar grabaciones programadas
  async executeScheduledRecordings(scheduleData) {
    const { radios, schedule, phrase, scheduleId, userId, aiProvider } = scheduleData;
    
    // ✅ VERIFICAR STATUS ANTES DE GRABAR
    const status = (scheduleData.status || '').toUpperCase();
    if (status === 'PAUSED') {
      console.log(`⏸️ Schedule pausado, no grabar: ${scheduleId}`);
      return [];
    }
    
    console.log(`🎙️ Iniciando grabaciones para: ${scheduleId}`);
    console.log(`📻 ${radios.length} radios - Duración: ${schedule.duration}s`);
    if (aiProvider) {
      console.log(`🤖 IA seleccionada: ${aiProvider}`);
    }
    
    // Iniciar todas las grabaciones en PARALELO (no secuencial)
    const recordingPromises = radios.map(async (radio, index) => {
      try {
        // Pequeño delay para evitar conflictos de timestamp
        await new Promise(resolve => setTimeout(resolve, index * 100));
        
        const recordingId = this.startRecording(radio, schedule.duration, scheduleId, phrase, userId, aiProvider);
        console.log(`✅ Grabación iniciada: ${radio.name} (${recordingId})`);
        return { success: true, radio: radio.name, recordingId };
      } catch (error) {
        console.error(`❌ Error iniciando grabación ${radio.name}:`, error.message);
        return { success: false, radio: radio.name, error: error.message };
      }
    });
    
    // Esperar a que todas las grabaciones se inicien
    const results = await Promise.all(recordingPromises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Resultado: ${successful} grabaciones iniciadas, ${failed} fallos`);
    
    return results;
  }

  // Iniciar grabación con carpetas organizadas - VERSIÓN PARALELA
  startRecording(radio, duration, scheduleId, phrase = null, userId = null, aiProvider = null) {
    // Generar timestamp simple y válido
    const now = new Date();
    const cleanRadioName = radio.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Verificar si ya hay una grabación activa para esta radio
    const existingRecording = Array.from(this.activeRecordings.values())
      .find(rec => rec.radio.id === radio.id && rec.status === 'recording');
    
    if (existingRecording) {
      console.log(`⚠️ Ya hay una grabación activa para ${radio.name}, omitiendo...`);
      return existingRecording.id;
    }
    
    // Crear carpeta separada usando TranscriptionManager
    const recordingFolder = this.transcriptionManager.createRecordingFolder(cleanRadioName, now);
    const filepath = path.join(recordingFolder.folderPath, recordingFolder.audioFileName);
    
    const recordingId = `${scheduleId}_${radio.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    console.log(`🎙️ [PARALELO] Iniciando grabación: ${radio.name}`);
    console.log(`📁 Carpeta: ${recordingFolder.folderName}`);
    console.log(`⏱️ Duración: ${duration} segundos`);
    console.log(`🆔 ID: ${recordingId}`);
    
    // Crear metadata completa
    const metadata = {
      recordingId: recordingId,
      userId: userId,
      aiProvider: aiProvider,
      radio: {
        id: radio.id,
        name: radio.name,
        streamUrl: radio.streamUrl,
        region: radio.region || 'No especificada'
      },
      scheduleId: scheduleId,
      phrase: phrase,
      recording: {
        startTime: now.toISOString(),
        duration: duration,
        filename: recordingFolder.audioFileName,
        folderName: recordingFolder.folderName,
        folderPath: recordingFolder.folderPath
      },
      transcription: {
        scheduled: true,
        status: 'pending',
        scheduledTime: 'Entre 2:00-5:00 AM'
      },
      status: 'recording'
    };
    
    // Guardar metadata de forma asíncrona para no bloquear
    setImmediate(() => {
      try {
        const metadataPath = path.join(recordingFolder.folderPath, 'recording_info.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      } catch (error) {
        console.error(`❌ Error guardando metadata para ${radio.name}:`, error.message);
      }
    });
    
    // Comando ffmpeg optimizado con configuración para múltiples streams
    const ffmpegArgs = [
      '-i', radio.streamUrl,
      '-t', duration.toString(),
      '-acodec', 'mp3',
      '-ab', '128k',
      '-ar', '44100',
      '-ac', '1', // Mono para reducir tamaño
      '-threads', '1', // Limitar threads por proceso
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '2',
      '-y',
      filepath
    ];
    
    console.log(`🚀 [${radio.name}] Ejecutando: ffmpeg ${ffmpegArgs.join(' ')}`);
    
    // Spawn proceso de forma no bloqueante
    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });
    
    // Información de grabación activa
    const recordingInfo = {
      id: recordingId,
      radio: radio,
      scheduleId: scheduleId,
      folderPath: recordingFolder.folderPath,
      folderName: recordingFolder.folderName,
      filename: recordingFolder.audioFileName,
      filepath: filepath,
      duration: duration,
      startTime: new Date(),
      process: ffmpegProcess,
      phrase: phrase,
      status: 'recording',
      metadata: metadata,
      pid: ffmpegProcess.pid
    };
    
    // Agregar INMEDIATAMENTE al mapa de grabaciones activas
    this.activeRecordings.set(recordingId, recordingInfo);
    
    console.log(`✅ [${radio.name}] Proceso iniciado con PID: ${ffmpegProcess.pid}`);
    console.log(`📊 Total grabaciones activas: ${this.activeRecordings.size}`);
    
    // Manejar eventos del proceso de forma no bloqueante
    ffmpegProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('time=')) {
        // Log de progreso ocasional
        if (Math.random() < 0.05) { // Reducir frecuencia de logs
          console.log(`[${radio.name}] 🎵 Grabando...`);
        }
      }
      if (output.includes('error') || output.includes('Error')) {
        console.error(`❌ [${radio.name}] Error ffmpeg:`, output.trim());
      }
    });
    
    ffmpegProcess.on('error', (error) => {
      console.error(`❌ [${radio.name}] Error proceso:`, error.message);
      if (this.activeRecordings.has(recordingId)) {
        this.activeRecordings.get(recordingId).status = 'failed';
      }
    });
    
    ffmpegProcess.on('close', (code) => {
      const endTime = new Date();
      const actualDuration = Math.round((endTime - recordingInfo.startTime) / 1000);
      
      console.log(`🏁 [${radio.name}] Grabación finalizada: ${actualDuration}s (código: ${code})`);
      
      if (this.activeRecordings.has(recordingId)) {
        const recording = this.activeRecordings.get(recordingId);
        recording.status = code === 0 ? 'completed' : 'failed';
        recording.endTime = endTime;
        recording.exitCode = code;
        recording.actualDuration = actualDuration;
        
        // Actualizar metadata final
        const finalMetadata = {
          ...recording.metadata,
          recording: {
            ...recording.metadata.recording,
            endTime: endTime.toISOString(),
            actualDuration: actualDuration,
            exitCode: code,
            status: code === 0 ? 'completed' : 'failed'
          },
          transcription: {
            ...recording.metadata.transcription,
            status: code === 0 ? 'pending' : 'not_applicable'
          }
        };
        
        try {
          fs.writeFileSync(metadataPath, JSON.stringify(finalMetadata, null, 2));
          
          if (code === 0) {
            console.log(`📁 Grabación guardada: ${recordingFolder.folderName}`);
            console.log(`🌙 Programada para transcripción nocturna automática`);
            
            // Verificar tamaño del archivo
            try {
              const stats = fs.statSync(filepath);
              const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
              console.log(`📊 Tamaño del archivo: ${fileSizeMB} MB`);
            } catch (sizeError) {
              console.warn('⚠️ No se pudo obtener el tamaño del archivo');
            }
          }
        } catch (error) {
          console.error('❌ Error actualizando metadata final:', error);
        }
        
        // Limpiar después de 5 minutos
        setTimeout(() => {
          this.activeRecordings.delete(recordingId);
        }, 300000);
      }
    });
    
    ffmpegProcess.on('error', (error) => {
      console.error(`❌ Error en grabación ${radio.name}:`, error.message);
      
      if (this.activeRecordings.has(recordingId)) {
        const recording = this.activeRecordings.get(recordingId);
        recording.status = 'error';
        recording.error = error.message;
        
        // Guardar error en metadata
        try {
          const errorMetadata = {
            ...recording.metadata,
            recording: {
              ...recording.metadata.recording,
              endTime: new Date().toISOString(),
              status: 'error',
              error: error.message
            }
          };
          fs.writeFileSync(metadataPath, JSON.stringify(errorMetadata, null, 2));
        } catch (metaError) {
          console.error('❌ Error guardando metadata de error:', metaError);
        }
      }
    });
    
    return recordingId;
  }

  // Obtener grabaciones activas
  getActiveRecordings() {
    const active = [];
    for (const [id, recording] of this.activeRecordings) {
      active.push({
        id: id,
        radioName: recording.radio.name,
        folderName: recording.folderName,
        status: recording.status,
        startTime: recording.startTime,
        duration: recording.duration,
        scheduleId: recording.scheduleId
      });
    }
    return active;
  }

  // Obtener trabajos programados
  getScheduledJobs() {
    const jobs = [];
    for (const [jobId, jobInfo] of this.scheduledJobs) {
      jobs.push({
        jobId: jobId,
        scheduleId: jobInfo.scheduleId,
        cronPattern: jobInfo.cronPattern,
        dayOfWeek: jobInfo.dayOfWeek,
        radiosCount: jobInfo.scheduleData.radios.length
      });
    }
    return jobs;
  }

  // Obtener estadísticas de transcripciones
  getTranscriptionStats() {
    return this.transcriptionManager.getTranscriptionStats();
  }

  // Forzar transcripción inmediata (para pruebas)
  async forceTranscription() {
    console.log('🚀 Forzando transcripción inmediata...');
    return await this.transcriptionManager.forceTranscription();
  }

  // Detener grabación específica
  stopRecording(recordingId) {
    if (this.activeRecordings.has(recordingId)) {
      const recording = this.activeRecordings.get(recordingId);
      
      if (recording.process && !recording.process.killed) {
        recording.process.kill('SIGTERM');
        recording.status = 'stopped';
        console.log(`🛑 Grabación detenida: ${recording.radio.name}`);
        return true;
      }
    }
    return false;
  }

  // Remover programación
  removeSchedule(scheduleId) {
    let removed = 0;
    
    // Remover trabajos cron
    for (const [jobId, jobInfo] of this.scheduledJobs) {
      if (jobInfo.scheduleId === scheduleId) {
        jobInfo.job.stop();
        this.scheduledJobs.delete(jobId);
        removed++;
      }
    }
    
    // Marcar archivo como inactivo
    try {
      const configFiles = fs.readdirSync(this.configDir)
        .filter(file => file.includes(scheduleId));
      
      for (const configFile of configFiles) {
        const configPath = path.join(this.configDir, configFile);
        const scheduleData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        scheduleData.status = 'inactive';
        scheduleData.removedAt = new Date().toISOString();
        fs.writeFileSync(configPath, JSON.stringify(scheduleData, null, 2));
      }
    } catch (error) {
      console.error('❌ Error marcando programación como inactiva:', error);
    }
    
    console.log(`🗑️ Programación removida: ${scheduleId} (${removed} trabajos)`);
    return removed > 0;
  }

  // ========================================
  // NUEVAS FUNCIONES DE CONTROL
  // ========================================

  // Buscar schedule por sessionId
  findScheduleBySessionId(sessionId) {
    try {
      const configFiles = fs.readdirSync(this.configDir)
        .filter(file => file.startsWith('schedule_') && file.endsWith('.json'));
      
      for (const configFile of configFiles) {
        const configPath = path.join(this.configDir, configFile);
        const scheduleData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Buscar en el array de sessions
        if (scheduleData.sessions && Array.isArray(scheduleData.sessions)) {
          const hasSession = scheduleData.sessions.some(s => s.sessionId === sessionId);
          if (hasSession) {
            return {
              scheduleData: scheduleData,
              configPath: configPath,
              configFile: configFile
            };
          }
        }
      }
      
      console.log(`⚠️ No se encontró schedule para sessionId: ${sessionId}`);
      return null;
      
    } catch (error) {
      console.error('❌ Error buscando schedule:', error);
      return null;
    }
  }

  // Pausar schedule
  pauseSchedule(sessionId) {
    console.log(`⏸️ Pausando schedule para sessionId: ${sessionId}`);
    
    const result = this.findScheduleBySessionId(sessionId);
    if (!result) {
      console.error(`❌ No se puede pausar, schedule no encontrado: ${sessionId}`);
      return false;
    }
    
    const { scheduleData, configPath } = result;
    
    // Actualizar status a PAUSED
    scheduleData.status = 'PAUSED';
    scheduleData.pausedAt = new Date().toISOString();
    
    // Guardar cambios
    try {
      fs.writeFileSync(configPath, JSON.stringify(scheduleData, null, 2));
      console.log(`✅ Schedule pausado en archivo: ${configPath}`);
    } catch (error) {
      console.error('❌ Error guardando schedule pausado:', error);
      return false;
    }
    
    // Detener grabaciones activas para este sessionId
    let stoppedRecordings = 0;
    for (const [recordingId, recording] of this.activeRecordings) {
      if (recording.scheduleId === scheduleData.scheduleId) {
        if (this.stopRecording(recordingId)) {
          stoppedRecordings++;
        }
      }
    }
    
    console.log(`✅ Schedule pausado: ${sessionId} (${stoppedRecordings} grabaciones detenidas)`);
    return true;
  }

  // Reanudar schedule
  resumeSchedule(sessionId) {
    console.log(`▶️ Reanudando schedule para sessionId: ${sessionId}`);
    
    const result = this.findScheduleBySessionId(sessionId);
    if (!result) {
      console.error(`❌ No se puede reanudar, schedule no encontrado: ${sessionId}`);
      return false;
    }
    
    const { scheduleData, configPath } = result;
    
    // Actualizar status a ACTIVE
    scheduleData.status = 'ACTIVE';
    scheduleData.resumedAt = new Date().toISOString();
    
    // Guardar cambios
    try {
      fs.writeFileSync(configPath, JSON.stringify(scheduleData, null, 2));
      console.log(`✅ Schedule reanudado en archivo: ${configPath}`);
    } catch (error) {
      console.error('❌ Error guardando schedule reanudado:', error);
      return false;
    }
    
    console.log(`✅ Schedule reanudado: ${sessionId}`);
    console.log(`📅 Las grabaciones se reanudarán en el próximo horario programado`);
    return true;
  }

  // Detener y eliminar schedule completamente
  stopAndDeleteSchedule(sessionId) {
    console.log(`🛑 Deteniendo y eliminando schedule para sessionId: ${sessionId}`);
    
    const result = this.findScheduleBySessionId(sessionId);
    if (!result) {
      console.error(`❌ No se puede detener, schedule no encontrado: ${sessionId}`);
      return false;
    }
    
    const { scheduleData, configPath, configFile } = result;
    
    // 1. Detener todas las grabaciones activas
    let stoppedRecordings = 0;
    for (const [recordingId, recording] of this.activeRecordings) {
      if (recording.scheduleId === scheduleData.scheduleId) {
        if (this.stopRecording(recordingId)) {
          stoppedRecordings++;
        }
      }
    }
    console.log(`✅ ${stoppedRecordings} grabaciones detenidas`);
    
    // 2. Detener trabajos cron
    let removedJobs = 0;
    for (const [jobId, jobInfo] of this.scheduledJobs) {
      if (jobInfo.scheduleId === scheduleData.scheduleId) {
        jobInfo.job.stop();
        this.scheduledJobs.delete(jobId);
        removedJobs++;
      }
    }
    console.log(`✅ ${removedJobs} trabajos cron detenidos`);
    
    // 3. ELIMINAR el archivo de configuración
    try {
      fs.unlinkSync(configPath);
      console.log(`✅ Archivo de configuración eliminado: ${configFile}`);
    } catch (error) {
      console.error('❌ Error eliminando archivo de configuración:', error);
      return false;
    }
    
    console.log(`✅ Schedule completamente eliminado: ${sessionId}`);
    return true;
  }
}

module.exports = EnhancedRadioScheduler;
