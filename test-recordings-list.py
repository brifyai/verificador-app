#!/usr/bin/env python3

import sys
sys.path.append('/home/radioapp/radio-recorder/scripts')

from radio_manager import RadioManager
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.DEBUG)

# Crear manager
manager = RadioManager()

# Ejecutar método
print('=== INICIANDO get_recordings_list() ===')
recordings = manager.get_recordings_list()
print(f'=== RESULTADO: {len(recordings)} grabaciones encontradas ===')

# Mostrar detalles de cada grabación
for i, rec in enumerate(recordings, 1):
    print(f'{i}. {rec["filename"]} - {rec.get("size", 0)} bytes - {rec.get("created", "N/A")}')

# Verificar directorio manualmente
print('\n=== VERIFICACIÓN MANUAL DE DIRECTORIO ===')
recordings_dir = os.getenv('RECORDINGS_DIR', '/home/radioapp/radio-recorder/recordings')
print(f'Directorio: {recordings_dir}')
print(f'Existe: {os.path.exists(recordings_dir)}')

# Listar todos los archivos MP3 manualmente
print('\n=== LISTADO MANUAL DE ARCHIVOS MP3 ===')
all_files = []
for root, dirs, files in os.walk(recordings_dir):
    for file in files:
        if file.endswith('.mp3'):
            file_path = os.path.join(root, file)
            try:
                stat = os.stat(file_path)
                all_files.append({
                    'filename': file,
                    'path': file_path,
                    'size': stat.st_size,
                    'created': stat.st_mtime
                })
                print(f'✓ {file} - {stat.st_size} bytes - {os.path.getmtime(file_path)}')
            except Exception as e:
                print(f'✗ Error con {file_path}: {e}')

print(f'\n=== TOTAL MANUAL: {len(all_files)} archivos MP3 ===')