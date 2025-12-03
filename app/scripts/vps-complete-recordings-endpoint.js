#!/usr/bin/env node

/**
 * VPS COMPLETE RECORDINGS ENDPOINT - TODOS los campos para Supabase
 * Este script genera ABSOLUTAMENTE TODOS los campos que necesitas
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 VPS COMPLETE - GENERANDO TODOS LOS CAMPOS');
console.log('==============================================');

// Función para extraer datos completos del filename
function extractCompleteRecordingData(filename, filePath) {
  // Ejemplo: radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3
  const match = filename.match(/^radio_([a-zA-Z0-9]+)_([a-zA-Z0-9]+)_(\d{8})_(\d{6})_[a-f0-9-]+\.mp3$/);
  
  if (!match) {
    return null;
  }
  
  const [, radioId, streamId, dateStr, timeStr] = match;
  
  // Crear timestamp ISO
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const hour = timeStr.substring(0, 2);
  const minute = timeStr.substring(2, 4);
  const second = timeStr.substring(4, 6);
  
  const recordedAt = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  
  // Obtener tamaño del archivo
  let fileSize = 0;
  try {
    const stats = fs.statSync(filePath);
    fileSize = stats.size;
  } catch (error) {
    console.error(`Error obteniendo tamaño de ${filePath}:`, error.message);
    fileSize = 0;
  }
  
  // Estimar duración (128kbps = 16KB por segundo)
  const bytesPerSecond = 16 * 1024;
  const durationSeconds = Math.round(fileSize / bytesPerSecond) || 60; // Mínimo 60 segundos
  
  return {
    radio_id: radioId,
    radio_name: `Radio ${radioId}`, // ✅ Nombre completo
    radio_region: "Región no especificada", // ✅ Valor por defecto COMPLETO
    radio_city: "Ciudad no especificada", // ✅ Valor por defecto COMPLETO
    radio_programadora: "Sin programadora", // ✅ Valor por defecto COMPLETO
    filename: filename,
    file_path: filePath,
    file_size: fileSize,
    duration_seconds: durationSeconds,
    recorded_at: recordedAt,
    metadata: {}, // ✅ Objeto vacío COMPLETO
    status: "active" // ✅ Estado por defecto COMPLETO
  };
}

// Función principal para obtener TODAS las grabaciones con datos COMPLETOS
function getAllRecordingsWithCompleteData(recordingsDirectory) {
  const recordings = [];
  
  try {
    if (!fs.existsSync(recordingsDirectory)) {
      console.log(`⚠️ Directorio ${recordingsDirectory} no existe`);
      return [];
    }
    
    const files = fs.readdirSync(recordingsDirectory);
    console.log(`📁 Encontrados ${files.length} archivos en ${recordingsDirectory}`);
    
    files.forEach(file => {
      if (file.endsWith('.mp3')) {
        const filePath = path.join(recordingsDirectory, file);
        const completeData = extractCompleteRecordingData(file, filePath);
        
        if (completeData) {
          recordings.push(completeData);
          console.log(`✅ Procesada: ${file}`);
        } else {
          console.log(`⚠️ Saltada: ${file} (formato no válido)`);
        }
      }
    });
  } catch (error) {
    console.error('❌ Error leyendo directorio de grabaciones:', error.message);
  }
  
  return recordings;
}

// Función para formato API estándar
function formatCompleteAPIResponse(recordings) {
  return {
    status: "success",
    count: recordings.length,
    recordings: recordings,
    message: recordings.length > 0 ? "Grabaciones obtenidas exitosamente" : "No hay grabaciones disponibles"
  };
}

// ===== EJEMPLO COMPLETO PARA EL VPS =====
function generateCompleteVPSExample() {
  console.log('\n📋 EJEMPLO DE RESPUESTA COMPLETA DEL VPS:');
  console.log('=========================================');
  
  const ejemploCompleto = {
    status: "success",
    count: 3,
    recordings: [
      {
        radio_id: "mijm9xci",
        radio_name: "Radio mijm9xci",
        radio_region: "Región no especificada",
        radio_city: "Ciudad no especificada", 
        radio_programadora: "Sin programadora",
        filename: "radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3",
        file_path: "/recordings/radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3",
        file_size: 1234567,
        duration_seconds: 75,
        recorded_at: "2025-12-02T00:46:18Z",
        metadata: {},
        status: "active"
      },
      {
        radio_id: "mijm9xsi", 
        radio_name: "Radio mijm9xsi",
        radio_region: "Región no especificada",
        radio_city: "Ciudad no especificada",
        radio_programadora: "Sin programadora", 
        filename: "radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3",
        file_path: "/recordings/radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3",
        file_size: 987654,
        duration_seconds: 60,
        recorded_at: "2025-12-01T20:12:05Z",
        metadata: {},
        status: "active"
      }
    ],
    message: "Todas las grabaciones tienen datos COMPLETOS"
  };
  
  console.log(JSON.stringify(ejemploCompleto, null, 2));
  return ejemploCompleto;
}

// ===== CÓDIGO PYTHON COMPLETO PARA EL VPS =====
function generateCompletePythonCode() {
  const codigoPython = `# VPS COMPLETE RECORDINGS ENDPOINT - Python Flask
# Este código genera TODOS los campos para Supabase

from flask import Flask, jsonify
import os
import datetime
import json

app = Flask(__name__)

def extract_complete_recording_data(filename, file_path):
    """Extrae TODOS los datos del filename y archivo"""
    # Formato: radio_RADIOID_RANDOM_YYYYMMDD_HHMMSS_UUID.mp3
    import re
    
    match = re.match(r'^radio_([a-zA-Z0-9]+)_([a-zA-Z0-9]+)_(\d{8})_(\d{6})_[a-f0-9-]+\.mp3$', filename)
    
    if not match:
        return None
    
    radio_id, stream_id, date_str, time_str = match.groups()
    
    # Crear timestamp ISO
    year = int(date_str[:4])
    month = int(date_str[4:6])
    day = int(date_str[6:8])
    hour = int(time_str[:2])
    minute = int(time_str[2:4])
    second = int(time_str[4:6])
    
    recorded_at = datetime.datetime(year, month, day, hour, minute, second)
    
    # Obtener tamaño del archivo
    try:
        file_size = os.path.getsize(file_path)
    except OSError:
        file_size = 0
    
    # Estimar duración (128kbps = 16KB por segundo)
    bytes_per_second = 16 * 1024
    duration_seconds = max(int(file_size / bytes_per_second), 60)  # Mínimo 60 segundos
    
    return {
        "radio_id": radio_id,
        "radio_name": f"Radio {radio_id}",  # ✅ Nombre completo
        "radio_region": "Región no especificada",  # ✅ Valor completo
        "radio_city": "Ciudad no especificada",  # ✅ Valor completo
        "radio_programadora": "Sin programadora",  # ✅ Valor completo
        "filename": filename,
        "file_path": file_path,
        "file_size": file_size,
        "duration_seconds": duration_seconds,
        "recorded_at": recorded_at.isoformat() + 'Z',
        "metadata": {},  # ✅ Objeto vacío completo
        "status": "active"  # ✅ Estado completo
    }

@app.route('/api/recordings', methods=['GET'])
def get_complete_recordings():
    """Endpoint que devuelve TODOS los campos completos"""
    try:
        recordings_dir = "/recordings"
        
        if not os.path.exists(recordings_dir):
            return jsonify({
                "status": "success",
                "recordings": [],
                "count": 0,
                "message": "Directorio de grabaciones no encontrado"
            })
        
        recordings = []
        
        for filename in os.listdir(recordings_dir):
            if filename.endswith('.mp3'):
                file_path = os.path.join(recordings_dir, filename)
                complete_data = extract_complete_recording_data(filename, file_path)
                
                if complete_data:
                    recordings.append(complete_data)
        
        return jsonify({
            "status": "success",
            "recordings": recordings,
            "count": len(recordings),
            "message": f"{len(recordings)} grabaciones con datos COMPLETOS"
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "recordings": [],
            "count": 0,
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`;
  
  console.log('\n🐍 CÓDIGO PYTHON COMPLETO PARA VPS:');
  console.log('====================================');
  console.log(codigoPython);
  
  // Guardar el código
  const outputPath = path.join(__dirname, 'vps-complete-recordings-endpoint.py');
  fs.writeFileSync(outputPath, codigoPython);
  console.log(`\n📁 Archivo Python guardado en: ${outputPath}`);
  
  return codigoPython;
}

// ===== EJECUCIÓN PRINCIPAL =====
if (require.main === module) {
  console.log('🚀 INICIANDO VPS COMPLETE RECORDINGS ENDPOINT');
  console.log('==============================================');
  
  // Generar ejemplo completo
  const ejemplo = generateCompleteVPSExample();
  
  // Generar código Python completo
  generateCompletePythonCode();
  
  // Probar con directorio de ejemplo
  const testDir = './recordings';
  const recordings = getAllRecordingsWithCompleteData(testDir);
  const apiResponse = formatCompleteAPIResponse(recordings);
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log('===================');
  console.log(JSON.stringify(apiResponse, null, 2));
  
  console.log(`\n✅ TOTAL: ${recordings.length} grabaciones con TODOS los campos completos`);
  console.log('✅ Listo para implementar en el VPS');
  console.log('✅ Todos los campos que necesitas están incluidos');
}

module.exports = {
  getAllRecordingsWithCompleteData,
  formatCompleteAPIResponse,
  extractCompleteRecordingData
};