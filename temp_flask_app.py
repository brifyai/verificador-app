#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from radio_manager import RadioManager
import os
import logging
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('/home/radioapp/radio-recorder/.env')

app = Flask(__name__)
CORS(app)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Inicializar manager
manager = RadioManager()

# Configuración
RECORDINGS_DIR = os.getenv('RECORDINGS_DIR')
API_HOST = os.getenv('API_HOST', '0.0.0.0')
API_PORT = int(os.getenv('API_PORT', 5000))

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "radio-recorder"})

@app.route('/api/radios', methods=['GET'])
def get_radios():
    """Obtener lista de radios disponibles"""
    try:
        radios = manager.get_available_radios()
        return jsonify({
            "status": "success",
            "radios": radios,
            "count": len(radios)
        })
    except Exception as e:
        logging.error(f"Error obteniendo radios: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/start-recording', methods=['POST'])
def start_recording():
    """Iniciar grabación de una radio"""
    try:
        data = request.json
        radio_id = data.get('radio_id')
        
        if not radio_id:
            return jsonify({"status": "error", "message": "radio_id es requerido"}), 400
        
        result = manager.start_recording(radio_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error iniciando grabación: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/pause-recording', methods=['POST'])
def pause_recording():
    """Pausar grabación de una radio"""
    try:
        data = request.json
        radio_id = data.get('radio_id')
        
        if not radio_id:
            return jsonify({"status": "error", "message": "radio_id es requerido"}), 400
        
        result = manager.pause_recording(radio_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error pausando grabación: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/resume-recording', methods=['POST'])
def resume_recording():
    """Reanudar grabación de una radio"""
    try:
        data = request.json
        radio_id = data.get('radio_id')
        
        if not radio_id:
            return jsonify({"status": "error", "message": "radio_id es requerido"}), 400
        
        result = manager.resume_recording(radio_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error reanudando grabación: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/stop-recording', methods=['POST'])
def stop_recording():
    """Detener grabación de una radio"""
    try:
        data = request.json
        radio_id = data.get('radio_id')
        
        if not radio_id:
            return jsonify({"status": "error", "message": "radio_id es requerido"}), 400
        
        result = manager.stop_recording(radio_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error deteniendo grabación: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/active-recordings', methods=['GET'])
def get_active_recordings():
    """Obtener grabaciones activas"""
    try:
        recordings = manager.get_active_recordings()
        return jsonify({
            "status": "success",
            "active_recordings": recordings,
            "count": len(recordings)
        })
    except Exception as e:
        logging.error(f"Error obteniendo grabaciones activas: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/recordings', methods=['GET'])
def get_recordings():
    """Obtener lista de grabaciones disponibles"""
    try:
        recordings = manager.get_recordings_list()
        return jsonify({
            "status": "success",
            "recordings": recordings,
            "count": len(recordings)
        })
    except Exception as e:
        logging.error(f"Error obteniendo grabaciones: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_recording(filename):
    """Descargar archivo de grabación"""
    try:
        # Validar nombre de archivo
        if '..' in filename or '/' in filename:
            return jsonify({"status": "error", "message": "Nombre de archivo inválido"}), 400
        
        filepath = os.path.join(RECORDINGS_DIR, filename)
        
        if not os.path.exists(filepath):
            return jsonify({"status": "error", "message": "Archivo no encontrado"}), 404
        
        return send_file(filepath, as_attachment=True)
        
    except Exception as e:
        logging.error(f"Error descargando archivo: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Obtener estado del servidor"""
    try:
        active_recordings = manager.get_active_recordings()
        return jsonify({
            "status": "success",
            "server": "running",
            "active_recordings_count": len(active_recordings),
            "active_recordings": active_recordings
        })
    except Exception as e:
        logging.error(f"Error obteniendo estado: {e}")
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

if __name__ == '__main__':
    logging.info(f"🚀 Iniciando servidor Radio Recorder en {API_HOST}:{API_PORT}")
    app.run(host=API_HOST, port=API_PORT, debug=False)

# ==============================================================================
# ADAPTACIÓN: Funciones para extraer radio_id del formato existente
# ==============================================================================

def extract_radio_id_from_filename(filename):
    """
    Extrae radio_id del formato: radio-{id}_{uuid}_block{N}_{timestamp}.mp3
    Ejemplo: radio-1_05c3585e-..._block21_20251127_204008.mp3 → 1
    """
    try:
        if filename.startswith('radio-') and '_block' in filename:
            # Formato: radio-{id}_{uuid}_block{N}_{timestamp}.mp3
            parts = filename.split('_')
            if len(parts) >= 4:
                radio_part = parts[0]  # "radio-1"
                if radio_part.startswith('radio-'):
                    return radio_part.replace('radio-', '')  # Extraer solo el ID
    except:
        pass
    return None

def extract_block_number_from_filename(filename):
    """
    Extrae el número de bloque del formato existente
    """
    try:
        if '_block' in filename:
            parts = filename.split('_block')
            if len(parts) > 1:
                block_part = parts[1].split('_')[0]
                return int(block_part)
    except:
        pass
    return None

# MODIFICACIÓN DEL ENDPOINT /api/recordings
@app.route('/api/recordings', methods=['GET'])
def get_recordings():
    """
    Obtiene lista de grabaciones con metadata de radio
    Adaptado para formato: radio-{id}_{uuid}_block{N}_{timestamp}.mp3
    """
    try:
        recordings = []
        for filename in os.listdir(RECORDINGS_DIR):
            if filename.endswith('.mp3'):
                # Extraer radio_id del formato existente
                radio_id = extract_radio_id_from_filename(filename)
                block_number = extract_block_number_from_filename(filename)
                
                file_path = os.path.join(RECORDINGS_DIR, filename)
                try:
                    stat = os.stat(file_path)
                    
                    recordings.append({
                        'filename': filename,
                        'radio_id': radio_id,
                        'block_number': block_number,
                        'size': stat.st_size,
                        'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        'download_url': f'/api/download/{filename}'
                    })
                except Exception as e:
                    print(f"Error leyendo archivo {filename}: {e}")
        
        # Ordenar por fecha de creación (más recientes primero)
        recordings_sorted = sorted(recordings, key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'count': len(recordings_sorted),
            'recordings': recordings_sorted
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error al obtener grabaciones: {str(e)}'
        }), 500

# NUEVO ENDPOINT: Grabaciones por radio
@app.route('/api/recordings/by-radio/<radio_id>', methods=['GET'])
def get_recordings_by_radio(radio_id):
    """
    Obtiene todas las grabaciones para una radio específica
    """
    try:
        recordings = []
        prefix = f'radio-{radio_id}_'
        
        for filename in os.listdir(RECORDINGS_DIR):
            if filename.endswith('.mp3') and filename.startswith(prefix):
                file_path = os.path.join(RECORDINGS_DIR, filename)
                try:
                    stat = os.stat(file_path)
                    
                    recordings.append({
                        'filename': filename,
                        'radio_id': radio_id,
                        'block_number': extract_block_number_from_filename(filename),
                        'size': stat.st_size,
                        'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        'download_url': f'/api/download/{filename}'
                    })
                except Exception as e:
                    print(f"Error leyendo archivo {filename}: {e}")
        
        # Ordenar por fecha de creación
        recordings_sorted = sorted(recordings, key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'radio_id': radio_id,
            'count': len(recordings_sorted),
            'recordings': recordings_sorted
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error al obtener grabaciones: {str(e)}'
        }), 500



# NUEVO ENDPOINT: Verificar streaming antes de grabar
@app.route('/api/verify-stream', methods=['POST'])
def verify_stream():
    """
    Verifica si el streaming de una radio está funcionando correctamente
    antes de iniciar la grabación
    """
    try:
        data = request.json
        radio_id = data.get('radio_id')
        stream_url = data.get('stream_url')
        radio_name = data.get('radio_name')
        
        if not radio_id or not stream_url:
            return jsonify({
                "status": "error", 
                "message": "radio_id y stream_url son requeridos"
            }), 400
        
        logging.info(f"Verificando streaming para {radio_name} ({radio_id}): {stream_url}")
        
        # Importar requests para hacer la verificación
        import requests
        
        try:
            # Hacer una petición HEAD para verificar el stream
            response = requests.head(stream_url, timeout=10, allow_redirects=True)
            
            # Verificar si la respuesta indica que el stream está activo
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                content_length = response.headers.get('Content-Length')
                
                # Verificar si es un tipo de contenido de audio válido
                is_audio = any(audio_type in content_type.lower() for audio_type in [
                    'audio', 'mpeg', 'mp3', 'aac', 'ogg', 'wav'
                ])
                
                if is_audio or not content_type:  # Si no hay content-type, asumimos que es válido
                    return jsonify({
                        "status": "success",
                        "message": "Streaming funcionando correctamente",
                        "content_type": content_type,
                        "content_length": content_length,
                        "response_code": response.status_code
                    })
                else:
                    return jsonify({
                        "status": "error",
                        "message": f"El contenido no parece ser audio (Content-Type: {content_type})",
                        "content_type": content_type,
                        "response_code": response.status_code
                    })
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Stream respondió con código {response.status_code}",
                    "response_code": response.status_code
                })
                
        except requests.exceptions.Timeout:
            return jsonify({
                "status": "error",
                "message": "Tiempo de espera agotado al verificar el streaming"
            }), 408
            
        except requests.exceptions.ConnectionError:
            return jsonify({
                "status": "error", 
                "message": "No se pudo conectar al stream de la radio"
            }), 503
            
        except requests.exceptions.RequestException as e:
            return jsonify({
                "status": "error",
                "message": f"Error al verificar el streaming: {str(e)}"
            }), 500
            
    except Exception as e:
        logging.error(f"Error verificando streaming: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error interno del servidor: {str(e)}"
        }), 500
