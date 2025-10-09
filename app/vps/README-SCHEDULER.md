# 🚀 Advanced Radio Scheduler System

Sistema avanzado de programación automática para monitoreo de radios con soporte para múltiples días y horarios.

## 🌟 Características Principales

- ✅ **Scheduler Automático**: Ejecuta monitoreos en días y horarios específicos
- ✅ **Múltiples Programaciones**: Maneja muchos monitoreos simultáneos
- ✅ **Detección Inteligente**: Verifica automáticamente nuevas programaciones
- ✅ **Grabaciones Automáticas**: Usa FFmpeg para grabar streams de radio
- ✅ **API REST Completa**: Endpoints para gestionar programaciones
- ✅ **Logs Detallados**: Sistema de logging avanzado
- ✅ **Manejo de Errores**: Recuperación automática de fallos
- ✅ **Limpieza Automática**: Elimina archivos antiguos

## 📁 Estructura de Archivos

```
vps/
├── advanced-scheduler.js      # Scheduler principal con lógica avanzada
├── main-server.js            # Servidor Express con API REST
├── start-vps.js             # Script de inicio con verificaciones
├── test-advanced-scheduler.js # Tests automáticos
├── package.json             # Dependencias actualizadas
├── config/                  # Archivos de programación (.json)
├── recordings/              # Grabaciones de audio (.mp3)
└── logs/                   # Logs del sistema
```

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd vps/
npm install
```

### 2. Instalar FFmpeg (Requerido para grabaciones)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**CentOS/RHEL:**
```bash
sudo yum install ffmpeg
```

**Windows:**
- Descargar desde: https://ffmpeg.org/download.html
- Agregar al PATH del sistema

### 3. Verificar Instalación

```bash
npm run check
ffmpeg -version
```

## 🎯 Uso del Sistema

### Iniciar el Servidor

```bash
# Inicio completo con verificaciones
npm start

# Solo desarrollo (sin verificaciones)
npm run dev

# Servidor legacy (anterior)
npm run legacy
```

### Crear Programaciones de Prueba

```bash
node test-advanced-scheduler.js
```

## 📡 API Endpoints

### Health Check
```http
GET /
```

### Recibir Nueva Programación
```http
POST /api/schedule
Content-Type: application/json

{
  "userId": "user123",
  "radios": [
    {
      "id": "radio_1",
      "name": "Radio Cooperativa",
      "streamUrl": "http://stream-url.com/stream",
      "region": "RM",
      "hasValidUrl": true
    }
  ],
  "days": [1, 2, 3, 4, 5],
  "schedule": {
    "startTime": "08:00",
    "endTime": "08:30",
    "duration": 1800
  },
  "phrase": {
    "id": "phrase_1",
    "text": "Radio Cooperativa",
    "brand": "Cooperativa",
    "campaign": "Brand Recognition"
  }
}
```

### Estado del Scheduler
```http
GET /api/status
```

### Grabaciones Activas
```http
GET /api/recordings/active
```

### Programaciones Activas
```http
GET /api/schedules
```

### Detener Grabación
```http
POST /api/recordings/{recordingId}/stop
```

### Eliminar Programación
```http
DELETE /api/schedules/{scheduleId}
```

### Logs de Grabaciones
```http
GET /api/recordings/logs
```

## ⏰ Formato de Días

El sistema usa números para los días de la semana:

- `0` = Domingo
- `1` = Lunes  
- `2` = Martes
- `3` = Miércoles
- `4` = Jueves
- `5` = Viernes
- `6` = Sábado

### Ejemplos de Programación

**Lunes a Viernes:**
```json
"days": [1, 2, 3, 4, 5]
```

**Solo Fines de Semana:**
```json
"days": [6, 0]
```

**Días Específicos:**
```json
"days": [1, 3, 5]
```

## 🕐 Formato de Horarios

Los horarios usan formato 24 horas (HH:MM):

```json
{
  "startTime": "08:00",  // 8:00 AM
  "endTime": "20:30",    // 8:30 PM
  "duration": 45000      // 12.5 horas en segundos
}
```

### Horarios que Cruzan Medianoche

El sistema maneja automáticamente horarios como:
```json
{
  "startTime": "23:00",  // 11:00 PM
  "endTime": "02:00",    // 2:00 AM del día siguiente
  "duration": 10800      // 3 horas
}
```

## 📊 Monitoreo y Logs

### Ver Estado en Tiempo Real

```bash
# Logs del sistema
tail -f logs/vps-$(date +%Y-%m-%d).log

