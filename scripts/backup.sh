
#!/bin/bash

# 🔄 OndaVerificada - Script de Backup Completo
# Autor: Sistema OndaVerificada
# Versión: 1.0

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Banner
cat << "EOF"
  ╔═══════════════════════════════════════╗
  ║       🔄 BACKUP ONDAVERIFICADA       ║
  ║     Sistema de Respaldo Completo     ║
  ╚═══════════════════════════════════════╝
EOF

# Variables de configuración
INSTALL_DIR="/opt/ondaverificada"
BACKUP_BASE_DIR="/opt/ondaverificada/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$DATE"
RETENTION_DAYS=30

# Verificar si el directorio de instalación existe
if [[ ! -d "$INSTALL_DIR" ]]; then
    error "Directorio de instalación no encontrado: $INSTALL_DIR"
fi

# Crear directorio de backup
log "Creando directorio de backup..."
mkdir -p "$BACKUP_DIR"

# Leer configuración de .env si existe
ENV_FILE="$INSTALL_DIR/app/.env"
if [[ -f "$ENV_FILE" ]]; then
    source "$ENV_FILE"
fi

# Extraer información de la base de datos
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="ondaverificada"
DB_USER="ondauser"

if [[ -n "$DATABASE_URL" ]]; then
    # Parsear DATABASE_URL
    DB_INFO=$(echo "$DATABASE_URL" | sed 's/postgresql:\/\/\([^:]*\):\([^@]*\)@\([^:]*\):\([^/]*\)\/\(.*\)/\1 \2 \3 \4 \5/')
    read DB_USER DB_PASS DB_HOST DB_PORT DB_NAME <<< "$DB_INFO"
fi

log "Iniciando backup completo del sistema OndaVerificada..."
info "Fecha: $(date)"
info "Directorio de backup: $BACKUP_DIR"

# 1. Backup de la base de datos
log "1. Backup de base de datos PostgreSQL..."
if command -v pg_dump &> /dev/null; then
    PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/database_$DATE.sql"
    info "✅ Base de datos respaldada: database_$DATE.sql"
    
    # Comprimir backup de BD
    gzip "$BACKUP_DIR/database_$DATE.sql"
    info "✅ Backup comprimido: database_$DATE.sql.gz"
else
    warn "pg_dump no encontrado, omitiendo backup de base de datos"
fi

# 2. Backup del código de la aplicación
log "2. Backup del código de aplicación..."
tar -czf "$BACKUP_DIR/app_code_$DATE.tar.gz" \
    -C "$INSTALL_DIR" \
    --exclude="app/node_modules" \
    --exclude="app/.next" \
    --exclude="app/.build" \
    --exclude="app/data/radios_imported.json" \
    --exclude="app/public/radios_para_importar.json" \
    app/
info "✅ Código de aplicación respaldado: app_code_$DATE.tar.gz"

# 3. Backup de configuraciones del sistema
log "3. Backup de configuraciones del sistema..."
mkdir -p "$BACKUP_DIR/configs"

# Archivo .env
if [[ -f "$ENV_FILE" ]]; then
    cp "$ENV_FILE" "$BACKUP_DIR/configs/.env"
    info "✅ Configuración .env respaldada"
fi

# Configuración de PM2
if [[ -f "$INSTALL_DIR/app/ecosystem.config.js" ]]; then
    cp "$INSTALL_DIR/app/ecosystem.config.js" "$BACKUP_DIR/configs/ecosystem.config.js"
    info "✅ Configuración PM2 respaldada"
fi

# Configuración de Nginx
if [[ -f "/etc/nginx/sites-available/ondaverificada" ]]; then
    sudo cp "/etc/nginx/sites-available/ondaverificada" "$BACKUP_DIR/configs/nginx_ondaverificada.conf"
    info "✅ Configuración Nginx respaldada"
fi

# 4. Backup de datos de la aplicación
log "4. Backup de datos de aplicación..."
DATA_DIR="$INSTALL_DIR/app/data"
if [[ -d "$DATA_DIR" ]]; then
    tar -czf "$BACKUP_DIR/app_data_$DATE.tar.gz" -C "$INSTALL_DIR/app" data/
    info "✅ Datos de aplicación respaldados: app_data_$DATE.tar.gz"
fi

