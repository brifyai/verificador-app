# INSTRUCCIONES PARA CORREGIR EL PROBLEMA DE GRABACIONES EN EL VPS

## Problema Identificado
El método `get_recordings_list()` en `/home/radioapp/radio-recorder/scripts/radio_manager.py` usa `os.listdir()` en lugar de `os.walk()`, lo que causa que solo se detecten 22 de las 27 grabaciones existentes.

## Solución
Reemplazar `os.listdir()` con `os.walk()` para asegurar que se detecten **TODOS** los archivos MP3 en el directorio de grabaciones.

---

## PASOS A SEGUIR EN EL VPS

### Paso 1: Conectarse al VPS
```bash
ssh root@213.199.39.147
```

### Paso 2: Crear el script de fix
Copia y pega el siguiente comando completo en el terminal del VPS:

```bash
cat > /tmp/fix_recordings_method.sh << 'EOFIX'
#!/bin/bash

RADIO_MANAGER_PATH="/home/radioapp/radio-recorder/scripts/radio_manager.py"
BACKUP_PATH="${RADIO_MANAGER_PATH}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Fix para método get_recordings_list() en VPS"
echo "==============================================="

if [ ! -f "$RADIO_MANAGER_PATH" ]; then
    echo "❌ Error: No se encontró $RADIO_MANAGER_PATH"
    exit 1
fi

# Crear backup
echo "💾 Creando backup: $BACKUP_PATH"
cp "$RADIO_MANAGER_PATH" "$BACKUP_PATH"

# Encontrar líneas del método
START_LINE=$(grep -n "def get_recordings_list(self):" "$RADIO_MANAGER_PATH" | cut -d: -f1)

if [ -z "$START_LINE" ]; then
    echo "❌ Error: No se encontró el método get_recordings_list"
    exit 1
fi

echo "📍 Método encontrado en línea $START_LINE"

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

# Encontrar el final del método (próxima definición de método o clase)
END_LINE=$(tail -n +$START_LINE "$RADIO_MANAGER_PATH" | grep -n -E "^    def |^class " | head -1 | cut -d: -f1)

if [ -z "$END_LINE" ] || [ "$END_LINE" -eq 1 ]; then
    # No hay siguiente método, llegar hasta el final
    END_LINE=$(wc -l < "$RADIO_MANAGER_PATH")
else
    END_LINE=$((START_LINE + END_LINE - 2))
fi

echo "📏 Método va desde línea $START_LINE hasta $END_LINE"

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
echo ""
echo "Backup creado en: $BACKUP_PATH"
EOFIX

chmod +x /tmp/fix_recordings_method.sh
```

### Paso 3: Ejecutar el script de fix
```bash
bash /tmp/fix_recordings_method.sh
```

### Paso 4: Reiniciar el servicio
```bash
sudo systemctl restart radio-recorder
```

### Paso 5: Verificar que funciona
```bash
# Esperar 5 segundos para que el servicio reinicie
sleep 5

# Verificar el endpoint
curl http://localhost:5000/api/recordings | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Grabaciones encontradas: {data[\\\"count\\\"]}')
print(f'Status: {data[\\\"status\\\"]}')
if data['recordings']:
    print(f'Primera grabación: {data[\\\"recordings\\\"][0][\\\"filename\\\"]}')
    print(f'Última grabación: {data[\\\"recordings\\\"][-1][\\\"filename\\\"]}')
"
```

---

## Verificación Final en el Frontend

Después de completar los pasos anteriores, verifica en tu máquina local:

```bash
cd app && curl -s "http://localhost:3000/api/recordings" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Frontend API count: {data[\"count\"]}')
print(f'Expected: 27 grabaciones')
print(f'Missing: {27 - data[\"count\"]} grabaciones')
"
```

---

## Si algo sale mal

Si necesitas revertir los cambios:

```bash
# Conéctate al VPS
ssh root@213.199.39.147

# Encuentra el backup más reciente
ls -la /home/radioapp/radio-recorder/scripts/radio_manager.py.backup.*

# Restaura el backup (reemplaza XXXXX con la fecha correcta)
sudo cp /home/radioapp/radio-recorder/scripts/radio_manager.py.backup.XXXXX /home/radioapp/radio-recorder/scripts/radio_manager.py

# Reinicia el servicio
sudo systemctl restart radio-recorder
```

---

## Resultado Esperado

Después de aplicar este fix:
- El endpoint `/api/recordings` del VPS debe devolver **27 grabaciones**
- El frontend debe mostrar **27 grabaciones** en la página de grabaciones
- Todas las grabaciones deben ser reproducibles y descargables