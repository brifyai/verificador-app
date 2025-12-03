#!/bin/bash

# SCRIPT DE INSTALACIÓN: Servidor de Grabación Organizado por Fecha y Radio
# Este script instala el nuevo servidor que organiza grabaciones automáticamente

set -e

echo "🚀 INSTALACIÓN DEL SERVIDOR DE GRABACIÓN ORGANIZADO"
echo "=================================================="

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función de logging
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

# Verificar si estamos en el VPS
check_vps() {
    if [[ "$HOSTNAME" != "vps" && ! "$HOSTNAME" =~ "213.199.39.147" ]]; then
        log "⚠️  Este script debe ejecutarse en el VPS (213.199.39.147)"
        log "Conéctate con: ssh root@213.199.39.147"
        exit 1
    fi
}

# Detener servicio anterior
stop_old_service() {
    log "Deteniendo servicio anterior..."
    systemctl stop radio-recording.service || true
    systemctl disable radio-recording.service || true
    success "Servicio anterior detenido"
}

# Respaldar configuración anterior
backup_old_config() {
    log "Creando backup de configuración anterior..."
    if [ -d "/opt/radio-recording" ]; then
        BACKUP_DIR="/opt/radio-recording-backup-$(date +%Y%m%d-%H%M%S)"
        cp -r /opt/radio-recording "$BACKUP_DIR"
        success "Backup creado en: $BACKUP_DIR"
    fi
}

# Instalar dependencias
install_dependencies() {
    log "Instalando dependencias..."
    apt update
    apt install -y ffmpeg nodejs npm
    success "Dependencias instaladas"
}

# Crear directorio de la aplicación
setup_directories() {
    log "Configurando directorios..."
    mkdir -p /opt/radio-recording-organized
    mkdir -p /opt/radio-recording-organized/recordings
    mkdir -p /opt/radio-recording-organized/logs
    success "Directorios creados"
}

# Copiar el nuevo servidor
copy_server_files() {
    log "Copiando archivos del servidor..."
    
    # Verificar si el archivo existe localmente
    if [ ! -f "server-vps-organized.js" ]; then
        error "El archivo server-vps-organized.js no existe"
        error "Asegúrate de estar en el directorio correcto"
        exit 1
    fi
    
    cp server-vps-organized.js /opt/radio-recording-organized/
    
    # Crear package.json
    cat > /opt/radio-recording-organized/package.json << 'EOF'
{
  "name": "radio-recording-organized",
  "version": "2.0.0",
  "description": "Servidor de grabación con organización automática por fecha y radio",
  "main": "server-vps-organized.js",
  "scripts": {
    "start": "node server-vps-organized.js",
    "dev": "nodemon server-vps-organized.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "fs-extra": "^11.1.1",
    "node-fetch": "^2.6.7"
  }
}
EOF
    
    success "Archivos del servidor copiados"
}

# Instalar dependencias Node.js
install_node_deps() {
    log "Instalando dependencias Node.js..."
    cd /opt/radio-recording-organized
    npm install
    success "Dependencias Node.js instaladas"
}

# Configurar variables de entorno
setup_env() {
    log "Configurando variables de entorno..."
    
    cat > /opt/radio-recording-organized/.env << 'EOF'
# Configuración de Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Puerto del servidor
PORT=5000
EOF
    
    success "Variables de entorno configuradas"
    log "⚠️  IMPORTANTE: Edita /opt/radio-recording-organized/.env con tus credenciales reales"
}

# Crear archivo de servicio systemd
create_systemd_service() {
    log "Creando archivo de servicio systemd..."
    
    cat > /etc/systemd/system/radio-recording-organized.service << 'EOF'
[Unit]
Description=Radio Recording Service (Organized)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/radio-recording-organized
Environment="SUPABASE_URL=https://your-project.supabase.co"
Environment="SUPABASE_ANON_KEY=your-anon-key"
ExecStart=/usr/bin/node server-vps-organized.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=radio-recording-organized

[Install]
WantedBy=multi-user.target
EOF
    
    success "Archivo de servicio systemd creado"
}

# Iniciar servicio
start_service() {
    log "Iniciando servicio..."
    systemctl daemon-reload
    systemctl enable radio-recording-organized.service
    systemctl start radio-recording-organized.service
    
    # Esperar un momento y verificar estado
    sleep 3
    systemctl status radio-recording-organized.service --no-pager
    
    success "Servicio iniciado"
}

# Verificar instalación
verify_installation() {
    log "Verificando instalación..."
    
    # Verificar que el servicio está corriendo
    if systemctl is-active --quiet radio-recording-organized.service; then
        success "✅ Servicio está corriendo"
    else
        error "❌ Servicio no está corriendo"
        journalctl -u radio-recording-organized.service --no-pager -n 20
        exit 1
    fi
    
    # Verificar endpoint de health
    sleep 2
    if curl -s http://localhost:5000/health > /dev/null; then
        success "✅ Endpoint de health responde"
    else
        error "❌ Endpoint de health no responde"
    fi
    
    # Verificar estructura de directorios
    if [ -d "/opt/radio-recording-organized/recordings" ]; then
        success "✅ Directorio de grabaciones creado"
    else
        error "❌ Directorio de grabaciones no existe"
    fi
}

# Mostrar información final
show_completion_info() {
    echo ""
    echo "=================================================="
    echo -e "${GREEN}🎉 INSTALACIÓN COMPLETADA${NC}"
    echo "=================================================="
    echo ""
    echo "📋 RESUMEN:"
    echo "   ✅ Servicio: radio-recording-organized.service"
    echo "   ✅ Puerto: 5000"
    echo "   ✅ Directorio: /opt/radio-recording-organized"
    echo "   ✅ Estructura: /recordings/YYYY-MM-DD/radio_id/"
    echo ""
    echo "🔧 PRÓXIMOS PASOS:"
    echo "   1. Edita el archivo de entorno:"
    echo "      nano /opt/radio-recording-organized/.env"
    echo ""
    echo "   2. Actualiza las credenciales de Supabase:"
    echo "      - SUPABASE_URL"
    echo "      - SUPABASE_ANON_KEY"
    echo ""
    echo "   3. Reinicia el servicio:"
    echo "      systemctl restart radio-recording-organized.service"
    echo ""
    echo "   4. Verifica el estado:"
    echo "      systemctl status radio-recording-organized.service"
    echo "      journalctl -u radio-recording-organized.service -f"
    echo ""
    echo "   5. Prueba el endpoint:"
    echo "      curl http://localhost:5000/health"
    echo ""
    echo "📖 COMANDOS ÚTILES:"
    echo "   • Ver logs: journalctl -u radio-recording-organized.service -f"
    echo "   • Reiniciar: systemctl restart radio-recording-organized.service"
    echo "   • Detener: systemctl stop radio-recording-organized.service"
    echo "   • Estado: systemctl status radio-recording-organized.service"
    echo ""
    echo "⚠️  IMPORTANTE: Las grabaciones ahora se organizarán automáticamente:"
    echo "   /opt/radio-recording-organized/recordings/YYYY-MM-DD/radio_id/"
    echo ""
}

# Función principal
main() {
    check_vps
    stop_old_service
    backup_old_config
    install_dependencies
    setup_directories
    copy_server_files
    install_node_deps
    setup_env
    create_systemd_service
    start_service
    verify_installation
    show_completion_info
}

# Ejecutar
main