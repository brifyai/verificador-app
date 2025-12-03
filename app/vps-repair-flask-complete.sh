#!/bin/bash

# 🔧 SCRIPT DE REPARACIÓN COMPLETA DE FLASK
# Este script repara el archivo Flask corrompido en el VPS

set -e  # Detener en cualquier error

echo "====================================================="
echo "🔧 REPARACIÓN COMPLETA DE FLASK CORROMPIDO"
echo "====================================================="
echo ""

# 1. DETENER SERVICIO
echo "⏹️ 1. Deteniendo servicio radio-recorder..."
systemctl stop radio-recorder
echo "✅ Servicio detenido"
echo ""

# 2. ACTIVAR ENTORNO VIRTUAL
echo "🐍 2. Activando entorno virtual..."
source /home/radioapp/radio-recorder/venv/bin/activate
echo "✅ Entorno virtual activado"
echo ""

# 3. REINSTALAR FLASK
echo "🔄 3. Reinstalando Flask..."
pip uninstall -y flask
pip install flask==3.0.0
echo "✅ Flask reinstalado"
echo ""

# 4. VERIFICAR INSTALACIÓN
echo "✅ 4. Verificando instalación de Flask..."
python -c "import flask; print(f'Flask {flask.__version__} importado correctamente')"
echo "✅ Verificación exitosa"
echo ""

# 5. VERIFICAR API_SERVER.PY
echo "🔍 5. Verificando api_server.py..."
if [ -f "/home/radioapp/radio-recorder/scripts/api_server.py" ]; then
    echo "✅ api_server.py existe"
    # Verificar sintaxis de Python
    python -m py_compile /home/radioapp/radio-recorder/scripts/api_server.py
    echo "✅ Sintaxis de api_server.py válida"
else
    echo "❌ api_server.py NO existe - necesita ser creado"
    exit 1
fi
echo ""

# 6. DESACTIVAR ENTORNO VIRTUAL
echo "📤 6. Desactivando entorno virtual..."
deactivate
echo "✅ Entorno virtual desactivado"
echo ""

# 7. REINICIAR SERVICIO
echo "🔄 7. Reiniciando servicio..."
systemctl start radio-recorder
echo "✅ Servicio iniciado"
echo ""

# 8. ESPERAR 5 SEGUNDOS
echo "⏳ 8. Esperando 5 segundos para que el servicio inicie completamente..."
sleep 5
echo ""

# 9. VERIFICAR ESTADO DEL SERVICIO
echo "📊 9. Estado del servicio:"
systemctl status radio-recorder --no-pager
echo ""

# 10. VERIFICAR PUERTO 5000
echo "🔍 10. Verificando puerto 5000:"
if ss -tuln | grep -q :5000; then
    echo "✅ Puerto 5000 está escuchando"
    echo ""
    echo "🎉 REPARACIÓN COMPLETADA EXITOSAMENTE"
    echo ""
    echo "Verificación final:"
    curl -s http://213.199.39.147:5000/api/recordings | head -c 100
    echo ""
else
    echo "❌ Puerto 5000 NO está escuchando"
    echo ""
    echo "📋 Mostrando logs de error:"
    journalctl -u radio-recorder -n 20 --no-pager
    echo ""
    echo "🔧 Intentando reinicio manual..."
    systemctl restart radio-recorder
    sleep 3
    if ss -tuln | grep -q :5000; then
        echo "✅ Puerto 5000 ahora está escuchando"
    else
        echo "❌ Puerto 5000 sigue sin escuchar - revisar logs"
        exit 1
    fi
fi

echo ""
echo "====================================================="
echo "✅ REPARACIÓN FINALIZADA"
echo "====================================================="