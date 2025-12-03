#!/bin/bash

# SCRIPT PARA CONECTARSE Y REPARAR LA API DEL VPS
# Usa la contraseña proporcionada para conectarse

echo "=== CONECTANDO AL VPS Y REPARANDO API ==="
echo "IP: 213.199.39.147"
echo "Contraseña: Aintelligence2025"

# Conectar al VPS con contraseña y ejecutar comandos de reparación
sshpass -p "Aintelligence2025" ssh -o StrictHostKeyChecking=no root@213.199.39.147 << 'EOF'
echo "✅ Conectado al VPS exitosamente"

# 1. Verificar estado actual del servicio
echo "🔍 Verificando estado del servicio de grabación..."
systemctl status radio-recorder 2>/dev/null || echo "Servicio radio-recorder no encontrado"

# 2. Verificar logs recientes
echo "📋 Verificando logs recientes..."
journalctl -u radio-recorder --since "1 hour ago" --no-pager -n 10 2>/dev/null || echo "No hay logs de radio-recorder"

# 3. Verificar archivos del proyecto
echo "📁 Verificando estructura del proyecto..."
cd /home/radioapp/radio-recorder 2>/dev/null || echo "Directorio no encontrado"
ls -la 2>/dev/null || echo "No se puede listar directorio"

# 4. Verificar si hay archivos Python
echo "🐍 Verificando archivos Python..."
find /home/radioapp -name "*.py" -type f 2>/dev/null | head -10

# 5. Verificar procesos activos
echo "⚙️ Verificando procesos de grabación..."
ps aux | grep -i record | grep -v grep

# 6. Verificar puertos abiertos
echo "🔌 Verificando puertos..."
netstat -tlnp | grep :5000

# 7. Verificar si hay una aplicación Flask corriendo
echo "🌐 Verificando aplicación web..."
curl -s http://localhost:5000/api/radios | head -100 || echo "API no responde en puerto 5000"

# 8. Verificar base de datos SQLite
echo "🗄️ Verificando base de datos..."
find /home/radioapp -name "*.db" -type f 2>/dev/null
if [ -f "/home/radioapp/radio-recorder/radio_recorder.db" ]; then
    echo "Base de datos encontrada, verificando contenido..."
    python3 -c "
import sqlite3
try:
    conn = sqlite3.connect('/home/radioapp/radio-recorder/radio_recorder.db')
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM radios;')
    count = cursor.fetchone()[0]
    print(f'Radios en DB: {count}')
    cursor.execute('SELECT id, name FROM radios LIMIT 5;')
    radios = cursor.fetchall()
    print('Primeras 5 radios:')
    for radio in radios:
        print(f'  {radio[0]}: {radio[1]}')
    conn.close()
except Exception as e:
    print(f'Error accediendo a DB: {e}')
"
fi

echo "=== DIAGNÓSTICO COMPLETADO ==="
EOF