#!/usr/bin/env node

/**
 * INSTALACIÓN COMPLETA DEL SERVICIO DE GRABACIÓN
 * Guía paso a paso para instalar desde cero
 */

function mostrarGuiaInstalacion() {
    console.log('🛠️ INSTALACIÓN COMPLETA DEL SERVICIO DE GRABACIÓN');
    console.log('=' .repeat(70));
    
    console.log('\n📋 PASO 1: ACTUALIZAR SISTEMA');
    console.log('   sudo apt update && sudo apt upgrade -y');
    
    console.log('\n📋 PASO 2: INSTALAR DEPENDENCIAS');
    console.log('   sudo apt install -y curl wget git ffmpeg nodejs npm');
    console.log('   sudo apt install -y python3 python3-pip');
    console.log('   sudo apt install -y nginx');
    
    console.log('\n📋 PASO 3: VERIFICAR INSTALACIONES');
    console.log('   ffmpeg -version');
    console.log('   node --version');
    console.log('   npm --version');
    
    console.log('\n📋 PASO 4: CREAR DIRECTORIO DEL SERVICIO');
    console.log('   sudo mkdir -p /opt/radio-recording');
    console.log('   sudo chown $USER:$USER /opt/radio-recording');
    console.log('   cd /opt/radio-recording');
    
    console.log('\n📋 PASO 5: CREAR ARCHIVO PRINCIPAL DEL SERVICIO');
    console.log('   Crear archivo: server.js');
    console.log('   Contenido: API de grabación con endpoints necesarios');
    
    console.log('\n📋 PASO 6: CREAR ARCHIVO package.json');
    console.log('   npm init -y');
    console.log('   npm install express cors multer fs-extra');
    
    console.log('\n📋 PASO 7: CREAR DIRECTORIO DE GRABACIONES');
    console.log('   sudo mkdir -p /opt/radio-recording/recordings');
    console.log('   sudo chmod 755 /opt/radio-recording/recordings');
    
    console.log('\n📋 PASO 8: CREAR SERVICIO SYSTEMD');
    console.log('   sudo nano /etc/systemd/system/radio-recording.service');
    
    console.log('\n📋 PASO 9: CONFIGURAR SERVICIO');
    console.log('   sudo systemctl daemon-reload');
    console.log('   sudo systemctl enable radio-recording');
    console.log('   sudo systemctl start radio-recording');
    console.log('   sudo systemctl status radio-recording');
    
    console.log('\n📋 PASO 10: CONFIGURAR FIREWALL');
    console.log('   sudo ufw allow 5000');
    console.log('   sudo ufw reload');
    
    console.log('\n📋 PASO 11: PROBAR SERVICIO');
    console.log('   curl http://localhost:5000/health');
    console.log('   curl http://localhost:5000/api/recordings');
    console.log('   curl http://localhost:5000/api/active-recordings');
    
    console.log('\n🎯 ENDPOINTS QUE DEBE TENER EL SERVICIO:');
    console.log('   GET  /health                    → Estado del servicio');
    console.log('   GET  /api/recordings            → Lista de grabaciones');
    console.log('   GET  /api/active-recordings     → Grabaciones activas');
    console.log('   POST /api/start-recording       → Iniciar grabación');
    console.log('   POST /api/stop-recording        → Detener grabación');
    console.log('   GET  /recordings/:filename      → Descargar archivo');
    console.log('   POST /api/cleanup-ghost         → Limpiar archivos fantasma');
    
    console.log('\n📁 ESTRUCTURA DE ARCHIVOS ESPERADA:');
    console.log('   /opt/radio-recording/');
    console.log('   ├── server.js              (API principal)');
    console.log('   ├── package.json           (Dependencias)');
    console.log('   ├── recordings/            (Archivos de audio)');
    console.log('   └── logs/                  (Logs del servicio)');
    
    console.log('\n🔧 ARCHIVO DE CONFIGURACIÓN DEL SERVICIO:');
    console.log('   [Unit]');
    console.log('   Description=Radio Recording Service');
    console.log('   After=network.target');
    console.log('   ');
    console.log('   [Service]');
    console.log('   Type=simple');
    console.log('   User=root');
    console.log('   WorkingDirectory=/opt/radio-recording');
    console.log('   ExecStart=/usr/bin/node server.js');
    console.log('   Restart=always');
    console.log('   RestartSec=10');
    console.log('   ');
    console.log('   [Install]');
    console.log('   WantedBy=multi-user.target');
    
    console.log('\n⚠️ NOTAS IMPORTANTES:');
    console.log('   • El servicio debe ejecutarse como root para acceder a audio');
    console.log('   • Puerto 5000 debe estar abierto en firewall');
    console.log('   • Directorio recordings debe tener permisos de escritura');
    console.log('   • FFmpeg es esencial para la grabación de audio');
    
    console.log('\n✅ SEÑALES DE ÉXITO:');
    console.log('   • systemctl status muestra "active (running)"');
    console.log('   • curl localhost:5000/health responde OK');
    console.log('   • No hay errores en journalctl -u radio-recording');
    console.log('   • Puerto 5000 aparece en netstat -tulpn');
    
    console.log('\n🆘 SI ALGO FALLA:');
    console.log('   • Revisar logs: sudo journalctl -u radio-recording -f');
    console.log('   • Verificar permisos: ls -la /opt/radio-recording/');
    console.log('   • Probar manualmente: node /opt/radio-recording/server.js');
    console.log('   • Verificar firewall: sudo ufw status');
    
    console.log('\n⏰ TIEMPO ESTIMADO: 30-45 minutos');
    console.log('🧪 PRUEBA FINAL:');
    console.log('   Después de la instalación, probar grabación desde la app');
    
    console.log('\n' + '=' .repeat(70));
    console.log('🏁 GUÍA DE INSTALACIÓN COMPLETA');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    mostrarGuiaInstalacion();
}

module.exports = { mostrarGuiaInstalacion };