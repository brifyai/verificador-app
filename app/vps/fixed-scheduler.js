const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class FixedRadioScheduler {
  constructor(configDir = './config', recordingsDir = './recordings') {
    this.configDir = configDir;
    this.recordingsDir = recordingsDir;
    this.activeRecordings = new Map();
    this.scheduledJobs = new Map();
    this.scheduleCache = new Map();
    
    console.log('🚀 Iniciando Fixed Radio Scheduler...');
    console.log(`📁 Config: ${this.configDir}`);
    console.log(`🎵 Recordings: ${this.recordingsDir}`);
    
    this.init();
  }

  init() {
    // Crear directorios
    [this.configDir, this.recordingsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
      }
    });

    // Cargar programaciones existentes
    this.loadAllSchedules();
    
    // Verificar nuevas programaciones cada minuto
    cron.schedule('* * * * *', () => {
      this.checkForNewSchedules();
    });

    // Limpiar grabaciones antiguas cada hora
    cron.schedule('0 * * * *', () => {
      this.cleanupOldRecordings();
    });

    // Mostrar estadísticas cada 10 minutos
    cron.schedule('*/10 * * * *', () => {
      this.showStatus();
    });

    console.log('✅ Fixed Scheduler iniciado correctamente');
  }

  loadAllSchedules() {
    try {
      const files = fs.readdirSync(this.configDir);
      const scheduleFiles = files.filter(file => 
        file.startsWith('schedule_') && file.endsWith('.json')
      );
      
      console.log(`📋 Encontrados ${scheduleFiles.length} archivos de programación`);
      
      scheduleFiles.forEach(file => {
        const filePath = path.join(this.configDir, file);
        this.loadScheduleFile(filePath);
      });
      
    } catch (error) {
      console.error('❌ Error cargando programaciones:', error.message);
    }
  }

  loadScheduleFile(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const scheduleId = path.basename(filePath, '.json');
      
      // Verificar si ya está cargado y no ha cambiado
      const fileStats = fs.statSync(filePath);
      const cacheKey = `${scheduleId}_${fileStats.mtime.getTime()}`;
      
      if (this.scheduleCache.has(cacheKey)) {
        return; // Ya está cargado y actualizado
      }

      console.log(`📅 Cargando programación: ${scheduleId}`);
      this.logScheduleInfo(data);
      
      // Validar datos
      if (!this.validateScheduleData(data)) {
        console.error(`❌ Datos inválidos en ${scheduleId}`);
        return;
      }

      this.scheduleRecordings(scheduleId, data);
      this.scheduleCache.set(cacheKey, data);
      
    } catch (error) {
      console.error(`❌ Error cargando ${filePath}:`, error.message);
    }
  }

  validateScheduleData(data) {
    const required = ['userId', 'radios', 'days', 'schedule'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      console.error(`❌ Campos faltantes: ${missing.join(', ')}`);
      return false;
    }

    if (!Array.isArray(data.radios) || data.radios.length === 0) {
      console.error('❌ No hay radios válidas');
      return false;
    }

    if (!Array.isArray(data.days) || data.days.length === 0) {
      console.error('❌ No hay días válidos');
      return false;
    }

    if (!data.schedule.startTime || !data.schedule.endTime) {
      console.error('❌ Horarios incompletos');
      return false;
    }

    return true;
  }

  logScheduleInfo(data) {
    console.log(`   👤 Usuario: ${data.userId}`);
    console.log(`   📻 Radios: ${data.radios?.length || 0}`);
    
    // Convertir números de días a nombres
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const daysList = data.days?.map(d => dayNames[d] || d).join(', ');
    console.log(`   📅 Días: ${daysList}`);
    console.log(`   ⏰ Horario: ${data.schedule?.startTime} - ${data.schedule?.endTime}`);
    
    if (data.phrase) {
      console.log(`   🔍 Frase: "${data.phrase.text}" (${data.phrase.brand})`);
    }

    // Mostrar próximas ejecuciones CORREGIDAS
    this.showNextExecutions(data);
  }

  showNextExecutions(data) {
    const now = new Date();
    const nextExecutions = [];

    console.log(`🕐 Hora actual: ${now.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`);
    console.log(`📅 Día actual: ${now.getDay()} (${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][now.getDay()]})`);

    data.days.forEach(dayOfWeek => {
      const [hour, minute] = data.schedule.startTime.split(':').map(Number);
      
      // Crear fecha para hoy con la hora programada
      const todayExecution = new Date();
      todayExecution.setHours(hour, minute, 0, 0);
      
      let nextExecution;
      
      if (dayOfWeek === now.getDay()) {
        // Es el mismo día de hoy
        if (todayExecution > now) {
          // La hora aún no ha pasado, ejecutar HOY
          nextExecution = todayExecution;
          console.log(`✅ PROGRAMADO PARA HOY: ${nextExecution.toLocaleString('es-CL')}`);
        } else {
          // La hora ya pasó, programar para la próxima semana
          nextExecution = new Date(todayExecution);
          nextExecution.setDate(nextExecution.getDate() + 7);
          console.log(`⏭️ Hora pasada, próxima semana: ${nextExecution.toLocaleString('es-CL')}`);
        }
      } else {
        // Es otro día de la semana
        const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
        nextExecution = new Date(todayExecution);
        nextExecution.setDate(nextExecution.getDate() + daysUntilTarget);
        
        const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayOfWeek];
        console.log(`📅 Programado para ${dayName}: ${nextExecution.toLocaleString('es-CL')}`);
      }
      
      nextExecutions.push({
        day: dayOfWeek,
        date: nextExecution,
        timeUntil: nextExecution.getTime() - now.getTime()
      });
    });

    // Mostrar las próximas 3 ejecuciones
    console.log('\n⏳ Próximas ejecuciones:');
    nextExecutions
      .sort((a, b) => a.timeUntil - b.timeUntil)
      .slice(0, 3)
      .forEach((exec, i) => {
        const hoursUntil = Math.floor(exec.timeUntil / (1000 * 60 * 60));
        const minutesUntil = Math.floor((exec.timeUntil % (1000 * 60 * 60)) / (1000 * 60));
        const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][exec.day];
        
        if (hoursUntil < 0) {
          console.log(`   ${i + 1}. ${dayName} ${exec.date.toLocaleString('es-CL')} (⚠️ Hora pasada)`);
        } else if (hoursUntil === 0 && minutesUntil <= 60) {
          console.log(`   ${i + 1}. ${dayName} ${exec.date.toLocaleString('es-CL')} (🚨 EN ${minutesUntil} MINUTOS)`);
        } else {
          console.log(`   ${i + 1}. ${dayName} ${exec.date.toLocaleString('es-CL')} (en ${hoursUntil}h ${minutesUntil}m)`);
        }
      });
    console.log('');
  }

  scheduleRecordings(scheduleId, scheduleData) {
    const { radios, days, schedule } = scheduleData;
    
    // Cancelar trabajos existentes
    if (this.scheduledJobs.has(scheduleId)) {
      this.scheduledJobs.get(scheduleId).forEach(job => job.destroy());
    }

    const jobs = [];
    const now = new Date();

    console.log(`🔧 Configurando cron jobs para ${scheduleId}...`);

    // Crear cron job para cada día
    days.forEach(dayOfWeek => {
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      
      // Validar horarios
      if (isNaN(startHour) || isNaN(startMinute)) {
        console.error(`❌ Horario de inicio inválido: ${schedule.startTime}`);
        return;
      }

      // Cron pattern para inicio
      const startCronPattern = `${startMinute} ${startHour} * * ${dayOfWeek}`;
      
      // Verificar si es para hoy y si ya pasó la hora
      const todayExecution = new Date();
      todayExecution.setHours(startHour, startMinute, 0, 0);
      
      let willExecuteToday = false;
      if (dayOfWeek === now.getDay() && todayExecution > now) {
        willExecuteToday = true;
        const minutesUntil = Math.floor((todayExecution.getTime() - now.getTime()) / (1000 * 60));
        console.log(`🚨 EJECUTARÁ HOY en ${minutesUntil} minutos: ${startCronPattern}`);
      } else {
        console.log(`⏰ Programando para día ${dayOfWeek}: ${startCronPattern}`);
      }
      
      const startJob = cron.schedule(startCronPattern, () => {
        const executeTime = new Date().toLocaleString('es-CL');
        console.log(`🚀 [${executeTime}] INICIANDO GRABACIONES - ${scheduleId}`);
        console.log(`   📅 Día programado: ${dayOfWeek} (${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayOfWeek]})`);
        console.log(`   🕐 Hora programada: ${schedule.startTime}`);
        this.startScheduledRecordings(scheduleId, scheduleData);
      }, {
        scheduled: true,
        timezone: "America/Santiago"
      });

      jobs.push(startJob);

      // Si hay duración específica, programar parada automática
      if (schedule.duration && schedule.duration > 0) {
        // Calcular hora de fin
        const endTime = new Date();
        endTime.setHours(startHour, startMinute, 0, 0);
        endTime.setSeconds(endTime.getSeconds() + schedule.duration);
        
        const endCronPattern = `${endTime.getMinutes()} ${endTime.getHours()} * * ${dayOfWeek}`;
        
        const stopJob = cron.schedule(endCronPattern, () => {
          console.log(`⏹️ [${new Date().toLocaleString('es-CL')}] DETENIENDO GRABACIONES - ${scheduleId}`);
          this.stopScheduledRecordings(scheduleId);
        }, {
          scheduled: true,
          timezone: "America/Santiago"
        });

        jobs.push(stopJob);
      }
    });

    this.scheduledJobs.set(scheduleId, jobs);
    console.log(`✅ Programación ${scheduleId} configurada con ${jobs.length} trabajos cron`);
  }

  async startScheduledRecordings(scheduleId, scheduleData) {
    const { radios, schedule, phrase, userId } = scheduleData;
    
    console.log(`🎙️ Iniciando grabaciones programadas: ${scheduleId}`);
    console.log(`   📻 ${radios.length} radios`);
    console.log(`   ⏱️ Duración: ${schedule.duration} segundos`);
    
    const startPromises = radios.map(radio => 
      this.startRadioRecording(scheduleId, radio, schedule, phrase, userId)
        .catch(error => {
          console.error(`❌ Error iniciando ${radio.name}:`, error.message);
          return null;
        })
    );

    const results = await Promise.allSettled(startPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`📊 Grabaciones iniciadas: ${successful}/${radios.length}`);
  }

  async startRadioRecording(scheduleId, radio, schedule, phrase, userId) {
    const recordingId = `${scheduleId}_${radio.id}_${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeRadioName = radio.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeRadioName}_${timestamp}.mp3`;
    const outputPath = path.join(this.recordingsDir, filename);
    
    console.log(`🎵 Iniciando grabación: ${radio.name}`);
    console.log(`   📁 ${outputPath}`);
    console.log(`   🔗 ${radio.streamUrl}`);
    
    // Verificar que la URL sea válida
    if (!radio.streamUrl || !radio.streamUrl.startsWith('http')) {
      throw new Error(`URL inválida para ${radio.name}: ${radio.streamUrl}`);
    }

    const ffmpegArgs = [
      '-i', radio.streamUrl,
      '-t', schedule.duration.toString(),
      '-acodec', 'mp3',
      '-ab', '128k',
      '-ar', '44100',
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      '-y',
      outputPath
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    
    this.activeRecordings.set(recordingId, {
      process: ffmpeg,
      radio: radio,
      startTime: new Date(),
      outputPath: outputPath,
      scheduleId: scheduleId,
      phrase: phrase,
      userId: userId,
      expectedDuration: schedule.duration
    });

    // Manejo de eventos del proceso
    this.setupRecordingEventHandlers(recordingId, ffmpeg, radio);

    return recordingId;
  }

  setupRecordingEventHandlers(recordingId, ffmpeg, radio) {
    let lastOutput = Date.now();

    ffmpeg.stderr.on('data', (data) => {
      lastOutput = Date.now();
      const output = data.toString();
      
      // Solo mostrar información importante
      if (output.includes('time=') || output.includes('error') || output.includes('failed')) {
        console.log(`[${radio.name}] ${output.trim()}`);
      }
    });

    ffmpeg.on('close', (code) => {
      const recording = this.activeRecordings.get(recordingId);
      if (recording) {
        const duration = (Date.now() - recording.startTime.getTime()) / 1000;
        
        if (code === 0) {
          console.log(`✅ Grabación completada: ${radio.name} (${duration.toFixed(1)}s)`);
          
          // Verificar tamaño del archivo
          this.validateRecordingFile(recording.outputPath);
          
          // Procesar para detección si hay frase
          if (recording.phrase && recording.phrase.text) {
            this.processRecordingForDetection(recordingId, recording);
          }
          
        } else {
          console.log(`❌ Grabación falló: ${radio.name} (código: ${code}, duración: ${duration.toFixed(1)}s)`);
        }
        
        this.activeRecordings.delete(recordingId);
      }
    });

    ffmpeg.on('error', (error) => {
      console.error(`❌ Error FFmpeg ${radio.name}:`, error.message);
      this.activeRecordings.delete(recordingId);
    });

    // Timeout de seguridad
    setTimeout(() => {
      if (this.activeRecordings.has(recordingId)) {
        console.log(`⏰ Timeout alcanzado para ${radio.name}, deteniendo...`);
        this.stopRecording(recordingId);
      }
    }, (this.activeRecordings.get(recordingId)?.expectedDuration || 3600) * 1000 + 30000);
  }

  validateRecordingFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      
      if (stats.size < 1000) {
        console.warn(`⚠️ Archivo muy pequeño: ${filePath} (${sizeMB}MB)`);
      } else {
        console.log(`📁 Archivo creado: ${sizeMB}MB`);
      }
    } catch (error) {
      console.error(`❌ Error verificando archivo: ${error.message}`);
    }
  }

  async processRecordingForDetection(recordingId, recording) {
    console.log(`🔍 Procesando detección: "${recording.phrase.text}"`);
    console.log(`   📁 ${recording.outputPath}`);
    console.log(`   🏢 ${recording.phrase.brand}`);
    
    // TODO: Implementar transcripción y detección
  }

  stopScheduledRecordings(scheduleId) {
    let stopped = 0;
    
    for (const [recordingId, recording] of this.activeRecordings.entries()) {
      if (recording.scheduleId === scheduleId) {
        this.stopRecording(recordingId);
        stopped++;
      }
    }
    
    console.log(`⏹️ Detenidas ${stopped} grabaciones para ${scheduleId}`);
  }

  stopRecording(recordingId) {
    const recording = this.activeRecordings.get(recordingId);
    if (recording) {
      recording.process.kill('SIGTERM');
      this.activeRecordings.delete(recordingId);
      console.log(`⏹️ Grabación detenida: ${recording.radio.name}`);
      return true;
    }
    return false;
  }

  checkForNewSchedules() {
    try {
      const files = fs.readdirSync(this.configDir);
      const scheduleFiles = files.filter(file => 
        file.startsWith('schedule_') && file.endsWith('.json')
      );
      
      scheduleFiles.forEach(file => {
        const scheduleId = path.basename(file, '.json');
        const filePath = path.join(this.configDir, file);
        const fileStats = fs.statSync(filePath);
        const cacheKey = `${scheduleId}_${fileStats.mtime.getTime()}`;
        
        if (!this.scheduleCache.has(cacheKey)) {
          console.log(`📥 Nueva/actualizada programación: ${scheduleId}`);
          this.loadScheduleFile(filePath);
        }
      });
      
    } catch (error) {
      // Silencioso
    }
  }

  cleanupOldRecordings() {
    try {
      const files = fs.readdirSync(this.recordingsDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
      let cleaned = 0;

      files.forEach(file => {
        const filePath = path.join(this.recordingsDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        console.log(`🧹 Limpiados ${cleaned} archivos antiguos`);
      }
    } catch (error) {
      console.error('❌ Error limpiando archivos:', error.message);
    }
  }

  showStatus() {
    const activeCount = this.activeRecordings.size;
    const scheduledCount = this.scheduledJobs.size;
    
    console.log(`📊 Estado: ${activeCount} grabaciones activas, ${scheduledCount} programaciones`);
    
    if (activeCount > 0) {
      console.log('   🎵 Grabaciones activas:');
      for (const [id, recording] of this.activeRecordings.entries()) {
        const elapsed = Math.floor((Date.now() - recording.startTime.getTime()) / 1000);
        console.log(`      - ${recording.radio.name} (${elapsed}s)`);
      }
    }
  }

  // API Methods
  getStatus() {
    return {
      activeRecordings: this.getActiveRecordings(),
      scheduledJobs: this.getScheduledJobs(),
      cacheSize: this.scheduleCache.size
    };
  }

  getActiveRecordings() {
    return Array.from(this.activeRecordings.entries()).map(([id, recording]) => ({
      id,
      radio: recording.radio.name,
      startTime: recording.startTime,
      elapsedSeconds: Math.floor((Date.now() - recording.startTime.getTime()) / 1000),
      expectedDuration: recording.expectedDuration,
      scheduleId: recording.scheduleId
    }));
  }

  getScheduledJobs() {
    return Array.from(this.scheduledJobs.keys());
  }

  removeSchedule(scheduleId) {
    // Detener grabaciones activas
    this.stopScheduledRecordings(scheduleId);
    
    // Cancelar trabajos programados
    if (this.scheduledJobs.has(scheduleId)) {
      this.scheduledJobs.get(scheduleId).forEach(job => job.destroy());
      this.scheduledJobs.delete(scheduleId);
    }
    
    // Limpiar cache
    for (const key of this.scheduleCache.keys()) {
      if (key.startsWith(scheduleId)) {
        this.scheduleCache.delete(key);
      }
    }
    
    // Eliminar archivo
    const filePath = path.join(this.configDir, `${scheduleId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    console.log(`🗑️ Programación eliminada: ${scheduleId}`);
  }
}

module.exports = FixedRadioScheduler;
