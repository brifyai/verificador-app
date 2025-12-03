#!/usr/bin/env node

/**
 * SCRIPT PARA ACTUALIZAR EL ENDPOINT DEL VPS
 * Este script muestra cómo debe modificar el VPS su endpoint /api/recordings
 * para enviar todos los datos completos requeridos por Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 SCRIPT DE ACTUALIZACIÓN PARA VPS');
console.log('=====================================');

// Ejemplo de cómo debe ser la respuesta del VPS
const ejemploRespuestaVPS = {
  "recordings": [
    {
      "filename": "radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3",
      "radio_id": "mijm9xci",
      "radio_name": "Radio Agricultura",
      "radio_region": "Metropolitana",
      "radio_city": "Santiago",
      "radio_programadora": "Grupo Agricultura",
      "file_size": 1234567,
      "duration_seconds": 300,
      "recorded_at": "2025-12-02T00:46:18.000Z",
      "file_path": "/recordings/radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3"
    },
    {
      "filename": "radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3",
      "radio_id": "mijm9xsi",
      "radio_name": "Radio Somos",
      "radio_region": "Valparaíso",
      "radio_city": "Viña del Mar",
      "radio_programadora": "Somos Radio",
      "file_size": 987654,
      "duration_seconds": 240,
      "recorded_at": "2025-12-01T20:12:05.000Z",
      "file_path": "/recordings/radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3"
    }
  ]
};

console.log('✅ FORMATO REQUERIDO PARA /api/recordings:');
console.log(JSON.stringify(ejemploRespuestaVPS, null, 2));

console.log('\n📋 CÓDIGO PYTHON PARA VPS (Flask):');
console.log('=====================================');

const codigoPython = `
# Archivo: app.py o routes.py en tu VPS

from flask import Flask, jsonify
import os
import datetime

app = Flask(__name__)

@app.route('/api/recordings', methods=['GET'])
def get_recordings():
    """
    Endpoint que devuelve grabaciones con datos completos
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
                
                # Extraer datos del filename
                # Formato esperado: radio_RADIOID_RANDOM_YYYYMMDD_HHMMSS_UUID.mp3
                parts = filename.replace('.mp3', '').split('_')
                
                if len(parts) >= 5:
                    radio_id = parts[1] if parts[0] == 'radio' else 'unknown'
                    
                    # Obtener datos de la radio desde tu base de datos o configuración
                    radio_data = get_radio_data(radio_id)  # Función que debes implementar
                    
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
                        
                        # Calcular duración (estimada, puedes mejorar esto)
                        duration_seconds = int(file_size / 16000)  # Aproximación para MP3
                        
                        recordings.append({
                            "filename": filename,
                            "radio_id": radio_id,
                            "radio_name": radio_data.get('name', f'Radio {radio_id}'),
                            "radio_region": radio_data.get('region', 'Región no especificada'),
                            "radio_city": radio_data.get('city', 'Ciudad no especificada'),
                            "radio_programadora": radio_data.get('programadora', 'Programadora no especificada'),
                            "file_size": file_size,
                            "duration_seconds": duration_seconds,
                            "recorded_at": recorded_at.isoformat(),
                            "file_path": file_path
                        })
                    except (IndexError, ValueError) as e:
                        print(f"Error procesando filename {filename}: {e}")
                        continue
        
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

def get_radio_data(radio_id):
    """
    Función para obtener datos completos de la radio
    DEBES IMPLEMENTAR ESTA FUNCIÓN SEGÚN TU BASE DE DATOS
    """
    # Ejemplo con datos quemados (debes reemplazar con tu base de datos)
    radios_db = {
        "mijm9xci": {
            "name": "Radio Agricultura",
            "region": "Metropolitana",
            "city": "Santiago",
            "programadora": "Grupo Agricultura"
        },
        "mijm9xsi": {
            "name": "Radio Somos",
            "region": "Valparaíso",
            "city": "Viña del Mar",
            "programadora": "Somos Radio"
        }
        # Agrega más radios según tu base de datos
    }
    
    return radios_db.get(radio_id, {
        "name": f"Radio {radio_id}",
        "region": "Región no especificada",
        "city": "Ciudad no especificada",
        "programadora": "Programadora no especificada"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`;

console.log(codigoPython);

console.log('\n📝 PASOS PARA IMPLEMENTAR:');
console.log('1. Copia este código a tu archivo de rutas en el VPS');
console.log('2. Implementa la función get_radio_data() con tus datos reales');
console.log('3. Reinicia el servidor VPS');
console.log('4. Verifica que el endpoint responda correctamente');
console.log('5. Las grabaciones aparecerán automáticamente en http://localhost:3000/grabaciones');

console.log('\n✅ RESULTADO ESPERADO:');
console.log('- Las grabaciones mostrarán nombres reales de radios');
console.log('- No más "Radio mijm9xci" sino "Radio Agricultura"');
console.log('- Región y ciudad correctas');
console.log('- Datos completos desde el VPS');

// Guardar el código en un archivo
const outputPath = path.join(__dirname, 'vps-recordings-update.py');
fs.writeFileSync(outputPath, codigoPython);

console.log(`\n📁 Archivo guardado en: ${outputPath}`);
console.log('🚀 Implementa este código en tu VPS para ver los nombres reales de las radios!');