
# 🚀 **OndaVerificada - Guía Completa de Instalación**

## 📋 **Descripción del Sistema**

**OndaVerificada** es un sistema completo de monitoreo y verificación de publicidad en radios chilenas que permite:

- ✅ **Monitoreo de 358+ radios** de todas las regiones de Chile
- 🤖 **APIs dinámicas de transcripción** (Abacus AI, Groq, OpenAI, AssemblyAI y más)
- 📊 **Dashboard completo** con reportes y análisis
- 💰 **Sistema de facturación** y valorización automática
- ☁️ **Integración con Google Drive** para almacenamiento
- 🔍 **Detección automática** de frases publicitarias
- 📈 **Simulador de costos** avanzado

---

## 🛠️ **Requisitos del Sistema**

### **Servidor/Hardware:**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 4GB mínimo (8GB recomendado para 500 radios)
- **CPU**: 4 cores mínimo (8 cores recomendado)
- **Disco**: 50GB mínimo (100GB+ para almacenamiento de audio)
- **Ancho de banda**: 100 Mbps dedicado

### **Software Base:**
- **Node.js**: v18+ LTS
- **PostgreSQL**: v13+
- **FFmpeg**: v4.4+
- **Git**: v2.20+
- **Yarn**: v1.22+

---

## 🏗️ **Instalación Paso a Paso**

### **1. Preparación del Servidor**

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias base
sudo apt install -y curl git build-essential

# Instalar Node.js v18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install -y yarn

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar FFmpeg
sudo apt install -y ffmpeg

# Verificar instalaciones
node --version    # Debe ser v18+
yarn --version    # Debe ser v1.22+
psql --version    # Debe ser v13+
ffmpeg -version   # Debe ser v4.4+
```

### **2. Configuración de Base de Datos**

```bash
# Cambiar a usuario postgres
sudo -u postgres psql

-- Crear base de datos y usuario
CREATE DATABASE ondaverificada;
CREATE USER ondauser WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE ondaverificada TO ondauser;
ALTER USER ondauser CREATEDB;
\q
```

### **3. Descargar y Configurar el Proyecto**

```bash
# Descomprimir el proyecto
cd /opt
sudo mkdir ondaverificada
sudo chown $USER:$USER ondaverificada
cd ondaverificada

# Descomprimir archivos (aquí se coloca el .tar.gz)
tar -xzf ondaverificada-complete.tar.gz

# Instalar dependencias
cd app
yarn install
```

### **4. Configuración de Variables de Entorno**

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

**Contenido del .env:**
```env
# Base de datos
DATABASE_URL="postgresql://ondauser:secure_password_here@localhost:5432/ondaverificada"

# Autenticación
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-32-chars-min"

# APIs de IA (Configurar según necesites)
ABACUS_API_KEY="tu-api-key-abacus"
GROQ_API_KEY="tu-api-key-groq"
OPENAI_API_KEY="tu-api-key-openai"

# Google Drive (Opcional)
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# Configuración del servidor
NODE_ENV="production"
PORT="3000"
```

### **5. Configuración de Base de Datos**

```bash
# Generar Prisma Client
yarn prisma generate

# Ejecutar migraciones
yarn prisma db push

# Importar datos iniciales
yarn prisma db seed
```

### **6. Construcción del Proyecto**

```bash
# Construir para producción
yarn build

# Verificar que no hay errores
echo "✅ Build completado exitosamente"
```

---

## 🚀 **Ejecución del Sistema**

### **Modo Desarrollo:**
```bash
cd /opt/ondaverificada/app
yarn dev
```

### **Modo Producción:**
```bash
cd /opt/ondaverificada/app
yarn start
```

### **Usando PM2 (Recomendado):**
```bash
# Instalar PM2
sudo npm install -g pm2

# Iniciar aplicación
pm2 start yarn --name "ondaverificada" -- start

