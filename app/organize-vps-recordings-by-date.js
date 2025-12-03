#!/usr/bin/env node

/**
 * SCRIPT: Organizar grabaciones del VPS por fecha y radio
 * 
 * Este script:
 * 1. Lee las grabaciones existentes del VPS
 * 2. Las organiza en carpetas: /recordings/YYYY-MM-DD/radio_id/
 * 3. Sincroniza la información con Supabase
 * 4. Actualiza los paths en la base de datos
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

// Configuración
const VPS_API_URL = 'http://213.199.39.147:5000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Directorios del VPS
const VPS_RECORDINGS_DIR = '/opt/radio-recording/recordings';

// Logger
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

// Función para obtener grabaciones del VPS
async function getVPSRecordings() {
    try {
        log('📡 Obteniendo grabaciones del VPS...');
        
        const response = await fetch(`${VPS_API_URL}/api/recordings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error del VPS: ${response.status}`);
        }
        
        const data = await response.json();
        return data.recordings || [];
        
    } catch (error) {
        log(`❌ Error obteniendo grabaciones: ${error.message}`);
        return [];
    }
}

// Función para obtener información de una radio desde Supabase
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

// Función para crear estructura de carpetas en el VPS
async function createFolderStructureSSH(date, radioId) {
    return new Promise((resolve, reject) => {
        const dateFolder = path.join(VPS_RECORDINGS_DIR, date);
        const radioFolder = path.join(dateFolder, radioId);
        
        const sshCommand = `ssh root@213.199.39.147 "mkdir -p '${radioFolder}'"`;
        
        log(`📁 Creando carpeta: ${radioFolder}`);
        
        const process = spawn('ssh', ['root@213.199.39.147', 'mkdir', '-p', radioFolder]);
        
        process.on('close', (code) => {
            if (code === 0) {
                log(`✅ Carpeta creada: ${radioFolder}`);
                resolve(radioFolder);
            } else {
                reject(new Error(`Error creando carpeta (código ${code})`));
            }
        });
        
        process.on('error', (error) => {
            reject(error);
        });
    });
}

// Función para mover archivo en el VPS
async function moveFileSSH(oldPath, newPath) {
    return new Promise((resolve, reject) => {
        log(`🚚 Moviendo archivo: ${oldPath} → ${newPath}`);
        
        const process = spawn('ssh', ['root@213.199.39.147', 'mv', oldPath, newPath]);
        
        process.on('close', (code) => {
            if (code === 0) {
                log(`✅ Archivo movido correctamente`);
                resolve(true);
            } else {
                reject(new Error(`Error moviendo archivo (código ${code})`));
            }
        });
        
        process.on('error', (error) => {
            reject(error);
        });
    });
}

// Función para guardar información en Supabase
async function saveRecordingToSupabase(recordingData) {
    try {
        log(`💾 Guardando información en Supabase: ${recordingData.filename}`);
        
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

// Función para extraer fecha del filename
function extractDateFromFilename(filename) {
    // Formato: radio_mijm9xci_rj949ks_20251202_004618_b8100d7d.mp3
    const match = filename.match(/_(\d{8})_/);
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
    // Formato: radio_mijm9xci_...
    const match = filename.match(/^radio_([^_]+)_/);
    return match ? match[1] : null;
}

// Función principal de organización
async function organizeRecordings() {
    log('🚀 INICIANDO ORGANIZACIÓN DE GRABACIONES');
    log('=' .repeat(60));
    
    try {
        // 1. Obtener grabaciones del VPS
        const recordings = await getVPSRecordings();
        
        if (recordings.length === 0) {
            log('⚠️ No hay grabaciones para organizar');
            return;
        }
        
        log(`📊 Encontradas ${recordings.length} grabaciones`);
        
        // 2. Procesar cada grabación
        for (const recording of recordings) {
            try {
                const filename = recording.filename;
                const fileSize = recording.file_size || recording.size || 0;
                const createdAt = recording.created || recording.recorded_at;
                
                log(`\n📻 Procesando: ${filename}`);
                
                // Extraer información del filename
                const date = extractDateFromFilename(filename);
                const radioId = extractRadioIdFromFilename(filename);
                
                if (!radioId) {
                    log(`❌ No se pudo extraer radio_id de ${filename}`);
                    continue;
                }
                
                log(`   📅 Fecha: ${date}`);
                log(`   📻 Radio ID: ${radioId}`);
                log(`   📦 Tamaño: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
                
                // Obtener información de la radio desde Supabase
                const radioInfo = await getRadioInfo(radioId);
                
                if (!radioInfo) {
                    log(`⚠️ Saltando grabación: radio no encontrada en Supabase`);
                    continue;
                }
                
                // Crear estructura de carpetas en el VPS
                const radioFolder = await createFolderStructureSSH(date, radioId);
                const newFilePath = path.join(radioFolder, filename);
                const oldFilePath = path.join(VPS_RECORDINGS_DIR, filename);
                
                // Mover archivo a la nueva ubicación
                await moveFileSSH(oldFilePath, newFilePath);
                
                // Guardar información en Supabase
                const recordingData = {
                    radio_id: radioInfo.id,
                    filename: filename,
                    file_path: newFilePath,
                    file_size: fileSize,
                    duration_seconds: recording.duration_seconds || 0,
                    recorded_at: createdAt,
                    radio_name: radioInfo.name,
                    radio_region: radioInfo.region || 'Región no especificada',
                    radio_city: radioInfo.description || 'Ciudad no especificada',
                    radio_programadora: radioInfo.platform || 'Plataforma no especificada'
                };
                
                await saveRecordingToSupabase(recordingData);
                
                log(`✅ Grabación organizada y guardada correctamente`);
                
            } catch (error) {
                log(`❌ Error procesando grabación ${recording.filename}: ${error.message}`);
                continue;
            }
        }
        
        log('\n' + '='.repeat(60));
        log('🏁 ORGANIZACIÓN COMPLETADA');
        
    } catch (error) {
        log(`❌ Error en organización: ${error.message}`);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    organizeRecordings();
}

module.exports = { organizeRecordings };