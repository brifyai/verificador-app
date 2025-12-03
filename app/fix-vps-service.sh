#!/bin/bash

# Script para solucionar el problema del servicio que se detiene inmediatamente
# Este script identifica y corrige el error

set -e

echo "========================================"
echo "SOLUCIÓN DE PROBLEMA: SERVICIO SE DETIENE"
echo "========================================"
echo ""

# Paso 1: Detener el servicio
echo "⏹️ Deteniendo servicio..."
systemctl stop radio-recording-organized.service
sleep 2
echo "✅ Servicio detenido"
echo ""

# Paso 2: Verificar el error ejecutando manualmente
echo "🔍 Ejecutando manualmente para ver el error exacto:"
echo "====================================="
cd /home/radioapp/radio-recorder/app
sudo -u radioapp node server-vps-organized-correct-path.js
echo "====================================="
echo ""

# Si llegamos aquí, el proceso no terminó con error
echo "⚠️ El proceso se ejecutó sin errores aparentes"
echo ""

# Paso 3: Verificar si falta dotenv
echo "📦 Verificando si falta dotenv..."
cd /home/radioapp/radio-recorder/app
if ! npm list dotenv &> /dev/null; then
    echo "⚠️  Paquete dotenv no instalado, instalando..."
    npm install dotenv
    echo "✅ dotenv instalado"
else
    echo "✅ dotenv está instalado"
fi
echo ""

# Paso 4: Modificar el archivo del servidor para usar dotenv
echo "🔧 Verificando si el servidor carga dotenv..."
if ! grep -q "require('dotenv')" /home/radioapp/radio-recorder/app/server-vps-organized-correct-path.js; then
    echo "⚠️  El servidor no carga dotenv, modificando..."
    
    # Hacer backup
    cp /home/radioapp/radio-recorder/app/server-vps-organized-correct-path.js /home/radioapp/radio-recorder/app/server-vps-organized-correct-path.js.backup
    
    # Añadir dotenv al inicio del archivo
    sed -i "1i require('dotenv').config();" /home/radioapp/radio-recorder/app/server-vps-organized-correct-path.js
    
    echo "✅ dotenv añadido al servidor"
else
    echo "✅ El servidor ya carga dotenv"
fi
echo ""

# Paso 5: Verificar variables de entorno
echo "🔍 Verificando variables de entorno:"
echo "SUPABASE_URL=$(grep SUPABASE_URL /home/radioapp/radio-recorder/app/.env | cut -d'=' -f2)"
echo "PORT=$(grep PORT /home/radioapp/radio-recorder/app/.env | cut -d'=' -f2)"
echo ""

# Paso 6: Probar ejecución manual de nuevo
echo "🧪 Probando ejecución manual después de correcciones:"
cd /home/radioapp/radio-recorder/app
timeout 5s sudo -u radioapp node server-vps-organized-correct-path.js &
sleep 2
if pgrep -f "node server-vps-organized-correct-path.js" > /dev/null; then
    echo "✅ El proceso se está ejecutando correctamente"
    pkill -f "node server-vps-organized-correct-path.js"
else
    echo "❌ El proceso sigue fallando"
fi
echo ""

# Paso 7: Modificar el archivo de servicio para mejor logging
echo "🔧 Modificando archivo de servicio para mejor logging..."
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

# Paso 8: Reiniciar servicio
echo "🔄 Reiniciando servicio..."
systemctl restart radio-recording-organized.service
sleep 3

# Paso 9: Verificar estado
echo "📊 Estado del servicio después del reinicio:"
systemctl status radio-recording-organized.service --no-pager -l
echo ""

# Paso 10: Ver logs
echo "📄 Logs después del reinicio:"
journalctl -u radio-recording-organized.service -n 20 --no-pager
echo ""

echo "========================================"
echo "PROCESO DE SOLUCIÓN COMPLETADO"
echo "========================================"
echo ""

if systemctl is-active --quiet radio-recording-organized; then
    echo "✅ ✅ ✅ ÉXITO: El servicio está corriendo correctamente"
    echo ""
    echo "Comandos útiles:"
    echo "  • Ver estado: systemctl status radio-recording-organized"
    echo "  • Ver logs: journalctl -u radio-recording-organized -f"
    echo "  • Probar endpoint: curl http://localhost:5000/health"
else
    echo "❌ El servicio sigue sin funcionar"
    echo ""
    echo "Prueba estos comandos manualmente:"
    echo "  • cd /home/radioapp/radio-recorder/app"
    echo "  • sudo -u radioapp node server-vps-organized-correct-path.js"
    echo ""
    echo "Y revisa los logs completos:"
    echo "  • journalctl -u radio-recording-organized -n 50"
fi
echo ""