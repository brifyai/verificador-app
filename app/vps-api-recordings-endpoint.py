#!/usr/bin/env python3
"""
Endpoint VPS para /api/recordings - Escaneo recursivo
=====================================================
Este endpoint reemplaza el endpoint actual del VPS para soportar
la nueva estructura de carpetas: /recordings/{DATE}/{RADIO_ID}/archivos.mp3
"""

import os
import re
from datetime import datetime
from flask import jsonify, request, send_file
import logging

# Configuración
RECORDINGS_DIR = "/home/radioapp/radio-recorder/recordings"

# Logger
logger = logging.getLogger(__name__)

def extract_radio_id(filename):
    """Extraer radio ID del nombre del archivo"""
    # Patrón: radio_{radio_id}_{timestamp}_{uuid}.mp3
    match = re.match(r'^radio_([^_]+_[^_]+)_', filename)
    if match:
        return match.group(1)
    
    # Patrón alternativo: radio-{id}_{timestamp}_{uuid}.mp3
    match = re.match(r'^radio-(\d+)_', filename)
    if match:
        return f"radio_{match.group(1)}"
    
    return "unknown_radio"

def extract_date(filename):
    """Extraer fecha del nombre del archivo"""
    # Buscar formato YYYYMMDD
    match = re.search(r'_(\d{4})(\d{2})(\d{2})_\d{6}_', filename)
    if match:
        year, month, day = match.groups()
        return f"{year}-{month}-{day}"
    
    # Buscar formato en el timestamp del archivo
    try:
        file_path = os.path.join(RECORDINGS_DIR, filename)
        if os.path.exists(file_path):
            stat = os.stat(file_path)
            modified_time = datetime.fromtimestamp(stat.st_mtime)
            return modified_time.strftime("%Y-%m-%d")
    except:
        pass
    
    return "unknown_date"

def get_radio_metadata(radio_id):
    """Obtener metadata de radio desde Supabase o base de datos local"""
    # TODO: Implementar conexión real a Supabase
    # Por ahora, retornar valores por defecto
    return {
        "radio_name": radio_id,
        "radio_region": "Unknown",
        "radio_city": "Unknown",
        "radio_programadora": "Unknown"
    }

@app.route('/api/recordings', methods=['GET'])
def get_recordings():
    """
    Endpoint para listar grabaciones con escaneo recursivo
    Soporta la nueva estructura: /recordings/{DATE}/{RADIO_ID}/archivos.mp3
    """
    try:
        recordings = []
        
        # Verificar si el directorio existe
        if not os.path.exists(RECORDINGS_DIR):
            logger.error(f"Directorio no encontrado: {RECORDINGS_DIR}")
            return jsonify({
                "status": "error",
                "message": "Directorio de grabaciones no encontrado",
                "recordings": []
            }), 404
        
        # Escaneo recursivo
        for root, dirs, files in os.walk(RECORDINGS_DIR):
            for filename in files:
                if filename.endswith('.mp3'):
                    try:
                        file_path = os.path.join(root, filename)
                        stat = os.stat(file_path)
                        
                        # Calcular path relativo
                        rel_path = os.path.relpath(file_path, RECORDINGS_DIR)
                        
                        # Extraer información del archivo
                        radio_id = extract_radio_id(filename)
                        date_str = extract_date(filename)
                        
                        # Obtener metadata de la radio
                        metadata = get_radio_metadata(radio_id)
                        
                        # Crear objeto de grabación
                        recording = {
                            "filename": filename,
                            "path": rel_path,  # Path relativo para descarga
                            "size": stat.st_size,
                            "created": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                            "radio_id": radio_id,
                            "radio_name": metadata["radio_name"],
                            "radio_region": metadata["radio_region"],
                            "radio_city": metadata["radio_city"],
                            "radio_programadora": metadata["radio_programadora"],
                            "display_name": f"{metadata['radio_name']} - {date_str}"
                        }
                        
                        recordings.append(recording)
                        
                    except Exception as e:
                        logger.error(f"Error procesando {filename}: {str(e)}")
                        continue
        
        # Ordenar por fecha de creación (más recientes primero)
        recordings.sort(key=lambda x: x["created"], reverse=True)
        
        logger.info(f"Encontradas {len(recordings)} grabaciones")
        
        return jsonify({
            "status": "success",
            "count": len(recordings),
            "recordings": recordings
        })
        
    except Exception as e:
        logger.error(f"Error en /api/recordings: {e}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "recordings": []
        }), 500

@app.route('/api/download/<path:file_path>')
def download_recording(file_path):
    """
    Endpoint para descargar archivos con path completo
    Ejemplo: /api/download/2025-12-01/radio_mijm9xsi_6nx1sqf/archivo.mp3
    """
    try:
        recordings_dir = "/home/radioapp/radio-recorder/recordings"
        full_path = os.path.join(recordings_dir, file_path)
        
        # Validar que el archivo existe
        if not os.path.exists(full_path):
            logger.warning(f"Archivo no encontrado: {full_path}")
            return jsonify({
                "status": "error",
                "message": "Archivo no encontrado"
            }), 404
        
        # Verificar que el archivo está dentro del directorio de grabaciones
        real_path = os.path.realpath(full_path)
        recordings_real_path = os.path.realpath(recordings_dir)
        
        if not real_path.startswith(recordings_real_path):
            logger.warning(f"Intento de acceso no autorizado: {real_path}")
            return jsonify({
                "status": "error",
                "message": "Acceso no autorizado"
            }), 403
        
        logger.info(f"Descargando archivo: {file_path}")
        
        # Enviar archivo
        return send_file(
            real_path,
            as_attachment=True,
            download_name=os.path.basename(full_path)
        )
        
    except Exception as e:
        logger.error(f"Error en descarga: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/recordings/stats', methods=['GET'])
def get_recordings_stats():
    """
    Endpoint para obtener estadísticas de grabaciones
    """
    try:
        recordings_dir = "/home/radioapp/radio-recorder/recordings"
        
        if not os.path.exists(recordings_dir):
            return jsonify({
                "status": "error",
                "message": "Directorio no encontrado"
            }), 404
        
        total_files = 0
        total_size = 0
        dates = set()
        radios = set()
        
        for root, dirs, files in os.walk(recordings_dir):
            for filename in files:
                if filename.endswith('.mp3'):
                    try:
                        file_path = os.path.join(root, filename)
                        stat = os.stat(file_path)
                        
                        total_files += 1
                        total_size += stat.st_size
                        
                        # Extraer fecha y radio
                        date_str = extract_date(filename)
                        radio_id = extract_radio_id(filename)
                        
                        dates.add(date_str)
                        radios.add(radio_id)
                        
                    except:
                        continue
        
        return jsonify({
            "status": "success",
            "stats": {
                "total_files": total_files,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "unique_dates": len(dates),
                "unique_radios": len(radios)
            }
        })
        
    except Exception as e:
        logger.error(f"Error en stats: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500