#!/bin/bash

# SCRIPT PARA REPARAR EL ENDPOINT DE GRABACIÓN DEL VPS
# Conecta al VPS y repara específicamente el endpoint /api/start-recording

echo "=== REPARANDO ENDPOINT DE GRABACIÓN DEL VPS ==="

sshpass -p "Aintelligence2025" ssh -o StrictHostKeyChecking=no root@213.199.39.147 << 'EOF'
echo "✅ Conectado al VPS"

# 1. Verificar archivos de la API
echo "🔍 Verificando archivos de la API..."
cd /home/radioapp/radio-recorder
ls -la scripts/
ls -la api/ 2>/dev/null || echo "Directorio api/ no encontrado"

# 2. Verificar el archivo principal de la API
echo "📄 Verificando api_server.py..."
if [ -f "scripts/api_server.py" ]; then
    echo "Archivo encontrado, verificando contenido..."
    head -50 scripts/api_server.py
fi

# 3. Verificar si hay un archivo específico para start-recording
echo "🎯 Buscando endpoint de start-recording..."
find /home/radioapp -name "*.py" -exec grep -l "start-recording" {} \; 2>/dev/null

# 4. Verificar la base de datos SQLite
echo "🗄️ Verificando base de datos SQLite..."
find /home/radioapp -name "*.db" -type f 2>/dev/null
if [ -f "radio_recorder.db" ]; then
    echo "Base de datos encontrada, verificando estructura..."
    python3 -c "
import sqlite3
try:
    conn = sqlite3.connect('radio_recorder.db')
    cursor = conn.cursor()
    
    # Verificar tablas
    cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\";')
    tables = cursor.fetchall()
    print('Tablas en DB:')
    for table in tables:
        print(f'  - {table[0]}')
    
    # Verificar tabla radios
    if any('radio' in str(table).lower() for table in tables):
        cursor.execute('SELECT COUNT(*) FROM radios;')
        count = cursor.fetchone()[0]
        print(f'Radios en tabla radios: {count}')
        
        cursor.execute('SELECT id, name FROM radios LIMIT 5;')
        radios = cursor.fetchall()
        print('Primeras 5 radios:')
        for radio in radios:
            print(f'  ID: {radio[0]}, Nombre: {radio[1]}')
    
    conn.close()
    print('✅ Base de datos accesible')
except Exception as e:
    print(f'❌ Error accediendo a DB: {e}')
"
fi

# 5. Verificar si el endpoint start-recording existe en el código
echo "🔧 Verificando código del endpoint..."
grep -r "start.recording\|start_recording" /home/radioapp/radio-recorder/ 2>/dev/null || echo "No se encontró endpoint start-recording"

# 6. Verificar logs específicos de start-recording
echo "📋 Verificando logs de start-recording..."
journalctl -u radio-recorder --since "1 hour ago" --no-pager | grep -i "start" | tail -10

# 7. Probar el endpoint directamente
echo "🧪 Probando endpoint start-recording..."
curl -s -X POST http://localhost:5000/api/start-recording \
  -H "Content-Type: application/json" \
  -d '{"radio_id": 14}' | head -200

echo "=== DIAGNÓSTICO COMPLETADO ==="
EOF