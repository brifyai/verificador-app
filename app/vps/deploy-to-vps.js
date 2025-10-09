// Script para desplegar el sistema completo en la VPS
const fs = require('fs');
const path = require('path');

function generateVPSDeploymentScript() {
  const deployScript = `#!/bin/bash

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
`;

  return deployScript;
}

function generatePackageJson() {
  return {
    "name": "vps-radio-recording",
    "version": "2.0.0",
    "description": "VPS API para grabación automática de radios con scheduler",
    "main": "server.js",
    "scripts": {
      "start": "node server.js",
      "dev": "node server.js",
      "test": "node test-scheduler.js",
      "status": "systemctl status radio-recording",
      "logs": "journalctl -u radio-recording -f",
      "restart": "systemctl restart radio-recording"
    },
    "dependencies": {
      "express": "^4.18.2",
      "node-cron": "^3.0.3"
    },
    "keywords": ["radio", "recording", "scheduler", "vps", "automation"],
    "author": "Radio Monitoring System",
    "license": "MIT"
  };
}

function generateReadme() {
  return `# VPS Radio Recording System v2.0

Sistema automatizado de grabación de radios con programación por horarios.

## 🚀 Características

- ✅ **Programación automática**: Grabaciones en días y horarios específicos
- ✅ **Múltiples radios**: Soporte para múltiples streams simultáneos
- ✅ **Detección de frases**: Monitoreo de frases específicas
- ✅ **API REST**: Endpoints para gestión remota
- ✅ **Scheduler robusto**: Sistema de cron jobs integrado
- ✅ **Logs detallados**: Monitoreo completo del sistema

## 📡 Endpoints API

### Programación
- \`POST /api/schedule\` - Crear nueva programación
- \`GET /api/schedules\` - Ver todas las programaciones
- \`DELETE /api/scheduler/remove/:scheduleId\` - Eliminar programación

### Monitoreo
- \`GET /api/scheduler/status\` - Estado del scheduler
- \`GET /api/recordings/active\` - Grabaciones activas
- \`POST /api/scheduler/stop/:recordingId\` - Detener grabación

### Grabación Manual
- \`POST /api/record/start\` - Iniciar grabación manual

## 🛠️ Instalación

1. **Clonar archivos en VPS**:
   \`\`\`bash
   cd /root/radio-api
   \`\`\`

2. **Ejecutar script de despliegue**:
   \`\`\`bash
   chmod +x deploy.sh
   ./deploy.sh
   \`\`\`

3. **Verificar instalación**:
   \`\`\`bash
   curl http://localhost:3000/
   \`\`\`

## 📋 Estructura de Programación

\`\`\`json
{
  "userId": "user123",
  "radios": [
    {
      "id": "radio1",
      "name": "Radio Cooperativa",
      "streamUrl": "http://stream-url.com",
      "region": "RM"
    }
  ],
  "days": [1, 2, 3, 4, 5],
  "schedule": {
    "startTime": "08:00",
    "endTime": "09:00",
    "duration": 3600
  },
  "phrase": {
    "id": "phrase1",
    "text": "Coca Cola",
    "brand": "Coca Cola",
    "campaign": "Verano 2025"
  }
}
\`\`\`

## 🔧 Comandos Útiles

\`\`\`bash
# Ver estado del servicio
systemctl status radio-recording

# Ver logs en tiempo real
journalctl -u radio-recording -f

# Reiniciar servicio
systemctl restart radio-recording

# Ver grabaciones activas
curl http://localhost:3000/api/recordings/active

# Ver programaciones
curl http://localhost:3000/api/schedules
\`\`\`

## 📁 Estructura de Archivos

\`\`\`
/root/radio-api/
├── server.js          # Servidor principal
├── scheduler.js       # Sistema de programación
├── package.json       # Dependencias
├── config/           # Programaciones guardadas
├── recordings/       # Archivos de audio
└── logs/            # Logs del sistema
\`\`\`

## 🐛 Solución de Problemas

### El servicio no inicia
\`\`\`bash
journalctl -u radio-recording --no-pager -n 50
\`\`\`

### Grabaciones fallan
1. Verificar que ffmpeg esté instalado: \`which ffmpeg\`
2. Probar URL manualmente: \`ffmpeg -i <stream-url> -t 10 test.mp3\`
3. Verificar permisos en directorio recordings

### Puerto ocupado
\`\`\`bash
netstat -tlnp | grep :3000
kill <PID>
\`\`\`

## 📊 Monitoreo

El sistema incluye logs detallados y métricas:
- Grabaciones programadas y ejecutadas
- Errores de streams
- Estado de programaciones
- Uso de recursos

---
**Versión**: 2.0.0  
**Última actualización**: ${new Date().toLocaleDateString()}
`;
}

// Generar todos los archivos
function generateAllFiles() {
  console.log('📦 Generando archivos de despliegue...');
  
  // Script de despliegue
  const deployScript = generateVPSDeploymentScript();
  fs.writeFileSync('./deploy.sh', deployScript);
  console.log('✅ deploy.sh creado');
  
  // Package.json actualizado
  const packageJson = generatePackageJson();
  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json actualizado');
  
  // README
  const readme = generateReadme();
  fs.writeFileSync('./README.md', readme);
  console.log('✅ README.md creado');
  
  console.log('\n🚀 Archivos listos para despliegue:');
  console.log('   📄 deploy.sh - Script de instalación automática');
  console.log('   📄 package.json - Dependencias actualizadas');
  console.log('   📄 README.md - Documentación completa');
  console.log('\n💡 Para desplegar en VPS:');
  console.log('   1. Subir todos los archivos a /root/radio-api/');
  console.log('   2. Ejecutar: chmod +x deploy.sh && ./deploy.sh');
}

if (require.main === module) {
  generateAllFiles();
}

module.exports = {
  generateVPSDeploymentScript,
  generatePackageJson,
  generateReadme
};
