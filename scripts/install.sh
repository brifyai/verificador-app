
#!/bin/bash

# 🚀 OndaVerificada - Script de Instalación Automática
# Autor: Sistema OndaVerificada
# Versión: 1.0

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Banner
cat << "EOF"
  ╔═══════════════════════════════════════╗
  ║        🚀 ONDAVERIFICADA 📻          ║
  ║   Sistema de Monitoreo de Radios     ║
  ║         Instalación Automática       ║
  ╚═══════════════════════════════════════╝
EOF

log "Iniciando instalación de OndaVerificada..."

# Verificar que se ejecuta como root o con sudo
if [[ $EUID -eq 0 ]]; then
   warn "Se recomienda NO ejecutar como root. ¿Continuar? (y/N)"
   read -r response
   if [[ ! "$response" =~ ^[Yy]$ ]]; then
       error "Instalación cancelada"
   fi
fi

# Variables de configuración
INSTALL_DIR="/opt/ondaverificada"
DB_NAME="ondaverificada"
DB_USER="ondauser"
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
APP_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-32)

log "Configuración:"
info "Directorio de instalación: $INSTALL_DIR"
info "Base de datos: $DB_NAME"
info "Usuario de BD: $DB_USER"

# 1. Actualizar sistema
log "Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependencias base
log "Instalando dependencias base..."
sudo apt install -y curl git build-essential postgresql postgresql-contrib ffmpeg nginx certbot python3-certbot-nginx

# 3. Instalar Node.js 18 LTS
log "Instalando Node.js 18 LTS..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | sed 's/v//') -lt 18 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 4. Instalar Yarn
log "Instalando Yarn..."
if ! command -v yarn &> /dev/null; then
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
    sudo apt update && sudo apt install -y yarn
fi

# 5. Instalar PM2
log "Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Verificar versiones
log "Verificando instalaciones..."
info "Node.js: $(node --version)"
info "Yarn: $(yarn --version)"
info "PostgreSQL: $(psql --version)"
info "FFmpeg: $(ffmpeg -version | head -n 1)"
info "PM2: $(pm2 --version)"

# 6. Configurar PostgreSQL
log "Configurando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos y usuario
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

log "Base de datos configurada exitosamente"

# 7. Crear directorio y configurar permisos
log "Creando directorio de instalación..."
sudo mkdir -p $INSTALL_DIR
sudo chown $USER:$USER $INSTALL_DIR

# 8. Copiar archivos del proyecto (asumiendo que están en el directorio actual)
if [[ -d "app" ]]; then
    log "Copiando archivos del proyecto..."
    cp -r app/ $INSTALL_DIR/
    cd $INSTALL_DIR/app
else
    error "No se encontró el directorio 'app'. Ejecuta este script desde el directorio del proyecto."
fi

# 9. Crear archivo .env
log "Configurando variables de entorno..."
cat > .env << EOF
# Base de datos
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# Autenticación
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$APP_SECRET"

# APIs de IA (Configura tus propias keys)
ABACUS_API_KEY=""
GROQ_API_KEY=""
OPENAI_API_KEY=""

# Google Drive (Opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Configuración del servidor
NODE_ENV="production"
PORT="3000"
HOST="0.0.0.0"

# Configuración de logs
LOG_LEVEL="info"
EOF

# 10. Instalar dependencias
log "Instalando dependencias del proyecto..."
yarn install

# 11. Configurar Prisma y base de datos
log "Configurando base de datos con Prisma..."
yarn prisma generate
yarn prisma db push

# Importar datos iniciales si existe el script
if [[ -f "scripts/seed.ts" ]]; then
    log "Importando datos iniciales..."
    yarn prisma db seed || warn "Seed fallido, continuando..."
fi

# 12. Construir proyecto
log "Construyendo proyecto para producción..."
yarn build

# 13. Configurar PM2
log "Configurando PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ondaverificada',
    script: 'yarn',
    args: 'start',
    cwd: '$INSTALL_DIR/app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/ondaverificada/error.log',
    out_file: '/var/log/ondaverificada/access.log',
    log_file: '/var/log/ondaverificada/combined.log'
  }]
};
EOF

# Crear directorio de logs
sudo mkdir -p /var/log/ondaverificada
sudo chown $USER:$USER /var/log/ondaverificada

# 14. Configurar Nginx
log "Configurando Nginx..."
sudo tee /etc/nginx/sites-available/ondaverificada << EOF
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/ondaverificada /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 15. Iniciar aplicación con PM2
log "Iniciando aplicación..."
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 16. Configurar firewall básico
log "Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 17. Crear scripts de utilidad
log "Creando scripts de utilidad..."
sudo tee /usr/local/bin/ondaverificada << 'EOF'
#!/bin/bash
case "$1" in
    start)
        pm2 start ondaverificada
        ;;
    stop)
        pm2 stop ondaverificada
        ;;
    restart)
        pm2 restart ondaverificada
        ;;
    logs)
        pm2 logs ondaverificada
        ;;
    status)
        pm2 status ondaverificada
        ;;
    backup)
        /opt/ondaverificada/scripts/backup.sh
        ;;
    *)
        echo "Uso: ondaverificada {start|stop|restart|logs|status|backup}"
        exit 1
        ;;
esac
EOF

sudo chmod +x /usr/local/bin/ondaverificada

# Crear script de backup
mkdir -p $INSTALL_DIR/scripts
cat > $INSTALL_DIR/scripts/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/ondaverificada/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup de base de datos
pg_dump -h localhost -U $DB_USER $DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup de archivos de configuración
tar -czf \$BACKUP_DIR/config_backup_\$DATE.tar.gz \
    $INSTALL_DIR/app/.env \
    $INSTALL_DIR/app/ecosystem.config.js \
    /etc/nginx/sites-available/ondaverificada

echo "Backup completado: \$BACKUP_DIR"
ls -la \$BACKUP_DIR/
EOF

chmod +x $INSTALL_DIR/scripts/backup.sh

# 18. Información final
log "🎉 ¡Instalación completada exitosamente!"
echo ""
info "📋 INFORMACIÓN DE LA INSTALACIÓN:"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Directorio: $INSTALL_DIR"
info "URL: http://localhost"
info "URL directa: http://localhost:3000"
info "Base de datos: $DB_NAME"
info "Usuario de BD: $DB_USER"
info "Contraseña de BD: $DB_PASS"
echo ""
info "🔧 COMANDOS ÚTILES:"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Iniciar: ondaverificada start"
info "Detener: ondaverificada stop"
info "Reiniciar: ondaverificada restart"
info "Ver logs: ondaverificada logs"
info "Estado: ondaverificada status"
info "Backup: ondaverificada backup"
echo ""
info "📁 ARCHIVOS IMPORTANTES:"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Configuración: $INSTALL_DIR/app/.env"
info "Logs: /var/log/ondaverificada/"
info "Nginx config: /etc/nginx/sites-available/ondaverificada"
echo ""
warn "🔐 IMPORTANTE:"
warn "- Guarda la contraseña de BD: $DB_PASS"
warn "- Configura tus API keys en: $INSTALL_DIR/app/.env"
warn "- Para dominio personalizado, configura el DNS y ejecuta:"
warn "  sudo certbot --nginx -d tu-dominio.com"
echo ""
log "Verificando estado de la aplicación..."
sleep 5
pm2 status ondaverificada

echo ""
log "🚀 ¡OndaVerificada está funcionando!"
info "Accede a: http://localhost"
info "Panel de control: http://localhost/configuracion"
EOF
