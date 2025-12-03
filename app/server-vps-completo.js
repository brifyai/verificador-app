const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/recordings', express.static(path.join(__dirname, 'recordings')));

// Configuración de directorios
const RECORDINGS_DIR = path.join(__dirname, 'recordings');
const TEMP_DIR = path.join(__dirname, 'temp');
const LOGS_DIR = path.join(__dirname, 'logs');

// Crear directorios si no existen
fs.ensureDirSync(RECORDINGS_DIR);
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(LOGS_DIR);

// Variables globales
let activeRecordings = new Map();
let recordingProcesses = new Map();

// Logger simple
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Escribir a archivo de log
    fs.appendFileSync(path.join(LOGS_DIR, 'radio-recording.log'), logMessage + '\n');
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        active_recordings: activeRecordings.size,
        uptime: process.uptime()
    });
});

// Obtener lista de grabaciones
app.get('/api/recordings', async (req, res) => {
    try {
        const files = await fs.readdir(RECORDINGS_DIR);
        const recordings = [];
        
        for (const file of files) {
            if (file.endsWith('.mp3') || file.endsWith('.wav')) {
                const filePath = path.join(RECORDINGS_DIR, file);
                const stats = await fs.stat(filePath);
                
                recordings.push({
                    filename: file,
                    file_size: stats.size,
                    created: stats.birthtime.toISOString(),
                    modified: stats.mtime.toISOString,
                    file_path: filePath
                });
            }
        }
        
        // Ordenar por fecha de creación (más recientes primero)
        recordings.sort((a, b) => new Date(b.created) - new Date(a.created));
        
        res.json({
            status: 'success',
            recordings: recordings,
            count: recordings.length
        });
        
    } catch (error) {
        log(`Error obteniendo grabaciones: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Obtener grabaciones activas
app.get('/api/active-recordings', (req, res) => {
    const active = {};
    let count = 0;
    
    for (const [radioId, recording] of activeRecordings) {
        active[radioId] = {
            radio_id: radioId,
            start_time: recording.startTime,
            duration: Math.floor((Date.now() - recording.startTime) / 1000),
            stream_url: recording.streamUrl,
            status: 'recording'
        };
        count++;
    }
    
    res.json({
        status: 'success',
        active_recordings: active,
        count: count
    });
});

// Iniciar grabación
app.post('/api/start-recording', async (req, res) => {
    try {
        const { radio_id, stream_url, radio_name } = req.body;
        
        if (!radio_id || !stream_url) {
            return res.status(400).json({
                status: 'error',
                message: 'radio_id y stream_url son requeridos'
            });
        }
        
        // Verificar si ya hay una grabación activa para este radio
        if (activeRecordings.has(radio_id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Ya hay una grabación activa para este radio'
            });
        }
        
        // Generar nombre de archivo único
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `radio_${radio_id}_${timestamp}_${Date.now()}.mp3`;
        const outputPath = path.join(RECORDINGS_DIR, filename);
        
        log(`Iniciando grabación para radio ${radio_id}: ${filename}`);
        
        // Comando FFmpeg para grabar
        const ffmpegArgs = [
            '-i', stream_url,
            '-acodec', 'libmp3lame',
            '-ab', '128k',
            '-ar', '44100',
            '-t', '3600', // Máximo 1 hora
            '-y', // Sobrescribir archivo si existe
            outputPath
        ];
        
        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
        
        let stderr = '';
        ffmpegProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                log(`Grabación completada: ${filename}`);
                activeRecordings.delete(radio_id);
                recordingProcesses.delete(radio_id);
            } else {
                log(`Error en grabación ${filename}: código ${code}`);
                log(`FFmpeg stderr: ${stderr}`);
                activeRecordings.delete(radio_id);
                recordingProcesses.delete(radio_id);
            }
        });
        
        // Guardar información de la grabación activa
        const recordingInfo = {
            radioId: radio_id,
            radioName: radio_name || 'Unknown',
            streamUrl: stream_url,
            filename: filename,
            outputPath: outputPath,
            startTime: Date.now(),
            ffmpegProcess: ffmpegProcess
        };
        
        activeRecordings.set(radio_id, recordingInfo);
        recordingProcesses.set(radio_id, ffmpegProcess);
        
        res.json({
            status: 'success',
            message: 'Grabación iniciada',
            data: {
                radio_id: radio_id,
                filename: filename,
                start_time: new Date().toISOString()
            }
        });
        
    } catch (error) {
        log(`Error iniciando grabación: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Detener grabación
app.post('/api/stop-recording', async (req, res) => {
    try {
        const { radio_id } = req.body;
        
        if (!radio_id) {
            return res.status(400).json({
                status: 'error',
                message: 'radio_id es requerido'
            });
        }
        
        if (!activeRecordings.has(radio_id)) {
            return res.status(404).json({
                status: 'error',
                message: 'No hay grabación activa para este radio'
            });
        }
        
        const recording = activeRecordings.get(radio_id);
        const ffmpegProcess = recording.ffmpegProcess;
        
        log(`Deteniendo grabación para radio ${radio_id}: ${recording.filename}`);
        
        // Terminar proceso FFmpeg
        if (ffmpegProcess && !ffmpegProcess.killed) {
            ffmpegProcess.kill('SIGTERM');
        }
        
        // Esperar un poco y verificar si el archivo se creó
        setTimeout(async () => {
            try {
                if (await fs.pathExists(recording.outputPath)) {
                    const stats = await fs.stat(recording.outputPath);
                    log(`Archivo creado exitosamente: ${recording.filename} (${stats.size} bytes)`);
                } else {
                    log(`ADVERTENCIA: Archivo no encontrado después de detener: ${recording.filename}`);
                }
            } catch (error) {
                log(`Error verificando archivo: ${error.message}`);
            }
        }, 2000);
        
        // Limpiar de las listas activas
        activeRecordings.delete(radio_id);
        recordingProcesses.delete(radio_id);
        
        res.json({
            status: 'success',
            message: 'Grabación detenida',
            data: {
                radio_id: radio_id,
                filename: recording.filename,
                stop_time: new Date().toISOString()
            }
        });
        
    } catch (error) {
        log(`Error deteniendo grabación: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Limpiar archivos fantasma
app.post('/api/cleanup-ghost', async (req, res) => {
    try {
        const files = await fs.readdir(RECORDINGS_DIR);
        let cleaned = 0;
        let ghosts = 0;
        
        for (const file of files) {
            if (file.endsWith('.mp3') || file.endsWith('.wav')) {
                const filePath = path.join(RECORDINGS_DIR, file);
                try {
                    await fs.access(filePath);
                    cleaned++;
                } catch (error) {
                    // Archivo no accesible, eliminar
                    await fs.remove(filePath);
                    ghosts++;
                    log(`Archivo fantasma eliminado: ${file}`);
                }
            }
        }
        
        res.json({
            status: 'success',
            message: 'Limpieza completada',
            data: {
                files_checked: cleaned + ghosts,
                files_valid: cleaned,
                ghosts_removed: ghosts
            }
        });
        
    } catch (error) {
        log(`Error en limpieza: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Descargar archivo
app.get('/recordings/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(RECORDINGS_DIR, filename);
        
        if (!await fs.pathExists(filePath)) {
            return res.status(404).json({
                status: 'error',
                message: 'Archivo no encontrado'
            });
        }
        
        res.sendFile(filePath);
        
    } catch (error) {
        log(`Error descargando archivo: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Verificar espacio en disco
app.get('/api/disk-space', (req, res) => {
    try {
        const stats = fs.statSync(RECORDINGS_DIR);
        // Esta es una implementación simplificada
        // En un entorno real usarías el módulo 'check-disk-space'
        res.json({
            status: 'success',
            free_gb: 'N/A',
            total_gb: 'N/A',
            used_percent: 'N/A'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Manejo de errores global
app.use((error, req, res, next) => {
    log(`Error no manejado: ${error.message}`);
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    log(`Servidor de grabación iniciado en puerto ${PORT}`);
    log(`Directorio de grabaciones: ${RECORDINGS_DIR}`);
    log(`Directorio temporal: ${TEMP_DIR}`);
});

// Manejo graceful de cierre
process.on('SIGTERM', () => {
    log('Recibida señal SIGTERM, cerrando servidor...');
    
    // Detener todas las grabaciones activas
    for (const [radioId, recording] of activeRecordings) {
        if (recording.ffmpegProcess && !recording.ffmpegProcess.killed) {
            recording.ffmpegProcess.kill('SIGTERM');
        }
    }
    
    process.exit(0);
});

process.on('SIGINT', () => {
    log('Recibida señal SIGINT, cerrando servidor...');
    
    // Detener todas las grabaciones activas
    for (const [radioId, recording] of activeRecordings) {
        if (recording.ffmpegProcess && !recording.ffmpegProcess.killed) {
            recording.ffmpegProcess.kill('SIGTERM');
        }
    }
    
    process.exit(0);
});

module.exports = app;