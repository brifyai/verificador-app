const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Directorio para configuraciones y grabaciones
const CONFIG_DIR = path.join(__dirname, 'config');
const RECORDINGS_DIR = path.join(__dirname, 'recordings');

// Crear directorios si no existen
[CONFIG_DIR, RECORDINGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
});

// Almacenar procesos de grabación activos
const activeRecordings = new Map();

// Función para iniciar grabación
function startRecording(radio, schedule, userId) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${radio.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.mp3`;
  const outputPath = path.join(RECORDINGS_DIR, filename);
  
  console.log(`🎙️ Iniciando grabación: ${radio.name}`);
  console.log(`📁 Archivo: ${outputPath}`);
  console.log(`⏱️ Duración: ${schedule.duration} segundos`);

  // Comando ffmpeg para grabar stream de radio
  const ffmpegArgs = [
    '-i', radio.streamUrl,
    '-t', schedule.duration.toString(),
    '-acodec', 'mp3',
    '-ab', '128k',
    '-ar', '44100',
    '-y', // sobrescribir archivo si existe
    outputPath
  ];

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
  
  const recordingId = `${radio.id}_${Date.now()}`;
  
  activeRecordings.set(recordingId, {
    process: ffmpegProcess,
    radio: radio,
    startTime: new Date(),
    outputPath: outputPath,
    userId: userId
  });

  ffmpegProcess.stdout.on('data', (data) => {
    console.log(`[${radio.name}] stdout: ${data}`);
  });

  ffmpegProcess.stderr.on('data', (data) => {
    console.log(`[${radio.name}] stderr: ${data}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`✅ Grabación finalizada: ${radio.name} (código: ${code})`);
    activeRecordings.delete(recordingId);
    
    // Aquí puedes agregar lógica para subir el archivo, notificar, etc.
    if (code === 0) {
      console.log(`📁 Archivo guardado: ${outputPath}`);
    } else {
      console.error(`❌ Error en grabación: ${radio.name}`);
    }
  });

  return recordingId;
}

// Función para programar grabaciones usando cron-like logic
function scheduleRecordings(scheduleData) {
  const { userId, radios, days, schedule } = scheduleData;
  
  console.log(`📅 Programando grabaciones para ${radios.length} radio(s)`);
  console.log(`🗓️ Días: ${days.join(', ')}`);
  console.log(`⏰ Horario: ${schedule.startTime} - ${schedule.endTime}`);

  // Guardar programación en archivo
  const scheduleFile = path.join(CONFIG_DIR, `schedule_${userId}_${Date.now()}.json`);
  fs.writeFileSync(scheduleFile, JSON.stringify(scheduleData, null, 2));
  
  // Aquí implementarías la lógica de cron/scheduler
  // Por simplicidad, voy a mostrar cómo iniciar grabaciones inmediatamente para prueba
  
  // Para implementación real, usarías node-cron o similar:
  /*
  const cron = require('node-cron');
  
  days.forEach(day => {
    const cronExpression = `0 ${schedule.startTime.split(':')[1]} ${schedule.startTime.split(':')[0]} * * ${day}`;
    
    cron.schedule(cronExpression, () => {
      radios.forEach(radio => {
        startRecording(radio, schedule, userId);
      });
    });
  });
  */
  
  return {
    message: 'Programación guardada correctamente',
    scheduleFile: scheduleFile,
    totalRadios: radios.length,
    scheduledDays: days.length
  };
}

// ENDPOINTS

// Endpoint principal para recibir programación
app.post('/api/schedule', (req, res) => {
  try {
    console.log('📥 Programación recibida:', JSON.stringify(req.body, null, 2));
    
    const { userId, radios, days, schedule } = req.body;
    
    // Validaciones
    if (!userId || !radios || !Array.isArray(radios) || radios.length === 0) {
      return res.status(400).json({
        error: 'userId y radios son requeridos'
      });
    }
    
    if (!days || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        error: 'Debe especificar al menos un día'
      });
    }
    
    if (!schedule || !schedule.startTime || !schedule.endTime) {
      return res.status(400).json({
        error: 'Horario de inicio y fin son requeridos'
      });
    }

    // Procesar programación
    const result = scheduleRecordings(req.body);
    
    res.json({
      success: true,
      message: 'Programación recibida y configurada correctamente',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error procesando programación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Endpoint para iniciar grabación manual (para pruebas)
app.post('/api/record/start', (req, res) => {
  try {
    const { radioId, radioName, streamUrl, duration = 60 } = req.body;
    
    if (!radioId || !streamUrl) {
      return res.status(400).json({
        error: 'radioId y streamUrl son requeridos'
      });
    }
    
    const radio = { id: radioId, name: radioName || radioId, streamUrl };
    const schedule = { duration };
    
    const recordingId = startRecording(radio, schedule, 'manual');
    
    res.json({
      success: true,
      message: 'Grabación iniciada',
      recordingId: recordingId
    });
    
  } catch (error) {
    console.error('❌ Error iniciando grabación:', error);
    res.status(500).json({
      error: 'Error iniciando grabación',
      details: error.message
    });
  }
});

// Endpoint para ver grabaciones activas
app.get('/api/recordings/active', (req, res) => {
  const active = Array.from(activeRecordings.entries()).map(([id, recording]) => ({
    id,
    radio: recording.radio.name,
    startTime: recording.startTime,
    userId: recording.userId
  }));
  
  res.json({
    activeRecordings: active,
    count: active.length
  });
});

// Endpoint para ver programaciones guardadas
app.get('/api/schedules', (req, res) => {
  try {
    const scheduleFiles = fs.readdirSync(CONFIG_DIR)
      .filter(file => file.startsWith('schedule_') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(CONFIG_DIR, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          file: file,
          ...content,
          createdAt: fs.statSync(filePath).mtime
        };
      });
    
    res.json({
      schedules: scheduleFiles,
      count: scheduleFiles.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo programaciones:', error);
    res.status(500).json({
      error: 'Error obteniendo programaciones',
      details: error.message
    });
  }
});

// Endpoint de estado
app.get('/', (req, res) => {
  res.json({
    message: 'VPS Radio Recording API',
    status: 'active',
    timestamp: new Date().toISOString(),
    activeRecordings: activeRecordings.size,
    endpoints: [
      'POST /api/schedule - Programar grabaciones',
      'POST /api/record/start - Iniciar grabación manual',
      'GET /api/recordings/active - Ver grabaciones activas',
      'GET /api/schedules - Ver programaciones'
    ]
  });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 VPS Radio Recording API iniciado`);
  console.log(`📡 Escuchando en: http://0.0.0.0:${port}`);
  console.log(`📁 Configuraciones: ${CONFIG_DIR}`);
  console.log(`🎵 Grabaciones: ${RECORDINGS_DIR}`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  
  // Detener grabaciones activas
  activeRecordings.forEach((recording, id) => {
    console.log(`⏹️ Deteniendo grabación: ${recording.radio.name}`);
    recording.process.kill('SIGTERM');
  });
  
  process.exit(0);
});