# Configurar inicio automático
pm2 startup
pm2 save
```

---

## 🔧 **Configuración Avanzada**

### **1. APIs Dinámicas**
1. Accede a **Configuración > APIs de Transcripción**
2. Agrega tus proveedores personalizados
3. Configura API keys y modelos
4. Prueba conectividad

### **2. Importación de Radios**
1. Ve a **Radios > Importar 358 Radios**
2. Confirma la importación masiva
3. Verifica que todas las radios estén cargadas

### **3. Google Drive**
1. Configura credenciales en **Configuración > Google Drive**
2. Autoriza acceso a tu cuenta
3. Los audios se almacenarán automáticamente

### **4. Monitoreo**
1. Define frases objetivo en **Frases**
2. Inicia monitoreo desde **Monitoreo**
3. Revisa detecciones en tiempo real

---

## 🌐 **Configuración de Dominio**

### **Con Nginx (Recomendado):**

```nginx
# /etc/nginx/sites-available/ondaverificada
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar configuración
sudo ln -s /etc/nginx/sites-available/ondaverificada /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL con Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## 📊 **Características del Sistema**

### **🎯 Funcionalidades Principales:**

1. **Dashboard Completo**
   - Métricas en tiempo real
   - Gráficos de detecciones
   - Estado de todas las radios
   
2. **Gestión de Radios**
   - 358 radios precargadas de Chile
   - Agregar/editar radios personalizadas
   - Detección automática de plataformas

3. **APIs Dinámicas**
   - Agregar proveedores personalizados
   - Probar conectividad en tiempo real
   - Fallback automático entre proveedores

4. **Sistema de Frases**
   - Gestión de frases publicitarias
   - Detección automática con IA
   - Historial de detecciones

5. **Valorización**
   - Precios por radio y región
   - Reportes de facturación
   - Exportación de datos

6. **Inteligencia Artificial**
   - Simulador de costos
   - Comparación de proveedores
   - Optimización automática

---

## 🔍 **Troubleshooting**

### **Problemas Comunes:**

**Error de conexión a la base de datos:**
```bash
# Verificar estado de PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql
```

**Error de dependencias:**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules yarn.lock
yarn install
```

**Error de permisos:**
```bash
# Ajustar propietario
sudo chown -R $USER:$USER /opt/ondaverificada
```

**FFmpeg no encontrado:**
```bash
# Verificar instalación
which ffmpeg
sudo apt reinstall ffmpeg
```

---

## 📞 **Soporte y Mantenimiento**

### **Logs del Sistema:**
```bash
# PM2 logs
pm2 logs ondaverificada

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### **Backup de Base de Datos:**
```bash
# Crear backup
pg_dump -h localhost -U ondauser ondaverificada > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -h localhost -U ondauser ondaverificada < backup_20240101.sql
```

### **Actualización del Sistema:**
```bash
# Detener aplicación
pm2 stop ondaverificada

# Actualizar código
git pull origin main
yarn install
yarn build

# Migrar base de datos si es necesario
yarn prisma db push

# Reiniciar aplicación
pm2 start ondaverificada
```

---

## ✅ **Verificación Final**

Una vez instalado, verifica que funcione correctamente:

1. ✅ Accede a `http://localhost:3000`
2. ✅ Verifica que cargan las 358 radios
3. ✅ Prueba las APIs de transcripción
4. ✅ Crea una frase de prueba
5. ✅ Inicia un monitoreo de prueba
6. ✅ Revisa que se generan reportes

---

## 📋 **Lista de Archivos Incluidos**

```
ondaverificada-complete/
├── app/                          # Aplicación Next.js completa
│   ├── app/                      # Páginas y API routes
│   ├── components/               # Componentes React
│   ├── lib/                      # Librerías y utilidades
│   ├── public/                   # Archivos estáticos
│   ├── prisma/                   # Esquema y migraciones de BD
│   └── package.json              # Dependencias
├── database/                     # Scripts de base de datos
│   ├── schema.sql               # Esquema completo
│   ├── seeds.sql                # Datos iniciales
│   └── radios_358.sql           # Datos de las 358 radios
├── docs/                        # Documentación completa
│   ├── INSTALLATION_GUIDE.md    # Esta guía
│   ├── API_GUIDE.md            # Guía de APIs
│   ├── USER_MANUAL.md          # Manual de usuario
│   └── ARCHITECTURE.md         # Documentación técnica
├── scripts/                     # Scripts de utilidad
│   ├── install.sh              # Script de instalación automática
│   ├── backup.sh               # Script de backup
│   └── deploy.sh               # Script de deployment
└── README.md                    # Resumen del proyecto
```

---

**🎉 ¡Felicitaciones! Tu sistema OndaVerificada está listo para monitorear publicidad en radios chilenas.**

Para soporte técnico o consultas, revisa la documentación completa en la carpeta `docs/` o contacta al equipo de desarrollo.