# 5. Backup de logs (últimos 7 días)
log "5. Backup de logs recientes..."
LOG_DIRS=("/var/log/ondaverificada" "/home/$USER/.pm2/logs")
for log_dir in "${LOG_DIRS[@]}"; do
    if [[ -d "$log_dir" ]]; then
        # Encontrar logs de los últimos 7 días
        find "$log_dir" -name "*.log" -mtime -7 -exec cp {} "$BACKUP_DIR/configs/" \; 2>/dev/null || true
    fi
done
info "✅ Logs recientes respaldados"

# 6. Información del sistema
log "6. Recopilando información del sistema..."
cat > "$BACKUP_DIR/system_info.txt" << EOF
# OndaVerificada System Backup Information
# Generated: $(date)
# Host: $(hostname)
# User: $(whoami)

## System Information
OS: $(lsb_release -d 2>/dev/null | cut -f2 || echo "Unknown")
Kernel: $(uname -r)
Uptime: $(uptime)

## Disk Usage
$(df -h)

## Memory Usage
$(free -h)

## Node.js Version
$(node --version 2>/dev/null || echo "Node.js not found")

## Yarn Version
$(yarn --version 2>/dev/null || echo "Yarn not found")

## PM2 Status
$(pm2 status 2>/dev/null || echo "PM2 not found")

## Nginx Status
$(sudo systemctl status nginx --no-pager -l 2>/dev/null || echo "Nginx not found")

## PostgreSQL Status  
$(sudo systemctl status postgresql --no-pager -l 2>/dev/null || echo "PostgreSQL not found")

## Database Size
EOF

if command -v psql &> /dev/null && [[ -n "$DB_PASS" ]]; then
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" -c "
        SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size 
        FROM pg_tables 
        WHERE schemaname = 'public';" >> "$BACKUP_DIR/system_info.txt" 2>/dev/null || true
fi

info "✅ Información del sistema recopilada"

# 7. Crear manifiesto del backup
log "7. Creando manifiesto del backup..."
cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << EOF
# 🔄 Backup de OndaVerificada

**Fecha:** $(date)  
**Hostname:** $(hostname)  
**Usuario:** $(whoami)  
**Versión:** Sistema completo con 358 radios y APIs dinámicas

## 📁 Contenido del Backup

