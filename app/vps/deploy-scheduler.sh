#!/bin/bash

# Script de despliegue del Advanced Radio Scheduler a VPS
# Uso: ./deploy-scheduler.sh

set -e

# Configuración
VPS_HOST="173.249.26.38"
VPS_USER="root"
VPS_PATH="/root/radio-api"
LOCAL_PATH="."

echo "🚀 Desplegando Advanced Radio Scheduler a VPS..."
echo "=" $(printf '=%.0s' {1..50})

# Verificar conexión SSH
echo "🔍 Verificando conexión a VPS..."
if ! ssh -o ConnectTimeout=10 ${VPS_USER}@${VPS_HOST} "echo 'Conexión OK'" > /dev/null 2>&1; then
    echo "❌ Error: No se puede conectar a la VPS ${VPS_HOST}"
    echo "   Verifica que SSH esté configurado correctamente"
    exit 1
fi
echo "✅ Conexión SSH establecida"

# Verificar archivos locales
echo "🔍 Verificando archivos locales..."
REQUIRED_FILES=(
    "advanced-scheduler.js"
    "main-server.js" 
    "start-vps.js"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ Error: Archivo faltante: $file"
        exit 1
    fi
    echo "✅ Encontrado: $file"
done

# Crear backup en VPS
echo "💾 Creando backup en VPS..."
ssh ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH}
    if [[ -f main-server.js ]]; then
        BACKUP_DIR=\"backup-\$(date +%Y%m%d-%H%M%S)\"
        mkdir -p \$BACKUP_DIR
        cp *.js \$BACKUP_DIR/ 2>/dev/null || true
        cp package.json \$BACKUP_DIR/ 2>/dev/null || true
        echo \"📦 Backup creado: \$BACKUP_DIR\"
    fi
"

# Transferir archivos principales
echo "📤 Transfiriendo archivos principales..."
scp advanced-scheduler.js ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
scp main-server.js ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
scp start-vps.js ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
scp package.json ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

# Transferir archivos opcionales
echo "📤 Transfiriendo archivos de prueba..."
scp test-advanced-scheduler.js ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/ 2>/dev/null || echo "⚠️  test-advanced-scheduler.js no encontrado"
scp README-SCHEDULER.md ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/ 2>/dev/null || echo "⚠️  README-SCHEDULER.md no encontrado"

# Configurar en VPS
echo "⚙️  Configurando en VPS..."
ssh ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH}
    
    echo '📦 Instalando dependencias...'
    npm install
    
    echo '📁 Creando directorios...'
    mkdir -p config recordings logs
    chmod 755 config recordings logs
    
    echo '🔧 Configurando permisos...'
    chmod +x start-vps.js
    chmod +x test-advanced-scheduler.js 2>/dev/null || true
    
    echo '🧪 Verificando instalación...'
    node -e \"console.log('✅ Node.js:', process.version)\"
    
    if command -v ffmpeg >/dev/null 2>&1; then
        echo '✅ FFmpeg encontrado'
        ffmpeg -version | head -1
    else
        echo '⚠️  FFmpeg no encontrado - instalar para grabaciones'
    fi
    
    echo '📊 Estado de archivos:'
    ls -la *.js package.json 2>/dev/null || true
"

# Test de conectividad
echo "🧪 Probando conectividad..."
if curl -s --connect-timeout 10 http://${VPS_HOST}:3000/api/test > /dev/null 2>&1; then
    echo "✅ Servidor ya está corriendo en puerto 3000"
else
    echo "ℹ️  Servidor no está corriendo (normal si es primera instalación)"
fi

# Instrucciones finales
echo ""
echo "✅ Despliegue completado exitosamente!"
echo "=" $(printf '=%.0s' {1..50})
echo ""
echo "📋 Próximos pasos en la VPS:"
echo "   1. Conectar: ssh ${VPS_USER}@${VPS_HOST}"
echo "   2. Ir al directorio: cd ${VPS_PATH}"
echo "   3. Crear tests: node test-advanced-scheduler.js"
echo "   4. Iniciar servidor: npm start"
echo ""
echo "🌐 URLs de prueba:"
echo "   Health check: http://${VPS_HOST}:3000/"
echo "   Estado: http://${VPS_HOST}:3000/api/status"
echo "   Test: http://${VPS_HOST}:3000/api/test"
echo ""
echo "📝 Para ver logs en tiempo real:"
echo "   ssh ${VPS_USER}@${VPS_HOST} 'cd ${VPS_PATH} && tail -f logs/*.log'"
echo ""

# Opción para iniciar automáticamente
read -p "¿Quieres iniciar el servidor automáticamente? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Iniciando servidor en VPS..."
    ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_PATH}
        
        # Detener procesos existentes
        pkill -f 'node.*server' 2>/dev/null || true
        pkill -f 'node.*start-vps' 2>/dev/null || true
        
        # Iniciar en background
        nohup npm start > logs/startup.log 2>&1 &
        
        sleep 3
        
        # Verificar que inició
        if pgrep -f 'node.*start-vps' > /dev/null; then
            echo '✅ Servidor iniciado correctamente'
            echo '📊 Procesos activos:'
            pgrep -f 'node' -l
        else
            echo '❌ Error iniciando servidor'
            echo '📝 Revisar logs:'
            tail -10 logs/startup.log
        fi
    "
fi

echo ""
echo "🎉 ¡Despliegue completado!"