# Estado via API
curl http://localhost:3000/api/status | jq

# Grabaciones activas
curl http://localhost:3000/api/recordings/active | jq
```

### Archivos de Configuración

Las programaciones se guardan en `config/` con formato:
```
schedule_userId_timestamp.json
```

Ejemplo: `schedule_user123_1699123456789.json`

### Archivos de Grabación

Las grabaciones se guardan en `recordings/` con formato:
```
RadioName_YYYY-MM-DDTHH-MM-SS.mp3
```

Ejemplo: `Radio_Cooperativa_2024-10-08T08-00-00.mp3`

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# Puerto del servidor (default: 3000)
export PORT=3000

# Zona horaria (default: America/Santiago)
export TZ=America/Santiago

# Nivel de logs (default: info)
export LOG_LEVEL=debug
```

### Configuración de FFmpeg

El sistema usa estos parámetros por defecto:
```bash
ffmpeg -i {streamUrl} \
  -t {duration} \
  -acodec mp3 \
  -ab 128k \
  -ar 44100 \
  -reconnect 1 \
  -reconnect_streamed 1 \
  -reconnect_delay_max 5 \
  -y {outputFile}
```

## 🚨 Solución de Problemas

### Error: FFmpeg no encontrado
```bash
# Verificar instalación
which ffmpeg
ffmpeg -version

# Instalar si falta
sudo apt install ffmpeg  # Ubuntu/Debian
```

### Error: Puerto en uso
```bash
# Verificar qué proceso usa el puerto
lsof -i :3000

# Cambiar puerto
PORT=3001 npm start
```

### Error: Permisos de archivos
```bash
# Dar permisos a directorios
chmod 755 config/ recordings/ logs/
chmod 644 config/*.json
```

### Grabaciones no se inician
1. Verificar que FFmpeg esté instalado
2. Verificar que las URLs de stream sean válidas
3. Revisar logs para errores específicos
4. Probar manualmente: `ffmpeg -i {streamUrl} -t 10 test.mp3`

### Programaciones no se ejecutan
1. Verificar formato de días (0-6)
2. Verificar formato de horarios (HH:MM)
3. Verificar zona horaria del sistema
4. Revisar logs del scheduler

## 📈 Optimización y Rendimiento

### Limpieza Automática

El sistema limpia automáticamente:
- Archivos de grabación > 7 días
- Logs > 30 días
- Cache de programaciones obsoletas

### Límites Recomendados

- **Grabaciones simultáneas**: Máximo 50
- **Programaciones activas**: Máximo 200
- **Duración por grabación**: Máximo 24 horas
- **Tamaño de archivo**: Máximo 500MB por grabación

### Monitoreo de Recursos

```bash
# Uso de CPU y memoria
htop

# Espacio en disco
df -h

# Procesos FFmpeg activos
ps aux | grep ffmpeg
```

## 🔐 Seguridad

### Recomendaciones

1. **Firewall**: Solo abrir puerto necesario (3000)
2. **SSL/TLS**: Usar HTTPS en producción
3. **Autenticación**: Implementar tokens de API
4. **Rate Limiting**: Limitar requests por IP
5. **Logs**: No logear información sensible

### Ejemplo de Configuración Nginx

```nginx
server {
    listen 80;
    server_name your-vps-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📞 Soporte y Mantenimiento

### Comandos Útiles

```bash
# Estado del servicio
npm run status

# Reiniciar servicio
npm run restart

# Ver logs en tiempo real
npm run logs

# Test completo del sistema
node test-advanced-scheduler.js
```

### Backup de Configuraciones

```bash
# Backup diario
tar -czf backup-$(date +%Y%m%d).tar.gz config/ recordings/

# Restaurar backup
tar -xzf backup-20241008.tar.gz
```

---

## 📝 Changelog

### v3.0.0 - Advanced Scheduler
- ✅ Scheduler automático con cron jobs
- ✅ Soporte para múltiples días y horarios
- ✅ API REST completa
- ✅ Sistema de logs avanzado
- ✅ Manejo robusto de errores
- ✅ Tests automáticos

### v2.0.0 - Basic Scheduler
- ✅ Scheduler básico
- ✅ Grabaciones con FFmpeg

### v1.0.0 - Initial Release
- ✅ API básica para recibir programaciones

---

**¿Necesitas ayuda?** Revisa los logs en `logs/` o ejecuta `node test-advanced-scheduler.js` para verificar el sistema.
