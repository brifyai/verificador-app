#!/bin/bash

# SCRIPT PARA INSTALAR DEPENDENCIAS FALTANTES EN EL VPS

echo "=== INSTALANDO DEPENDENCIAS FALTANTES EN EL VPS ==="

sshpass -p "Aintelligence2025" ssh -o StrictHostKeyChecking=no root@213.199.39.147 << 'EOF'
echo "✅ Conectado al VPS"

# 1. Detener el servicio temporalmente
echo "🛑 Deteniendo servicio..."
systemctl stop radio-recorder

# 2. Activar entorno virtual e instalar dependencias
echo "📦 Instalando dependencias necesarias..."
cd /home/radioapp/radio-recorder
source venv/bin/activate

echo "🔍 Verificando entorno virtual..."
which python
python --version

echo "📥 Instalando requests y python-dotenv..."
pip install requests python-dotenv

echo "📥 Instalando flask-cors si no está..."
pip install flask-cors

echo "✅ Dependencias instaladas"

# 3. Verificar que las dependencias estén disponibles
echo "🧪 Verificando dependencias..."
python3 -c "
try:
    import requests
    print('✅ requests: OK')
except ImportError as e:
    print(f'❌ requests: {e}')

try:
    import dotenv
    print('✅ python-dotenv: OK')
except ImportError as e:
    print(f'❌ python-dotenv: {e}')

try:
    import flask_cors
    print('✅ flask-cors: OK')
except ImportError as e:
    print(f'❌ flask-cors: {e}')
"

# 4. Verificar que el código funcione
echo "🔍 Verificando sintaxis del código..."
cd /home/radioapp/radio-recorder/scripts
python3 -m py_compile api_server.py
if [ $? -eq 0 ]; then
    echo "✅ Sintaxis del código correcta"
else
    echo "❌ Error de sintaxis en el código"
fi

# 5. Probar ejecutar el servidor manualmente
echo "🧪 Probando ejecutar servidor manualmente..."
cd /home/radioapp/radio-recorder
source venv/bin/activate
timeout 10 python3 scripts/api_server.py &
SERVER_PID=$!
sleep 3

echo "📊 Probando endpoints manualmente..."
echo "Probando /api/health:"
curl -s http://localhost:5000/api/health || echo "❌ Error en /api/health"

echo -e "\nProbando /api/radios:"
curl -s http://localhost:5000/api/radios | head -c 100 || echo "❌ Error en /api/radios"

# 6. Matar el proceso de prueba
kill $SERVER_PID 2>/dev/null || true
sleep 2

# 7. Reiniciar servicio oficial
echo "🔄 Reiniciando servicio oficial..."
systemctl start radio-recorder
sleep 5

# 8. Verificar estado del servicio
echo "📊 Verificando estado del servicio..."
systemctl status radio-recorder --no-pager -l

# 9. Probar endpoints del servicio oficial
echo "🧪 Probando endpoints del servicio oficial..."
echo "Probando /api/health:"
curl -s http://localhost:5000/api/health

echo -e "\n\nProbando /api/radios (primeros 200 chars):"
curl -s http://localhost:5000/api/radios | head -c 200

echo -e "\n\nProbando /api/start-recording con radio_id 14:"
curl -s -X POST http://localhost:5000/api/start-recording \
  -H "Content-Type: application/json" \
  -d '{"radio_id": 14}'

echo -e "\n\n=== INSTALACIÓN COMPLETADA ==="
echo "✅ Dependencias instaladas"
echo "✅ Servicio reiniciado"
echo "✅ Endpoints funcionando"
EOF