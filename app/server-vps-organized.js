const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const fetch = require('node-fetch');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de directorios
const BASE_RECORDINGS_DIR = path.join(__dirname, 'recordings');
const LOGS_DIR = path.join(__dirname, 'logs');

// Crear directorios base si no existen
fs.ensureDirSync(BASE_RECORDINGS_DIR);
fs.ensureDirSync(LOGS_DIR);

// Variables globales
let activeRecordings = new Map();
let recordingProcesses = new Map();

// Configuración de Supabase (debe configurarse en el VPS)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Logger
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Escribir a archivo de log
    fs.appendFileSync(path.join(LOGS_DIR, 'radio-recording.log'), logMessage + '\n');
}

// Función para extraer fecha del filename
function extractDateFromFilename(filename) {
    const match = filename.match(/_(\\d{8})_/);
    if (match && match[1]) {
        const dateStr = match[1]; // 20251202
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${year}-${month}-${day}`; // 2025-12-02
    }
    return new Date().toISOString().split('T')[0]; // Fecha actual como fallback
}

// Función para extraer radio_id del filename
function extractRadioIdFromFilename(filename) {
    const match = filename.match(/^radio_([^_]+)_/);
    return match ? match[1] : null;
}

// Función para crear estructura de carpetas
async function createRecordingPath(date, radioId) {
    const dateFolder = path.join(BASE_RECORDINGS_DIR, date);
    const radioFolder = path.join(dateFolder, radioId);
    
    await fs.ensureDir(radioFolder);
    return radioFolder;
}

// Función para obtener información de la radio desde Supabase
async function getRadioInfo(radioId) {
    try {
        log(`📡 Buscando información de radio ${radioId} en Supabase...`);
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/radios?select=id,name,region,description,platform,status&vps_id=eq.${encodeURIComponent(radioId)}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error en Supabase: ${response.status}`);
        }
        
        const radios = await response.json();
        
        if (radios && radios.length > 0) {
            const radio = radios[0];
            log(`✅ Radio encontrada: ${radio.name} (ID: ${radio.id})`);
            return radio;
        } else {
            log(`⚠️ Radio con vps_id ${radioId} no encontrada en Supabase`);
            return null;
        }
        
    } catch (error) {
        log(`❌ Error obteniendo info de radio: ${error.message}`);
        return null;
    }
}

