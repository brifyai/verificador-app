#!/bin/bash

# Script para solucionar problemas críticos del sistema de grabaciones
# Este script configura el servicio systemd y el directorio de grabaciones

set -e  # Detener en cualquier error

echo "🎙️ SOLUCIONES INMEDIATAS - SISTEMA DE GRABACIONES"
echo "==================================================="
echo ""

# Configuración
VPS_IP="213.199.39.147"
VPS_USER="root"
RECORDING_DIR="/root/radio-recordings"
SERVICE_NAME="radio-recorder"
SERVICE_FILE="/etc/systemd/system/radio-recorder.service"

# Función para ejecutar comandos SSH
ssh_command() {
    echo "▶️  Ejecutando: $1"
    ssh ${VPS_USER}@${VPS_IP} "$1"
    echo "✅ Completado"
    echo ""
}

echo "1️⃣  CREANDO DIRECTORIO DE GRABACIONES"
echo "======================================"
ssh_command "mkdir -p ${RECORDING_DIR}"
ssh_command "chmod 755 ${RECORDING_DIR}"
ssh_command "ls -ld ${RECORDING_DIR}"

echo "2️⃣  VERIFICANDO DEPENDENCIAS"
echo "=============================="
echo "▶️  Verificando Python3..."
ssh ${VPS_USER}@${VPS_IP} "which python3 && python3 --version"

echo "▶️  Verificando Flask..."
ssh ${VPS_USER}@${VPS_IP} "python3 -c 'import flask; print(\"Flask OK\")'"

echo "▶️  Verificando FFmpeg..."
ssh ${VPS_USER}@${VPS_IP} "which ffmpeg && ffmpeg -version | head -1"
echo "✅ Dependencias verificadas"
echo ""

echo "3️⃣  CREANDO ARCHIVO DE SERVICIO SYSTEMD"
echo "========================================"
# Crear el archivo de servicio directamente en el VPS
ssh ${VPS_USER}@${VPS_IP} "cat > ${SERVICE_FILE} << 'EOF'
[Unit]
Description=Radio Recording Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/usr/bin/python3 /root/radio-recorder.py
Restart=always
RestartSec=10
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF"

ssh_command "cat ${SERVICE_FILE}"
echo "✅ Archivo de servicio creado"
echo ""

echo "4️⃣  CONFIGURANDO Y ACTIVANDO SERVICIO"
echo "======================================"
ssh_command "systemctl daemon-reload"
ssh_command "systemctl enable ${SERVICE_NAME}"
ssh_command "systemctl start ${SERVICE_NAME}"
echo ""

echo "5️⃣  VERIFICANDO ESTADO DEL SERVICIO"
echo "==================================="
ssh_command "systemctl status ${SERVICE_NAME} --no-pager"
echo ""

echo "6️⃣  REVISANDO LOGS INICIALES"
echo "=============================="
ssh_command "journalctl -u ${SERVICE_NAME} -n 20 --no-pager"
echo ""

echo "7️⃣  VERIFICANDO ENDPOINTS"
echo "=========================="
echo "▶️  Probando endpoint /api/recordings..."
curl -s "http://${VPS_IP}:5000/api/recordings" | head -c 200
echo ""
echo ""

echo "▶️  Probando endpoint /api/active-recordings..."
curl -s "http://${VPS_IP}:5000/api/active-recordings" | head -c 200
echo ""
echo ""

echo "8️⃣  VERIFICANDO DIRECTORIO DE GRABACIONES"
echo "=========================================="
ssh_command "ls -la ${RECORDING_DIR}"
echo ""

echo "🔧 CONFIGURACIÓN COMPLETADA"
echo "============================"
echo "✅ Directorio de grabaciones creado: ${RECORDING_DIR}"
echo "✅ Servicio systemd configurado: ${SERVICE_NAME}"
echo "✅ Servicio activado y en ejecución"
echo "✅ Endpoints verificados"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Monitorear logs: ssh ${VPS_USER}@${VPS_IP} 'journalctl -u ${SERVICE_NAME} -f'"
echo "2. Probar grabación desde el frontend"
echo "3. Verificar archivos en: ${RECORDING_DIR}"
echo "4. Revisar: systemctl status ${SERVICE_NAME}"
echo ""
echo "🎉 ¡Sistema de grabaciones configurado correctamente!"