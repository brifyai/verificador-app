#!/bin/bash

# Script de despliegue automático para VPS Radio Recording System
echo "🚀 Desplegando VPS Radio Recording System..."

# Detener proceso existente si está corriendo
echo "🛑 Deteniendo procesos existentes..."
pkill -f "node.*server.js" || true
sleep 2

# Ir al directorio del proyecto
cd /root/radio-api

# Crear backup de configuraciones existentes
if [ -d "config" ]; then
    echo "💾 Creando backup de configuraciones..."
    cp -r config config_backup_$(date +%Y%m%d_%H%M%S)
fi

# Actualizar dependencias
echo "📦 Instalando dependencias..."
npm install node-cron

# Verificar que ffmpeg esté instalado
if ! command -v ffmpeg &> /dev/null; then
    echo "📹 Instalando ffmpeg..."
    apt update && apt install -y ffmpeg
fi

# Crear directorios necesarios
mkdir -p config recordings logs

# Configurar permisos
chmod +x server.js
chmod +x scheduler.js

# Crear servicio systemd para auto-inicio
echo "⚙️ Configurando servicio systemd..."
cat > /etc/systemd/system/radio-recording.service << 'EOF'
[Unit]
Description=VPS Radio Recording API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/radio-api
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=append:/root/radio-api/logs/output.log
StandardError=append:/root/radio-api/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y habilitar servicio
systemctl daemon-reload
systemctl enable radio-recording

# Configurar logrotate para logs
cat > /etc/logrotate.d/radio-recording << 'EOF'
/root/radio-api/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload radio-recording
    endscript
}
EOF

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw allow 3000/tcp

# Iniciar servicio
echo "🚀 Iniciando servicio..."
systemctl start radio-recording

# Verificar estado
sleep 3
if systemctl is-active --quiet radio-recording; then
    echo "✅ Servicio iniciado correctamente"
    echo "📡 API disponible en: http://$(curl -s ifconfig.me):3000"
else
    echo "❌ Error iniciando servicio"
    echo "📋 Logs:"
    journalctl -u radio-recording --no-pager -n 20
fi

# Mostrar estado final
echo ""
echo "📊 ESTADO DEL SISTEMA:"
echo "====================="
systemctl status radio-recording --no-pager -l
echo ""
echo "📁 Archivos del proyecto:"
ls -la /root/radio-api/
echo ""
echo "🔍 Procesos activos:"
ps aux | grep -E "(node|ffmpeg)" | grep -v grep
echo ""
echo "🌐 Puertos abiertos:"
netstat -tlnp | grep :3000
echo ""
echo "✅ Despliegue completado!"
echo "💡 Para ver logs en tiempo real: journalctl -u radio-recording -f"
echo "💡 Para reiniciar: systemctl restart radio-recording"
echo "💡 Para detener: systemctl stop radio-recording"
