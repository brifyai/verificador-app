// Servidor VPS mejorado con sistema de transcripciones automáticas
const express = require('express');
const fs = require('fs');
const path = require('path');
const EnhancedRadioScheduler = require('./enhanced-scheduler');

const app = express();
const port = process.env.PORT || 3000;

// Inicializar el scheduler mejorado
const scheduler = new EnhancedRadioScheduler('./config', './recordings');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Directorios
const CONFIG_DIR = path.join(__dirname, 'config');
const RECORDINGS_DIR = path.join(__dirname, 'recordings');

// Crear directorios si no existen
[CONFIG_DIR, RECORDINGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
});

// === ENDPOINTS PRINCIPALES ===

// Endpoint principal para recibir programaciones del dashboard
app.post('/api/schedule', async (req, res) => {
  try {
    console.log('📥 Nueva programación recibida del dashboard');
    console.log('📋 Datos:', JSON.stringify(req.body, null, 2));
    
    const { userId, radios, days, schedule, phrase, metadata } = req.body;
    
    // Validaciones
    if (!userId || !radios || !Array.isArray(radios) || radios.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userId y radios son requeridos'
      });
    }
    
    if (!days || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'days es requerido y debe ser un array'
      });
    }
    
    if (!schedule || !schedule.startTime || !schedule.endTime) {
      return res.status(400).json({
        success: false,
        error: 'schedule con startTime y endTime es requerido'
      });
    }

    console.log(`📅 Programando ${radios.length} radio(s) para ${days.length} día(s)`);
    console.log(`⏰ Horario: ${schedule.startTime} - ${schedule.endTime}`);
    
    // Crear configuración completa
    const timestamp = Date.now();
    const scheduleId = `schedule_${userId}_${timestamp}`;
    const configFile = path.join(CONFIG_DIR, `${scheduleId}.json`);
    
    const scheduleConfig = {
      scheduleId,
      userId,
      radios,
      days,
      schedule,
      phrase: phrase || null,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        source: 'dashboard',
        version: '2.0'
      },
      transcription: {
        enabled: true,
        autoScheduled: true,
        timeWindow: '02:00-05:00',
        model: 'whisper-base'
      },
      status: 'active'
    };
    
    // Guardar configuración
    fs.writeFileSync(configFile, JSON.stringify(scheduleConfig, null, 2));
    console.log(`💾 Configuración guardada: ${scheduleId}.json`);
    
    // Cargar en el scheduler mejorado
    console.log('🤖 Cargando en scheduler mejorado...');
    scheduler.loadScheduleFile(configFile);
    
    // Respuesta exitosa
    const result = {
      scheduleId,
      message: 'Programación configurada con sistema de transcripciones automáticas',
      radios: radios.length,
      days: days,
      schedule: schedule,
      transcription: {
        enabled: true,
        window: '02:00-05:00 AM',
        model: 'whisper-base'
      },
      configFile: `${scheduleId}.json`,
      schedulerStatus: 'active'
    };
    
    res.json({
      success: true,
      message: 'Programación recibida y configurada correctamente',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error procesando programación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// === ENDPOINTS DE MONITOREO ===

// Estado del scheduler mejorado
app.get('/api/scheduler/status', (req, res) => {
  try {
    const activeRecordings = scheduler.getActiveRecordings();
    const scheduledJobs = scheduler.getScheduledJobs();
    const transcriptionStats = scheduler.getTranscriptionStats();
    
    res.json({
      success: true,
      scheduler: {
        version: '2.0-enhanced',
        active: true,
        activeRecordings: activeRecordings.length,
        scheduledJobs: scheduledJobs.length,
        recordings: activeRecordings,
        schedules: scheduledJobs
      },
      transcription: {
        enabled: true,
        stats: transcriptionStats,
        schedule: 'Automática entre 02:00-05:00 AM',
        model: 'whisper-base'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado del scheduler',
      details: error.message
    });
  }
});

// Grabaciones activas
app.get('/api/recordings/active', (req, res) => {
  try {
    const active = scheduler.getActiveRecordings();
    
    res.json({
      success: true,
      activeRecordings: active,
      count: active.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo grabaciones activas',
      details: error.message
    });
  }
});

// Estadísticas de transcripciones
app.get('/api/transcriptions/stats', (req, res) => {
  try {
    const stats = scheduler.getTranscriptionStats();
    
    res.json({
      success: true,
      transcription: {
        stats: stats,
        schedule: 'Automática entre 02:00-05:00 AM',
        model: 'whisper-base',
        enabled: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas de transcripciones',
      details: error.message
    });
  }
});

// Forzar transcripción inmediata (para pruebas)
app.post('/api/transcriptions/force', async (req, res) => {
  try {
    console.log('🚀 Forzando transcripción inmediata...');
    await scheduler.forceTranscription();
    
    res.json({
      success: true,
      message: 'Transcripción forzada iniciada',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error forzando transcripción',
      details: error.message
    });
  }
});

// Ver todas las programaciones
app.get('/api/schedules', (req, res) => {
  try {
    const scheduleFiles = fs.readdirSync(CONFIG_DIR)
      .filter(file => file.startsWith('schedule_') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(CONFIG_DIR, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const stats = fs.statSync(filePath);
        
        return {
          file: file,
          scheduleId: content.scheduleId,
          userId: content.userId,
          radiosCount: content.radios?.length || 0,
          daysCount: content.days?.length || 0,
          status: content.status,
          createdAt: content.metadata?.createdAt || stats.birthtime,
          transcriptionEnabled: content.transcription?.enabled || false
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      schedules: scheduleFiles,
      count: scheduleFiles.length,
      active: scheduleFiles.filter(s => s.status === 'active').length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo programaciones',
      details: error.message
    });
  }
});

// Detener grabación específica
app.post('/api/scheduler/stop/:recordingId', (req, res) => {
  try {
    const { recordingId } = req.params;
    const stopped = scheduler.stopRecording(recordingId);
    
    if (stopped) {
      res.json({
        success: true,
        message: `Grabación ${recordingId} detenida correctamente`,
        recordingId: recordingId
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Grabación no encontrada o ya finalizada',
        recordingId: recordingId
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deteniendo grabación',
      details: error.message
    });
  }
});

// Remover programación
app.delete('/api/scheduler/remove/:scheduleId', (req, res) => {
  try {
    const { scheduleId } = req.params;
    const removed = scheduler.removeSchedule(scheduleId);
    
    if (removed) {
      res.json({
        success: true,
        message: `Programación ${scheduleId} removida correctamente`,
        scheduleId: scheduleId
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Programación no encontrada',
        scheduleId: scheduleId
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error removiendo programación',
      details: error.message
    });
  }
});

// === ENDPOINT DE ESTADO GENERAL ===

app.get('/', (req, res) => {
  const stats = scheduler.getTranscriptionStats();
  
  res.json({
    message: 'VPS Radio Recording API v2.0 - Enhanced con Transcripciones Automáticas',
    status: 'active',
    version: '2.0-enhanced',
    features: [
      'Grabaciones organizadas en carpetas separadas',
      'Transcripciones automáticas nocturnas (02:00-05:00 AM)',
      'Sistema de metadata completo',
      'Verificación automática de transcripciones existentes',
      'Scheduler mejorado con mejor manejo de errores'
    ],
    scheduler: {
      active: true,
      activeRecordings: scheduler.getActiveRecordings().length,
      scheduledJobs: scheduler.getScheduledJobs().length
    },
    transcription: {
      enabled: true,
      stats: stats,
      schedule: '02:00-05:00 AM automático',
      model: 'whisper-base'
    },
    endpoints: [
      'POST /api/schedule - Programar grabaciones desde dashboard',
      'GET /api/scheduler/status - Estado completo del sistema',
      'GET /api/recordings/active - Grabaciones en curso',
      'GET /api/transcriptions/stats - Estadísticas de transcripciones',
      'POST /api/transcriptions/force - Forzar transcripción inmediata',
      'GET /api/schedules - Ver todas las programaciones',
      'POST /api/scheduler/stop/:id - Detener grabación',
      'DELETE /api/scheduler/remove/:id - Remover programación'
    ],
    timestamp: new Date().toISOString()
  });
});

// === INICIAR SERVIDOR ===

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 VPS Radio Recording API v2.0-Enhanced iniciado`);
  console.log(`📡 Escuchando en: http://0.0.0.0:${port}`);
  console.log(`📁 Configuraciones: ${CONFIG_DIR}`);
  console.log(`🎵 Grabaciones: ${RECORDINGS_DIR}`);
  console.log(`🎙️ Transcripciones automáticas: 02:00-05:00 AM`);
  console.log(`🤖 Sistema mejorado: ACTIVO`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  console.log('💾 Guardando estado del scheduler...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Señal SIGTERM recibida, cerrando servidor...');
  process.exit(0);
});
