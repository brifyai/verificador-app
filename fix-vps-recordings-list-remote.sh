#!/bin/bash

# Script para corregir el método get_recordings_list() en radio_manager.py
# Este script debe ejecutarse DIRECTAMENTE en el VPS

RADIO_MANAGER_PATH="/home/radioapp/radio-recorder/scripts/radio_manager.py"
BACKUP_PATH="${RADIO_MANAGER_PATH}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Fix para método get_recordings_list() en VPS"
echo "==============================================="
echo "📄 Archivo objetivo: $RADIO_MANAGER_PATH"

if [ ! -f "$RADIO_MANAGER_PATH" ]; then
    echo "❌ Error: No se encontró $RADIO_MANAGER_PATH"
    exit 1
fi

# Crear backup
echo "💾 Creando backup: $BACKUP_PATH"
cp "$RADIO_MANAGER_PATH" "$BACKUP_PATH"

# Leer el archivo
echo "📖 Leyendo archivo..."
CONTENT=$(cat "$RADIO_MANAGER_PATH")

# Verificar si el método existe
if ! grep -q "def get_recordings_list(self):" "$RADIO_MANAGER_PATH"; then
    echo "❌ Error: No se encontró el método get_recordings_list"
    exit 1
fi

echo "✅ Método get_recordings_list encontrado"

# Crear archivo temporal con el nuevo método
cat > /tmp/new_method.py << 'EOF'
    def get_recordings_list(self):
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
        
        return sorted(recordings, key=lambda x: x["created"], reverse=True)
EOF

# Encontrar líneas del método
START_LINE=$(grep -n "def get_recordings_list(self):" "$RADIO_MANAGER_PATH" | cut -d: -f1)
END_LINE=$(tail -n +$START_LINE "$RADIO_MANAGER_PATH" | grep -n -E "^    def |^class " | head -1 | cut -d: -f1)

if [ -z "$END_LINE" ] || [ "$END_LINE" -eq 1 ]; then
    # No hay siguiente método, llegar hasta el final
    END_LINE=$(wc -l < "$RADIO_MANAGER_PATH")
else
    END_LINE=$((START_LINE + END_LINE - 2))
fi

echo "📍 Método encontrado en líneas $START_LINE a $END_LINE"

# Reconstruir archivo
head -n $((START_LINE - 1)) "$RADIO_MANAGER_PATH" > /tmp/radio_manager_fixed.py
cat /tmp/new_method.py >> /tmp/radio_manager_fixed.py
tail -n +$((END_LINE + 1)) "$RADIO_MANAGER_PATH" >> /tmp/radio_manager_fixed.py

# Verificar que el archivo temporal tiene contenido
if [ ! -s /tmp/radio_manager_fixed.py ]; then
    echo "❌ Error: El archivo temporal está vacío"
    exit 1
fi

# Reemplazar archivo original
mv /tmp/radio_manager_fixed.py "$RADIO_MANAGER_PATH"

echo "✅ Archivo corregido guardado: $RADIO_MANAGER_PATH"

# Limpiar archivos temporales
rm -f /tmp/new_method.py

echo ""
echo "✅ FIX COMPLETADO CON ÉXITO"
echo ""
echo "Próximos pasos:"
echo "1. Reiniciar el servicio: sudo systemctl restart radio-recorder"
echo "2. Verificar endpoint: curl http://213.199.39.147:5000/api/recordings"
echo "3. Verificar frontend: curl http://localhost:3000/api/recordings (desde el frontend)"
echo ""
echo "Backup creado en: $BACKUP_PATH"