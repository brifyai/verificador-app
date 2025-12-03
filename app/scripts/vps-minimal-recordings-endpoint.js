#!/usr/bin/env node

/**
 * SCRIPT VPS MINIMALISTA - Solo campos que el VPS puede generar realmente
 * Este script muestra el mínimo necesario para que funcione el sistema
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 SCRIPT VPS MINIMALISTA - CAMPOS REALMENTE GENERABLES');
console.log('========================================================');

// Ejemplo minimalista que el VPS SÍ puede generar
const ejemploRespuestaVPSMinimal = {
  "recordings": [
    {
      "filename": "radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3",
      "radio_id": "mijm9xci",
      "radio_name": "Radio mijm9xci",  // Nombre genérico si no tiene DB
      "radio_region": null,  // El VPS puede dejar null
      "radio_city": null,    // El VPS puede dejar null
      "radio_programadora": null,  // El VPS puede dejar null
      "file_size": 1234567,
      "duration_seconds": 300,
      "recorded_at": "2025-12-02T00:46:18.000Z",
      "file_path": "/recordings/radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3"
    }
  ]
};

console.log('✅ FORMATO MÍNIMO REALISTA PARA /api/recordings:');
console.log(JSON.stringify(ejemploRespuestaVPSMinimal, null, 2));

console.log('\n📋 CÓDIGO PYTHON MINIMALISTA PARA VPS:');
console.log('======================================');

const codigoPythonMinimal = `
# Archivo: app.py o routes.py en tu VPS - VERSIÓN MINIMALISTA

from flask import Flask, jsonify
import os
import datetime

app = Flask(__name__)

@app.route('/api/recordings', methods=['GET'])
def get_recordings():
    """
    Endpoint minimalista que devuelve solo datos que el VPS puede generar
    """
    try:
        # Directorio donde están las grabaciones
        recordings_dir = "/recordings"
        
        if not os.path.exists(recordings_dir):
            return jsonify({
                "recordings": [],
                "count": 0,
                "status": "success",
                "message": "No hay directorio de grabaciones"
            })
        
        recordings = []
        
        # Recorrer todos los archivos .mp3
        for filename in os.listdir(recordings_dir):
            if filename.endswith('.mp3'):
                file_path = os.path.join(recordings_dir, filename)
                
                # Obtener información del archivo
                file_stats = os.stat(file_path)
                file_size = file_stats.st_size
                
                # Extraer radio_id del filename (método confiable)
                # Formato: radio_RADIOID_RANDOM_YYYYMMDD_HHMMSS_UUID.mp3
                parts = filename.replace('.mp3', '').split('_')
                
                if len(parts) >= 2 and parts[0] == 'radio':
                    radio_id = parts[1]  # Extrae el ID de la radio
                    
                    # Extraer timestamp del filename
                    try:
                        date_part = parts[3]  # YYYYMMDD
                        time_part = parts[4]  # HHMMSS
                        
                        year = int(date_part[:4])
                        month = int(date_part[4:6])
                        day = int(date_part[6:8])
                        hour = int(time_part[:2])
                        minute = int(time_part[2:4])
                        second = int(time_part[4:6])
                        
                        recorded_at = datetime.datetime(year, month, day, hour, minute, second)
                        
                        # Calcular duración estimada (simple pero funcional)
                        # Aproximación: 1MB = ~60 segundos de audio MP3
                        duration_seconds = int(file_size / 16000)
                        
                        recordings.append({
                            "filename": filename,
                            "radio_id": radio_id,
                            "radio_name": f"Radio {radio_id}",  # Nombre genérico
                            "radio_region": None,  # El VPS no tiene esta info
                            "radio_city": None,    # El VPS no tiene esta info
                            "radio_programadora": None,  # El VPS no tiene esta info
                            "file_size": file_size,
                            "duration_seconds": max(duration_seconds, 1),  # Mínimo 1 segundo
                            "recorded_at": recorded_at.isoformat(),
                            "file_path": file_path
                        })
                    except (IndexError, ValueError) as e:
                        print(f"Error procesando filename {filename}: {e}")
                        # Si hay error, crear registro básico
                        recordings.append({
                            "filename": filename,
                            "radio_id": radio_id,
                            "radio_name": f"Radio {radio_id}",
                            "radio_region": None,
                            "radio_city": None,
                            "radio_programadora": None,
                            "file_size": file_size,
                            "duration_seconds": 60,  # Valor por defecto
                            "recorded_at": datetime.datetime.now().isoformat(),
                            "file_path": file_path
                        })
        
        return jsonify({
            "recordings": recordings,
            "count": len(recordings),
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "recordings": [],
            "count": 0,
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`;

console.log(codigoPythonMinimal);

console.log('\n📝 EXPLICACIÓN DE CAMPOS:');
console.log('========================');
console.log('✅ radio_id: SÍ puede extraer del filename');
console.log('✅ radio_name: Genera "Radio {radio_id}" (genérico pero funcional)');
console.log('✅ filename: Ya lo tiene');
console.log('✅ file_path: Ya lo tiene');
console.log('✅ file_size: Lo obtiene del sistema de archivos');
console.log('✅ duration_seconds: Lo calcula desde file_size');
console.log('✅ recorded_at: Lo extrae del filename');
console.log('⚠️  radio_region: null (no crítico)');
console.log('⚠️  radio_city: null (no crítico)');
console.log('⚠️  radio_programadora: null (no crítico)');

console.log('\n✅ RESULTADO:');
console.log('- El VPS puede generar TODOS los campos obligatorios');
console.log('- Los campos nulos son opcionales en la tabla');
console.log('- El sistema funcionará perfectamente con este formato');
console.log('- La página mostrará "Radio mijm9xci" hasta que tengas nombres reales');

// Guardar el código en un archivo
const outputPath = path.join(__dirname, 'vps-minimal-recordings-endpoint.py');
fs.writeFileSync(outputPath, codigoPythonMinimal);

console.log(`\n📁 Archivo guardado en: ${outputPath}`);
console.log('🚀 Implementa este código en tu VPS - ES FUNCIONAL Y REALISTA!');