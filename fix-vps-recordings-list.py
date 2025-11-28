#!/usr/bin/env python3
"""
Script para corregir el método get_recordings_list() en radio_manager.py
Cambia de os.listdir() a os.walk() para asegurar que se detecten TODOS los archivos MP3
"""

import os
import sys

def fix_recordings_list_method():
    """Corrige el método get_recordings_list para usar os.walk()"""
    
    # Path al archivo radio_manager.py en el VPS
    radio_manager_path = "/home/radioapp/radio-recorder/scripts/radio_manager.py"
    
    if not os.path.exists(radio_manager_path):
        print(f"❌ Error: No se encontró {radio_manager_path}")
        return False
    
    print(f"📄 Leyendo {radio_manager_path}...")
    
    with open(radio_manager_path, 'r') as f:
        content = f.read()
    
    # Buscar el método get_recordings_list
    if "def get_recordings_list(self):" not in content:
        print("❌ Error: No se encontró el método get_recordings_list")
        return False
    
    print("🔍 Método get_recordings_list encontrado")
    
    # Reemplazar el método completo
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
        """Obtener lista de archivos grabados - FIXED VERSION"""
        recordings = []
        try:
            # Usar os.walk() para encontrar TODOS los archivos MP3 recursivamente
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
                            print(f"Error procesando {filepath}: {e}")
        except Exception as e:
            print(f"Error listando grabaciones: {e}")
        
        return sorted(recordings, key=lambda x: x["created"], reverse=True)'''
    
    if old_method in content:
        content = content.replace(old_method, new_method)
        print("✅ Método reemplazado con versión corregida")
    else:
        # Intentar encontrar una versión ligeramente diferente
        print("⚠️ Buscando método con formato alternativo...")
        
        # Buscar inicio y fin del método
        lines = content.split('\n')
        in_method = False
        method_start = -1
        indent_level = 0
        
        for i, line in enumerate(lines):
            if "def get_recordings_list(self):" in line:
                method_start = i
                indent_level = len(line) - len(line.lstrip())
                in_method = True
                print(f"📍 Método encontrado en línea {i+1}")
                break
        
        if method_start == -1:
            print("❌ No se pudo encontrar el método")
            return False
        
        # Encontrar el final del método (próxima def o final de clase)
        method_end = len(lines)
        for i in range(method_start + 1, len(lines)):
            line = lines[i]
            stripped = line.lstrip()
            if stripped and not line.startswith(' ' * (indent_level + 4)):
                # Siguiente método o clase
                if stripped.startswith('def ') or stripped.startswith('class '):
                    method_end = i
                    break
        
        print(f"📏 Método va desde línea {method_start+1} hasta {method_end}")
        
        # Reemplazar el método
        new_lines = lines[:method_start] + new_method.split('\n') + lines[method_end:]
        content = '\n'.join(new_lines)
        print("✅ Método reemplazado con versión corregida (formato alternativo)")
    
    # Guardar backup
    backup_path = radio_manager_path + ".backup"
    with open(backup_path, 'w') as f:
        f.write(content)
    print(f"💾 Backup creado: {backup_path}")
    
    # Guardar archivo corregido
    with open(radio_manager_path, 'w') as f:
        f.write(content)
    
    print(f"✅ Archivo corregido guardado: {radio_manager_path}")
    return True

if __name__ == "__main__":
    print("🔧 Fix para método get_recordings_list()")
    print("=" * 50)
    
    success = fix_recordings_list_method()
    
    if success:
        print("\n✅ FIX COMPLETADO CON ÉXITO")
        print("\nPróximos pasos:")
        print("1. Reiniciar el servicio: sudo systemctl restart radio-recorder")
        print("2. Verificar endpoint: curl http://213.199.39.147:5000/api/recordings")
        print("3. Verificar frontend: curl http://localhost:3000/api/recordings")
    else:
        print("\n❌ FIX FALLIDO")
        sys.exit(1)