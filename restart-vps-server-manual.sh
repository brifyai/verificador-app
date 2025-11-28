#!/bin/bash

# Script para reiniciar el servidor Flask manualmente cuando systemctl no funciona

echo "🔄 REINICIANDO SERVIDOR FLASK MANUALMENTE"
echo "========================================="

# 1. Matar procesos existentes
echo "🔍 Buscando procesos Python/api_server.py..."
PIDS=$(pgrep -f "api_server.py")

if [ ! -z "$PIDS" ]; then
    echo "⚠️  Matando procesos existentes: $PIDS"
    pkill -f "api_server.py"
    sleep 2
else
    echo "✅ No hay procesos api_server.py en ejecución"
fi

# 2. Verificar si el puerto 5000 está libre
echo "🔍 Verificando puerto 5000..."
if ss -tuln | grep -q ":5000"; then
    echo "⚠️  Puerto 5000 está ocupado. Liberando..."
    fuser -k 5000/tcp 2>/dev/null || echo "No se pudo liberar con fuser"
    sleep 2
else
    echo "✅ Puerto 5000 está libre"
fi

# 3. Ir al directorio del proyecto
PROJECT_DIR="/home/radioapp/radio-recorder"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Directorio no encontrado: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
echo "📁 Directorio: $(pwd)"

# 4. Activar entorno virtual si existe
if [ -d "venv" ]; then
    echo "🐍 Activando entorno virtual..."
    source venv/bin/activate
    echo "✅ Entorno activado: $(which python3)"
fi

# 5. Iniciar el servidor en segundo plano
echo "🚀 Iniciando servidor Flask..."
nohup python3 scripts/api_server.py > server.log 2>&1 &
SERVER_PID=$!

echo "⏳ Esperando 3 segundos..."
sleep 3

# 6. Verificar si el proceso está corriendo
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Servidor iniciado con PID: $SERVER_PID"
    echo "📄 Log: tail -f $PROJECT_DIR/server.log"
    
    # Verificar puerto
    if ss -tuln | grep -q ":5000"; then
        echo "✅ Puerto 5000 está escuchando"
    else
        echo "⚠️  Puerto 5000 no está escuchando"
    fi
    
    # Mostrar últimas líneas del log
    echo ""
    echo "📋 Últimas líneas del log:"
    tail -n 10 server.log
    
else
    echo "❌ Servidor falló al iniciar"
    echo "📋 Log completo:"
    cat server.log
    exit 1
fi

echo ""
echo "========================================="
echo "✅ SERVIDOR REINICIADO CORRECTAMENTE"
echo ""
echo "Para detener el servidor: pkill -f api_server.py"
echo "Para ver logs: tail -f $PROJECT_DIR/server.log"
echo "Para reiniciar de nuevo: bash $0"