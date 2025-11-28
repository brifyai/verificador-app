#!/usr/bin/env python3

import sys
import os
from datetime import datetime

def fix_get_recordings_list():
    """Corregir el método get_recordings_list para usar os.walk() en lugar de os.listdir()"""
    
    # Ruta del archivo
    file_path = '/home/radioapp/radio-recorder/scripts/radio_manager.py'
    
    # Leer el contenido actual
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Encontrar y reemplazar el método get_recordings_list
    old_method = '''    def get_recordings_list(self):
        """Obtener lista de archivos grabados"""
        recordings = []
        try:
            for filename in os.listdir(RECORDINGS_DIR):
                if filename.endswith('.mp3'):
                    filepath = os.path.join(RECORDINGS_DIR, filename)
                    file_info = {
                        "filename": filename,
                        "size": os.path.getsize(filepath),
                        "created": datetime.fromtimestamp(os.path.getctime(filepath)).isoformat(),
                        "path": filepath
                    }
                    recordings.append(file_info)
        except Exception as e:
            print(f"Error listando grabaciones: {e}")
        
        return sorted(recordings, key=lambda x: x["created"], reverse=True)'''
    
    new_method = '''    def get_recordings_list(self):
        """Obtener lista de archivos grabados"""
        recordings = []
        try:
            # Usar os.walk() para asegurar búsqueda completa de todos los archivos MP3
            for root, dirs, files in os.walk(RECORDINGS_DIR):
                for filename in files:
                    if filename.endswith('.mp3'):
                        filepath = os.path.join(root, filename)
                        try:
                            file_info = {
                                "filename": filename,
                                "size": os.path.getsize(filepath),
                                "created": datetime.fromtimestamp(os.path.getctime(filepath)).isoformat(),
                                "path": filepath
                            }
                            recordings.append(file_info)
                        except Exception as e:
                            print(f"Error accediendo a {filepath}: {e}")
        except Exception as e:
            print(f"Error listando grabaciones: {e}")
        
        return sorted(recordings, key=lambda x: x["created"], reverse=True)'''
    
    if old_method in content:
        content = content.replace(old_method, new_method)
        
        # Guardar el archivo modificado
        with open(file_path, 'w') as f:
            f.write(content)
        
        print("✅ Método get_recordings_list() actualizado correctamente")
        print("   - Ahora usa os.walk() para búsqueda recursiva completa")
        print("   - Captura errores individuales por archivo")
        print("   - Incluye TODOS los archivos .mp3 sin filtros adicionales")
        return True
    else:
        print("❌ No se encontró el método exacto para reemplazar")
        return False

if __name__ == "__main__":
    success = fix_get_recordings_list()
    sys.exit(0 if success else 1)