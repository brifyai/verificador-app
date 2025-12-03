#!/bin/bash

# Script para actualizar el archivo .env en el VPS con credenciales reales

set -e

echo "========================================"
echo "ACTUALIZANDO CREDENCIALES DE SUPABASE EN VPS"
echo "========================================"
echo ""

# Detener el servicio
echo "⏹️ Deteniendo servicio..."
systemctl stop radio-recording-organized.service
echo "✅ Servicio detenido"
echo ""

# Actualizar el archivo .env con credenciales reales
echo "📝 Actualizando archivo .env con credenciales reales..."
cat > /home/radioapp/radio-recorder/app/.env << 'EOF'
# Configuración de Supabase para VPS
SUPABASE_URL=http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw

# Configuración del servidor
PORT=5000
RECORDINGS_DIR=/home/radioapp/radio-recorder/recordings
EOF

echo "✅ Archivo .env actualizado"
echo ""

# Verificar contenido (ocultando ANON KEY)
echo "📋 Verificando contenido del archivo .env:"
grep -v "ANON_KEY" /home/radioapp/radio-recorder/app/.env
echo ""

# Actualizar también el archivo de servicio systemd con las credenciales correctas
echo "🔧 Actualizando archivo de servicio systemd..."
cat > /etc/systemd/system/radio-recording-organized.service << 'EOF'
[Unit]
Description=Radio Recording Server Organized
After=network.target

[Service]
Type=simple
User=radioapp
Group=radioapp
WorkingDirectory=/home/radioapp/radio-recorder/app
Environment=NODE_ENV=production
Environment=SUPABASE_URL=http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io
Environment=SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw
ExecStart=/usr/bin/node server-vps-organized-correct-path.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=radio-recording-organized

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "✅ Archivo de servicio actualizado"
echo ""

# Probar ejecución manual con las nuevas credenciales
echo "🧪 Probando ejecución manual con credenciales actualizadas:"
cd /home/radioapp/radio-recorder/app
echo "Ejecutando: node server-vps-organized-correct-path.js"
echo "====================================="
timeout 5s sudo -u radioapp node server-vps-organized-correct-path.js &
sleep 3

if pgrep -f "node server-vps-organized-correct-path.js" > /dev/null; then
    echo "====================================="
    echo "✅ ✅ ✅ ÉXITO: El proceso se está ejecutando correctamente"
    pkill -f "node server-vps-organized-correct-path.js"
    
    # Reiniciar el servicio
    echo ""
    echo "🔄 Reiniciando servicio..."
    systemctl restart radio-recording-organized.service
    sleep 3
    
    # Verificar estado
    echo ""
    echo "📊 Estado del servicio:"
    systemctl status radio-recording-organized.service --no-pager -l
    
    # Ver logs
    echo ""
    echo "📄 Logs recientes:"
    journalctl -u radio-recording-organized.service -n 10 --no-pager
    
    echo ""
    echo "========================================"
    echo "✅ CREDENCIALES ACTUALIZADAS Y SERVICIO REINICIADO"
    echo "========================================"
else
    echo "====================================="
    echo "❌ El proceso sigue fallando"
    echo ""
    echo "Verificando error detallado:"
    cd /home/radioapp/radio-recorder/app
    sudo -u radioapp node server-vps-organized-correct-path.js
fi

echo ""