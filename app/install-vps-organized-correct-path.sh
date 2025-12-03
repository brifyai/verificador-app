#!/bin/bash

# Script de instalación para el servidor de grabación organizado con ruta correcta
# Este script instala el servidor en el VPS con la ruta correcta: /home/radioapp/radio-recorder/recordings

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si estamos en el VPS
if [ ! -f "/etc/os-release" ]; then
    print_error "Este script debe ejecutarse en el VPS Ubuntu"
    exit 1
fi

# Verificar usuario root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script debe ejecutarse como root"
    exit 1
fi

echo "========================================"
echo "Instalación del Servidor de Grabación Organizado"
echo "Ruta correcta: /home/radioapp/radio-recorder/recordings"
echo "========================================"

# Paso 1: Actualizar sistema
print_warning "Actualizando sistema..."
apt update && apt upgrade -y
print_success "Sistema actualizado"

# Paso 2: Instalar dependencias
print_warning "Instalando dependencias..."
apt install -y curl wget git ffmpeg build-essential
print_success "Dependencias instaladas"

# Paso 3: Instalar Node.js 18
print_warning "Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
print_success "Node.js instalado: $(node --version)"

# Paso 4: Verificar FFmpeg
print_warning "Verificando FFmpeg..."
ffmpeg -version
print_success "FFmpeg verificado"

# Paso 5: Crear usuario radioapp si no existe
if ! id "radioapp" &>/dev/null; then
    print_warning "Creando usuario radioapp..."
    useradd -m -s /bin/bash radioapp
    print_success "Usuario radioapp creado"
else
    print_warning "Usuario radioapp ya existe"
fi

# Paso 6: Crear directorios necesarios
print_warning "Creando directorios..."
mkdir -p /home/radioapp/radio-recorder/recordings
mkdir -p /home/radioapp/radio-recorder/logs
mkdir -p /home/radioapp/radio-recorder/app
print_success "Directorios creados"

# Paso 7: Establecer permisos
print_warning "Configurando permisos..."
chown -R radioapp:radioapp /home/radioapp
chmod -R 755 /home/radioapp/radio-recorder/recordings
print_success "Permisos configurados"

# Paso 8: Copiar archivo del servidor
print_warning "Copiando archivo del servidor..."
if [ -f "/root/verificador-app/app/server-vps-organized-correct-path.js" ]; then
    cp /root/verificador-app/app/server-vps-organized-correct-path.js /home/radioapp/radio-recorder/app/
    print_success "Archivo del servidor copiado"
else
    print_error "No se encontró el archivo server-vps-organized-correct-path.js"
    print_error "Asegúrate de subir el archivo al VPS primero"
    exit 1
fi

# Paso 9: Crear package.json
print_warning "Creando package.json..."
cat > /home/radioapp/radio-recorder/app/package.json << 'EOF'
{
  "name": "radio-recording-organized",
  "version": "1.0.0",
  "description": "Servidor de grabación de radios con organización automática",
  "main": "server-vps-organized-correct-path.js",
  "scripts": {
    "start": "node server-vps-organized-correct-path.js",
    "dev": "nodemon server-vps-organized-correct-path.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "fs-extra": "^11.1.1",
    "node-fetch": "^2.6.9"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
EOF
print_success "package.json creado"

# Paso 10: Instalar dependencias Node.js
print_warning "Instalando dependencias Node.js..."
cd /home/radioapp/radio-recorder/app
npm install
print_success "Dependencias instaladas"

# Paso 11: Crear archivo de entorno
print_warning "Creando archivo de entorno..."
cat > /home/radioapp/radio-recorder/app/.env << 'EOF'
# Configuración de Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Configuración del servidor
PORT=5000
RECORDINGS_DIR=/home/radioapp/radio-recorder/recordings
EOF
print_success "Archivo de entorno creado"

# Paso 12: Crear archivo de servicio systemd
print_warning "Creando servicio systemd..."
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
Environment=SUPABASE_URL=https://your-project.supabase.co
Environment=SUPABASE_ANON_KEY=your-anon-key
ExecStart=/usr/bin/node server-vps-organized-correct-path.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=radio-recording-organized

[Install]
WantedBy=multi-user.target
EOF
print_success "Servicio systemd creado"

# Paso 13: Configurar firewall
print_warning "Configurando firewall..."
ufw allow 5000/tcp
print_success "Puerto 5000 habilitado en firewall"

# Paso 14: Habilitar e iniciar servicio
print_warning "Habilitando servicio..."
systemctl daemon-reload
systemctl enable radio-recording-organized.service
print_success "Servicio habilitado"

# Paso 15: Iniciar servicio
print_warning "Iniciando servicio..."
systemctl start radio-recording-organized.service
sleep 3

# Verificar estado
if systemctl is-active --quiet radio-recording-organized; then
    print_success "✅ Servicio iniciado correctamente"
    
    # Mostrar logs iniciales
    echo ""
    print_warning "Logs del servicio (últimas 10 líneas):"
    journalctl -u radio-recording-organized -n 10 --no-pager
else
    print_error "❌ Error iniciando el servicio"
    echo ""
    print_warning "Logs de error:"
    journalctl -u radio-recording-organized -n 20 --no-pager
    exit 1
fi

# Paso 16: Verificar directorio de grabaciones
print_warning "Verificando directorio de grabaciones..."
ls -la /home/radioapp/radio-recorder/recordings/
print_success "Directorio de grabaciones verificado"

echo ""
echo "========================================"
print_success "INSTALACIÓN COMPLETADA EXITOSAMENTE"
echo "========================================"
echo ""
echo "📁 Directorio de grabaciones: /home/radioapp/radio-recorder/recordings"
echo "📁 Estructura: /recordings/YYYY-MM-DD/radio_id/"
echo "🌐 Servidor: http://localhost:5000"
echo "📊 Health check: http://localhost:5000/health"
echo ""
echo "Comandos útiles:"
echo "  • Ver estado: systemctl status radio-recording-organized"
echo "  • Ver logs: journalctl -u radio-recording-organized -f"
echo "  • Reiniciar: systemctl restart radio-recording-organized"
echo "  • Detener: systemctl stop radio-recording-organized"
echo ""
print_warning "IMPORTANTE: Actualiza las variables de entorno en /home/radioapp/radio-recorder/app/.env"
print_warning "con tus credenciales reales de Supabase antes de usar el sistema."
echo ""

# Mostrar estructura final
echo "Estructura de directorios:"
tree -L 3 /home/radioapp/radio-recorder/ || find /home/radioapp/radio-recorder/ -type d | head -20

print_success "✅ Todo listo para grabar organizadamente!"