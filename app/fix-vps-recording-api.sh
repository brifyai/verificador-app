#!/bin/bash

# SCRIPT PARA REPARAR LA API DEL VPS
# Conecta al VPS y repara el endpoint de grabación

echo "=== REPARANDO API DEL VPS ==="
echo "Conectando al VPS: 213.199.39.147"

# Conectar al VPS y ejecutar comandos de reparación
ssh -o StrictHostKeyChecking=no root@213.199.39.147 << 'EOF'
echo "✅ Conectado al VPS"

# 1. Verificar estado actual del servicio
echo "🔍 Verificando estado del servicio de grabación..."
systemctl status radio-recorder || echo "Servicio no encontrado"

# 2. Verificar logs recientes
echo "📋 Verificando logs recientes..."
journalctl -u radio-recorder --since "1 hour ago" --no-pager | tail -20

# 3. Verificar archivos de configuración
echo "📁 Verificando archivos de configuración..."
ls -la /home/radioapp/radio-recorder/
ls -la /home/radioapp/radio-recorder/api/

# 4. Verificar base de datos
echo "🗄️ Verificando base de datos..."
cd /home/radioapp/radio-recorder
python3 -c "
import sqlite3
conn = sqlite3.connect('radio_recorder.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\";')
tables = cursor.fetchall()
print('Tablas:', tables)
cursor.execute('SELECT COUNT(*) FROM radios;')
count = cursor.fetchone()
print('Radios en DB:', count[0])
conn.close()
"

# 5. Verificar si el endpoint existe
echo "🌐 Verificando endpoint de grabación..."
curl -s http://localhost:5000/api/start-recording -X POST -H "Content-Type: application/json" -d '{"radio_id": 14}' || echo "Endpoint no responde"

# 6. Verificar proceso de grabación
echo "⚙️ Verificando procesos..."
ps aux | grep -i record | grep -v grep

echo "=== DIAGNÓSTICO COMPLETADO ==="
EOF