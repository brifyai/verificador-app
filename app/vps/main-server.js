const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const FixedRadioScheduler = require('./fixed-scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Inicializar el scheduler corregido
const scheduler = new FixedRadioScheduler('./config', './recordings');

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Radio Monitoring VPS Server',
    timestamp: new Date().toISOString(),
    scheduler: {
      activeRecordings: scheduler.getActiveRecordings().length,
      scheduledJobs: scheduler.getScheduledJobs().length
    }
  });
});

// Endpoint para recibir programaciones desde el frontend
app.post('/api/schedule', (req, res) => {
  try {
    console.log('📥 Nueva programación recibida');
    console.log('📋 Datos:', JSON.stringify(req.body, null, 2));

    const scheduleData = req.body;
    
    // Validar datos requeridos
    const requiredFields = ['userId', 'radios', 'days', 'schedule'];
    const missingFields = requiredFields.filter(field => !scheduleData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        missingFields: missingFields
      });
    }

    // Validar radios
    if (!Array.isArray(scheduleData.radios) || scheduleData.radios.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe incluir al menos una radio válida'
      });
    }

    // Validar días
    if (!Array.isArray(scheduleData.days) || scheduleData.days.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe incluir al menos un día válido'
      });
    }

    // Validar horarios
    if (!scheduleData.schedule.startTime || !scheduleData.schedule.endTime) {
      return res.status(400).json({
        success: false,
        error: 'Horarios de inicio y fin son requeridos'
      });
    }

    // Generar ID único para la programación
    const timestamp = Date.now();
    const scheduleId = `schedule_${scheduleData.userId}_${timestamp}`;
    
    // Agregar metadatos
    const enrichedScheduleData = {
      ...scheduleData,
      id: scheduleId,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // Guardar archivo de configuración
    const configPath = path.join('./config', `${scheduleId}.json`);
    fs.writeFileSync(configPath, JSON.stringify(enrichedScheduleData, null, 2));
    
    console.log(`💾 Programación guardada: ${configPath}`);

    // El scheduler detectará automáticamente el nuevo archivo
    // y lo cargará en el próximo ciclo de verificación

    res.json({
      success: true,
      message: 'Programación recibida y configurada correctamente',
      data: {
        scheduleId: scheduleId,
        message: 'Programación guardada correctamente',
        scheduleFile: configPath,
        totalRadios: scheduleData.radios.length,
        scheduledDays: scheduleData.days.length,
        nextCheck: 'El scheduler verificará esta programación en el próximo minuto'
      },
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

// Endpoint para obtener estado del scheduler
app.get('/api/status', (req, res) => {
  try {
    const status = scheduler.getStatus();
    
    res.json({
      success: true,
      data: {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        },
        scheduler: {
          activeRecordings: status.activeRecordings,
          scheduledJobs: status.scheduledJobs,
          cacheSize: status.cacheSize
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para obtener grabaciones activas
app.get('/api/recordings/active', (req, res) => {
  try {
    const activeRecordings = scheduler.getActiveRecordings();
    
    res.json({
      success: true,
      data: {
        count: activeRecordings.length,
        recordings: activeRecordings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para detener una grabación específica
app.post('/api/recordings/:recordingId/stop', (req, res) => {
  try {
    const { recordingId } = req.params;
    const stopped = scheduler.stopRecording(recordingId);
    
    if (stopped) {
      res.json({
        success: true,
        message: `Grabación ${recordingId} detenida correctamente`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Grabación no encontrada o ya detenida'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para obtener programaciones activas
app.get('/api/schedules', (req, res) => {
  try {
    const configDir = './config';
    const files = fs.readdirSync(configDir);
    const scheduleFiles = files.filter(file => 
      file.startsWith('schedule_') && file.endsWith('.json')
    );
    
    const schedules = scheduleFiles.map(file => {
      try {
        const filePath = path.join(configDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const stats = fs.statSync(filePath);
        
        return {
          id: path.basename(file, '.json'),
          userId: data.userId,
          radiosCount: data.radios?.length || 0,
          days: data.days,
          schedule: data.schedule,
          phrase: data.phrase ? {
            text: data.phrase.text,
            brand: data.phrase.brand
          } : null,
          createdAt: data.createdAt,
          fileModified: stats.mtime.toISOString()
        };
      } catch (error) {
        console.error(`Error leyendo ${file}:`, error.message);
        return null;
      }
    }).filter(Boolean);

    res.json({
      success: true,
      data: {
        count: schedules.length,
        schedules: schedules
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para eliminar una programación
app.delete('/api/schedules/:scheduleId', (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    scheduler.removeSchedule(scheduleId);
    
    res.json({
      success: true,
      message: `Programación ${scheduleId} eliminada correctamente`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para obtener logs de grabaciones
app.get('/api/recordings/logs', (req, res) => {
  try {
    const recordingsDir = './recordings';
    
    if (!fs.existsSync(recordingsDir)) {
      return res.json({
        success: true,
        data: {
          count: 0,
          recordings: []
        }
      });
    }

    const files = fs.readdirSync(recordingsDir);
    const recordings = files
      .filter(file => file.endsWith('.mp3'))
      .map(file => {
        const filePath = path.join(recordingsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          size: stats.size,
          sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({
      success: true,
      data: {
        count: recordings.length,
        totalSize: recordings.reduce((sum, r) => sum + r.size, 0),
        recordings: recordings.slice(0, 50) // Últimas 50
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para test de conectividad
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'VPS Server funcionando correctamente',
    timestamp: new Date().toISOString(),
    server: {
      node: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  });
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('❌ Error del servidor:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  
  // Detener todas las grabaciones activas
  const activeRecordings = scheduler.getActiveRecordings();
  activeRecordings.forEach(recording => {
    scheduler.stopRecording(recording.id);
  });
  
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  
  // Detener todas las grabaciones activas
  const activeRecordings = scheduler.getActiveRecordings();
  activeRecordings.forEach(recording => {
    scheduler.stopRecording(recording.id);
  });
  
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Servidor VPS iniciado correctamente');
  console.log(`📡 Escuchando en puerto ${PORT}`);
  console.log(`🌐 Accesible en: http://0.0.0.0:${PORT}`);
  console.log('📊 Endpoints disponibles:');
  console.log('   GET  / - Health check');
  console.log('   POST /api/schedule - Recibir programaciones');
  console.log('   GET  /api/status - Estado del scheduler');
  console.log('   GET  /api/recordings/active - Grabaciones activas');
  console.log('   GET  /api/schedules - Programaciones activas');
  console.log('   GET  /api/recordings/logs - Logs de grabaciones');
  console.log('   GET  /api/test - Test de conectividad');
});

module.exports = app;