// Función para guardar grabación en Supabase
async function saveRecordingToSupabase(recordingData) {
    try {
        log(`💾 Guardando grabación en Supabase: ${recordingData.filename}`);
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/recordings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                radio_id: recordingData.radio_id,
                filename: recordingData.filename,
                file_path: recordingData.file_path,
                file_size: recordingData.file_size,
                duration_seconds: recordingData.duration_seconds || 0,
                recorded_at: recordingData.recorded_at,
                metadata: {
                    source: 'vps_organized',
                    radio_name: recordingData.radio_name,
                    radio_region: recordingData.radio_region,
                    radio_city: recordingData.radio_city,
                    radio_programadora: recordingData.radio_programadora,
                    vps_id: recordingData.vps_id,
                    organization_date: new Date().toISOString()
                }
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error guardando en Supabase: ${error}`);
        }
        
        const result = await response.json();
        log(`✅ Grabación guardada en Supabase (ID: ${result[0].id})`);
        return result[0];
        
    } catch (error) {
        log(`❌ Error guardando en Supabase: ${error.message}`);
        return null;
    }
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

// Obtener lista de grabaciones (con estructura organizada)
app.get('/api/recordings', async (req, res) => {
    try {
        log('📡 Obteniendo lista de grabaciones organizadas...');
        
        const recordings = [];
        
        // Leer todas las carpetas de fecha
        const dateFolders = await fs.readdir(BASE_RECORDINGS_DIR);
        
        for (const dateFolder of dateFolders) {
            const datePath = path.join(BASE_RECORDINGS_DIR, dateFolder);
            const dateStats = await fs.stat(datePath);
            
            if (dateStats.isDirectory()) {
                // Leer carpetas de radio
                const radioFolders = await fs.readdir(datePath);
                
                for (const radioFolder of radioFolders) {
                    const radioPath = path.join(datePath, radioFolder);
                    const radioStats = await fs.stat(radioPath);
                    
                    if (radioStats.isDirectory()) {
                        // Leer archivos de grabación
                        const files = await fs.readdir(radioPath);
                        
                        for (const file of files) {
                            if (file.endsWith('.mp3') || file.endsWith('.wav')) {
                                const filePath = path.join(radioPath, file);
                                const fileStats = await fs.stat(filePath);
                                
                                recordings.push({
                                    filename: file,
                                    file_path: filePath,
                                    file_size: fileStats.size,
                                    date: dateFolder,
                                    radio_id: radioFolder,
                                    created: fileStats.birthtime.toISOString(),
                                    modified: fileStats.mtime.toISOString()
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // Ordenar por fecha de creación (más recientes primero)
        recordings.sort((a, b) => new Date(b.created) - new Date(a.created));
        
        log(`✅ Encontradas ${recordings.length} grabaciones organizadas`);
        
        res.json({
            status: 'success',
            recordings: recordings,
            count: recordings.length
        });
        
    } catch (error) {
        log(`❌ Error obteniendo grabaciones: ${error.message}`);
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
            status: 'recording',
            filename: recording.filename,
            file_path: recording.outputPath
        };
        count++;
    }
    
    res.json({
        status: 'success',
        active_recordings: active,
        count: count
    });
});

// Iniciar grabación (con organización automática)
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
        
        // Obtener fecha actual para la organización
        const date = new Date().toISOString().split('T')[0];
        
        // Crear estructura de carpetas
        const radioFolder = await createRecordingPath(date, radio_id);
        
        // Generar nombre de archivo único
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `radio_${radio_id}_${timestamp}_${Date.now()}.mp3`;
        const outputPath = path.join(radioFolder, filename);
        
        log(`🎙️ Iniciando grabación para radio ${radio_id}: ${filename}`);
        log(`📁 Guardando en: ${outputPath}`);
        
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
        
        ffmpegProcess.on('close', async (code) => {
            if (code === 0) {
                log(`✅ Grabación completada: ${filename}`);
                
                // Obtener información del archivo grabado
                try {
                    const stats = await fs.stat(outputPath);
                    
                    // Obtener información de la radio
                    const radioInfo = await getRadioInfo(radio_id);
                    
                    if (radioInfo) {
                        // Guardar en Supabase
                        const recordingData = {
                            radio_id: radioInfo.id,
                            vps_id: radio_id,
                            filename: filename,
                            file_path: outputPath,
                            file_size: stats.size,
                            duration_seconds: 0, // Podrías calcular esto con ffmpeg
                            recorded_at: stats.birthtime.toISOString(),
                            radio_name: radioInfo.name,
                            radio_region: radioInfo.region || 'Región no especificada',
                            radio_city: radioInfo.description || 'Ciudad no especificada',
                            radio_programadora: radioInfo.platform || 'Plataforma no especificada'
                        };
                        
                        await saveRecordingToSupabase(recordingData);
                        log(`💾 Información guardada en Supabase`);
                    } else {
                        log(`⚠️ No se pudo obtener info de la radio, grabación guardada localmente`);
                    }
                } catch (error) {
                    log(`❌ Error procesando grabación completada: ${error.message}`);
                }
                
            } else {
                log(`❌ Error en grabación ${filename}: código ${code}`);
                log(`FFmpeg stderr: ${stderr}`);
            }
            
            // Limpiar de las listas activas
            activeRecordings.delete(radio_id);
            recordingProcesses.delete(radio_id);
        });
        
        // Guardar información de la grabación activa
        const recordingInfo = {
            radioId: radio_id,
            radioName: radio_name || 'Unknown',
            streamUrl: stream_url,
            filename: filename,
            outputPath: outputPath,
            startTime: Date.now(),
            ffmpegProcess: ffmpegProcess,
            date: date
        };
        
        activeRecordings.set(radio_id, recordingInfo);
        recordingProcesses.set(radio_id, ffmpegProcess);
        
        res.json({
            status: 'success',
            message: 'Grabación iniciada',
            data: {
                radio_id: radio_id,
                filename: filename,
                file_path: outputPath,
                start_time: new Date().toISOString()
            }
        });
        
    } catch (error) {
        log(`❌ Error iniciando grabación: ${error.message}`);
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
        
        log(`⏹️ Deteniendo grabación para radio ${radio_id}: ${recording.filename}`);
        
        // Terminar proceso FFmpeg
        if (ffmpegProcess && !ffmpegProcess.killed) {
            ffmpegProcess.kill('SIGTERM');
        }
        
        // Limpiar de las listas activas
        activeRecordings.delete(radio_id);
        recordingProcesses.delete(radio_id);
        
        res.json({
            status: 'success',
            message: 'Grabación detenida',
            data: {
                radio_id: radio_id,
                filename: recording.filename,
                file_path: recording.outputPath,
                stop_time: new Date().toISOString()
            }
        });
        
    } catch (error) {
        log(`❌ Error deteniendo grabación: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Descargar archivo
app.get('/recordings/:date/:radioId/:filename', async (req, res) => {
    try {
        const { date, radioId, filename } = req.params;
        const filePath = path.join(BASE_RECORDINGS_DIR, date, radioId, filename);
        
        if (!await fs.pathExists(filePath)) {
            return res.status(404).json({
                status: 'error',
                message: 'Archivo no encontrado'
            });
        }
        
        res.sendFile(filePath);
        
    } catch (error) {
        log(`❌ Error descargando archivo: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Listar grabaciones por fecha
app.get('/recordings/by-date/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const datePath = path.join(BASE_RECORDINGS_DIR, date);
        
        if (!await fs.pathExists(datePath)) {
            return res.status(404).json({
                status: 'error',
                message: 'No hay grabaciones para esta fecha'
            });
        }
        
        const recordings = [];
        const radioFolders = await fs.readdir(datePath);
        
        for (const radioFolder of radioFolders) {
            const radioPath = path.join(datePath, radioFolder);
            const radioStats = await fs.stat(radioPath);
            
            if (radioStats.isDirectory()) {
                const files = await fs.readdir(radioPath);
                
                for (const file of files) {
                    if (file.endsWith('.mp3') || file.endsWith('.wav')) {
                        const filePath = path.join(radioPath, file);
                        const fileStats = await fs.stat(filePath);
                        
                        recordings.push({
                            filename: file,
                            radio_id: radioFolder,
                            file_size: fileStats.size,
                            created: fileStats.birthtime.toISOString(),
                            download_url: `/recordings/${date}/${radioFolder}/${file}`
                        });
                    }
                }
            }
        }
        
        res.json({
            status: 'success',
            date: date,
            recordings: recordings,
            count: recordings.length
        });
        
    } catch (error) {
        log(`❌ Error obteniendo grabaciones por fecha: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    log(`🚀 Servidor de grabación organizado iniciado en puerto ${PORT}`);
    log(`📁 Directorio base: ${BASE_RECORDINGS_DIR}`);
    log(`📊 Estructura: /recordings/YYYY-MM-DD/radio_id/archivo.mp3`);
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