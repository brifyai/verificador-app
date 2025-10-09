# VPS Radio Recording System v2.0

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
- `POST /api/schedule` - Crear nueva programación
- `GET /api/schedules` - Ver todas las programaciones
- `DELETE /api/scheduler/remove/:scheduleId` - Eliminar programación

### Monitoreo
- `GET /api/scheduler/status` - Estado del scheduler
- `GET /api/recordings/active` - Grabaciones activas
- `POST /api/scheduler/stop/:recordingId` - Detener grabación

### Grabación Manual
- `POST /api/record/start` - Iniciar grabación manual

## 🛠️ Instalación

1. **Clonar archivos en VPS**:
   ```bash
   cd /root/radio-api
   ```

2. **Ejecutar script de despliegue**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Verificar instalación**:
   ```bash
   curl http://localhost:3000/
   ```

## 📋 Estructura de Programación

```json
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
```

## 🔧 Comandos Útiles

```bash
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
```

## 📁 Estructura de Archivos

```
/root/radio-api/
├── server.js          # Servidor principal
├── scheduler.js       # Sistema de programación
├── package.json       # Dependencias
├── config/           # Programaciones guardadas
├── recordings/       # Archivos de audio
└── logs/            # Logs del sistema
```

## 🐛 Solución de Problemas

### El servicio no inicia
```bash
journalctl -u radio-recording --no-pager -n 50
```

### Grabaciones fallan
1. Verificar que ffmpeg esté instalado: `which ffmpeg`
2. Probar URL manualmente: `ffmpeg -i <stream-url> -t 10 test.mp3`
3. Verificar permisos en directorio recordings

### Puerto ocupado
```bash
netstat -tlnp | grep :3000
kill <PID>
```

## 📊 Monitoreo

El sistema incluye logs detallados y métricas:
- Grabaciones programadas y ejecutadas
- Errores de streams
- Estado de programaciones
- Uso de recursos

---
**Versión**: 2.0.0  
**Última actualización**: 07-10-2025