### Base de Datos
- \`database_${DATE}.sql.gz\` - Backup completo de PostgreSQL
- Tamaño: $(du -h "$BACKUP_DIR/database_${DATE}.sql.gz" 2>/dev/null | cut -f1 || echo "N/A")

### Código de Aplicación
- \`app_code_${DATE}.tar.gz\` - Código fuente completo (sin node_modules)
- Tamaño: $(du -h "$BACKUP_DIR/app_code_${DATE}.tar.gz" 2>/dev/null | cut -f1 || echo "N/A")

### Datos de Aplicación
- \`app_data_${DATE}.tar.gz\` - APIs dinámicas, proveedores, etc.
- Tamaño: $(du -h "$BACKUP_DIR/app_data_${DATE}.tar.gz" 2>/dev/null | cut -f1 || echo "N/A")

### Configuraciones
- \`configs/\` - Archivos de configuración del sistema
  - \`.env\` - Variables de entorno
  - \`ecosystem.config.js\` - Configuración PM2
  - \`nginx_ondaverificada.conf\` - Configuración Nginx
  - Logs recientes

### Información del Sistema
- \`system_info.txt\` - Estado completo del sistema
- \`BACKUP_MANIFEST.md\` - Este archivo

## 🔧 Restauración

Para restaurar este backup:

1. **Base de datos:**
   \`\`\`bash
   gunzip database_${DATE}.sql.gz
   psql -h localhost -U ondauser ondaverificada < database_${DATE}.sql
   \`\`\`

2. **Código:**
   \`\`\`bash
   cd /opt/ondaverificada
   tar -xzf app_code_${DATE}.tar.gz
   cd app && yarn install
   \`\`\`

3. **Datos:**
   \`\`\`bash
   cd /opt/ondaverificada/app
   tar -xzf app_data_${DATE}.tar.gz
   \`\`\`

4. **Configuraciones:**
   \`\`\`bash
   cp configs/.env /opt/ondaverificada/app/.env
   cp configs/ecosystem.config.js /opt/ondaverificada/app/
   sudo cp configs/nginx_ondaverificada.conf /etc/nginx/sites-available/ondaverificada
   \`\`\`

**Backup ID:** ${DATE}  
**Tamaño total:** $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "Calculando...")
EOF

info "✅ Manifiesto creado"

# 8. Crear archivo de restauración rápida
log "8. Creando script de restauración..."
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
#!/bin/bash

# Script de restauración automática
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/opt/ondaverificada"

echo "🔄 Iniciando restauración de OndaVerificada..."
echo "Backup: $BACKUP_DIR"

# Detener aplicación
pm2 stop ondaverificada 2>/dev/null || true

# Restaurar base de datos
if [[ -f "$BACKUP_DIR/database_*.sql.gz" ]]; then
    echo "Restaurando base de datos..."
    gunzip -c "$BACKUP_DIR"/database_*.sql.gz | psql -h localhost -U ondauser ondaverificada
fi

# Restaurar código
if [[ -f "$BACKUP_DIR/app_code_*.tar.gz" ]]; then
    echo "Restaurando código..."
    rm -rf "$INSTALL_DIR/app_backup_$(date +%s)"
    mv "$INSTALL_DIR/app" "$INSTALL_DIR/app_backup_$(date +%s)" 2>/dev/null || true
    tar -xzf "$BACKUP_DIR"/app_code_*.tar.gz -C "$INSTALL_DIR"
fi

# Restaurar datos
if [[ -f "$BACKUP_DIR/app_data_*.tar.gz" ]]; then
    echo "Restaurando datos..."
    tar -xzf "$BACKUP_DIR"/app_data_*.tar.gz -C "$INSTALL_DIR/app"
fi

# Restaurar configuraciones
if [[ -d "$BACKUP_DIR/configs" ]]; then
    echo "Restaurando configuraciones..."
    cp "$BACKUP_DIR/configs/.env" "$INSTALL_DIR/app/.env" 2>/dev/null || true
    cp "$BACKUP_DIR/configs/ecosystem.config.js" "$INSTALL_DIR/app/" 2>/dev/null || true
    sudo cp "$BACKUP_DIR/configs/nginx_ondaverificada.conf" /etc/nginx/sites-available/ondaverificada 2>/dev/null || true
fi

# Reinstalar dependencias y reconstruir
cd "$INSTALL_DIR/app"
yarn install
yarn build

# Reiniciar servicios
sudo systemctl reload nginx
pm2 start ondaverificada

echo "✅ Restauración completada"
EOF

chmod +x "$BACKUP_DIR/restore.sh"
info "✅ Script de restauración creado"

# 9. Calcular tamaño total y crear resumen
log "9. Finalizando backup..."
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

# Limpiar backups antiguos
log "10. Limpieza de backups antiguos (>$RETENTION_DAYS días)..."
find "$BACKUP_BASE_DIR" -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
info "✅ Backups antiguos limpiados"

# Crear symlink al backup más reciente
ln -sfn "$BACKUP_DIR" "$BACKUP_BASE_DIR/latest"

# Resumen final
log "🎉 ¡Backup completado exitosamente!"
echo ""
info "📊 RESUMEN DEL BACKUP:"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Fecha: $(date)"
info "Backup ID: $DATE"
info "Directorio: $BACKUP_DIR"
info "Tamaño total: $TOTAL_SIZE"
info "Archivos incluidos:"
info "  🗃️  database_${DATE}.sql.gz"
info "  📦 app_code_${DATE}.tar.gz"
info "  💾 app_data_${DATE}.tar.gz"
info "  ⚙️  configs/ (múltiples archivos)"
info "  📋 system_info.txt"
info "  📜 BACKUP_MANIFEST.md"
info "  🔄 restore.sh"
echo ""
info "🔧 PARA RESTAURAR:"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Ejecutar: $BACKUP_DIR/restore.sh"
info "O seguir las instrucciones en: $BACKUP_DIR/BACKUP_MANIFEST.md"
echo ""
info "🔗 ACCESO RÁPIDO:"
info "Último backup: $BACKUP_BASE_DIR/latest"
echo ""
warn "💡 TIP: Almacena este backup en un lugar seguro fuera del servidor"

# Mostrar lista de backups disponibles
echo ""
info "📂 BACKUPS DISPONIBLES:"
ls -la "$BACKUP_BASE_DIR"/ 2>/dev/null | grep "^d" | tail -10
EOF
