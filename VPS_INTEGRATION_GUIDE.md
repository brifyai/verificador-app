# 📡 Guía de Integración VPS - Sistema de Monitoreo

## 🎯 Resumen
Este documento describe cómo el VPS debe manejar los comandos de control de monitoreo (pausar, reanudar, detener).

---

## 📋 Estructura de Datos

### 1. **Creación de Schedule (POST /api/schedule)**

Cuando se crea un nuevo monitoreo, el VPS recibe:

```json
{
  "userId": "cmgay1a3y0000v00gqyocxq97",
  "status": "ACTIVE",
  "radios": [
    {
      "id": "radio_futuro",
      "name": "Futuro 88.9",
      "streamUrl": "https://sonic.streamingchilenos.com/8192/stream",
      "region": "Antofagasta"
    }
  ],
  "sessions": [
    {
      "sessionId": "cmgl8uxxx001nv0noat0ta2hf",
      "radioId": "radio_futuro",
      "radioName": "Futuro 88.9"
    }
  ],
  "days": [5, 6, 0],
  "schedule": {
    "startTime": "00:00",
    "endTime": "02:00",
    "duration": 7200
  },
  "phrase": {
    "id": "phrase_paris",
    "text": "Paris liquidación total",
    "brand": "Paris",
    "campaign": "Cyber Monday 2025"
  },
  "detection": {
    "aiModel": "whisper-large-v3",
    "language": "es",
    "autoTranscription": true,
    "phraseDetection": true
  }
}
```

**El VPS debe:**
- ✅ Guardar el schedule con `status: "ACTIVE"`
- ✅ Guardar los `sessionId` para cada radio
- ✅ Iniciar las grabaciones y transcripciones según el horario

---

## 🎮 Comandos de Control

### 2. **PAUSAR Monitoreo (POST /api/pause-schedule)**

```json
{
  "sessionId": "cmgl8uxxx001nv0noat0ta2hf",
  "radioId": "radio_futuro",
  "userId": "cmgay1a3y0000v00gqyocxq97",
  "action": "pause",
  "status": "PAUSED"
}
```

**El VPS debe:**
- ✅ Buscar el schedule por `sessionId`
- ✅ Actualizar `status: "PAUSED"`
- ✅ **DETENER** las grabaciones activas
- ✅ **DETENER** las transcripciones en proceso
- ✅ Mantener el schedule guardado (NO eliminarlo)
- ✅ Responder con confirmación

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Schedule pausado correctamente",
  "sessionId": "cmgl8uxxx001nv0noat0ta2hf",
  "status": "PAUSED"
}
```

---

### 3. **REANUDAR Monitoreo (POST /api/resume-schedule)**

```json
{
  "sessionId": "cmgl8uxxx001nv0noat0ta2hf",
  "radioId": "radio_futuro",
  "userId": "cmgay1a3y0000v00gqyocxq97",
  "action": "resume",
  "status": "ACTIVE"
}
```

**El VPS debe:**
- ✅ Buscar el schedule por `sessionId`
- ✅ Actualizar `status: "ACTIVE"`
- ✅ **REINICIAR** las grabaciones según el horario
- ✅ **REINICIAR** las transcripciones automáticas
- ✅ Responder con confirmación

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Schedule reanudado correctamente",
  "sessionId": "cmgl8uxxx001nv0noat0ta2hf",
  "status": "ACTIVE"
}
```

---

### 4. **DETENER y ELIMINAR Monitoreo (POST /api/stop-schedule)**

```json
{
  "sessionId": "cmgl8uxxx001nv0noat0ta2hf",
  "radioId": "radio_futuro",
  "userId": "cmgay1a3y0000v00gqyocxq97",
  "action": "stop"
}
```

**El VPS debe:**
- ✅ Buscar el schedule por `sessionId`
- ✅ **DETENER** todas las grabaciones activas
- ✅ **DETENER** todas las transcripciones en proceso
- ✅ **ELIMINAR** el archivo de configuración del schedule
- ✅ **ELIMINAR** el schedule de la memoria/BD del VPS
- ✅ Limpiar recursos asociados
- ✅ Responder con confirmación y estadísticas

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Schedule detenido y eliminado correctamente",
  "sessionId": "cmgl8uxxx001nv0noat0ta2hf",
  "stats": {
    "totalRecordings": 45,
    "totalTranscriptions": 42,
    "duration": "2 horas 15 minutos"
  }
}
```

---

## 🔄 Lógica de Verificación de Status

El VPS debe verificar el `status` antes de cada operación:

```javascript
// Pseudocódigo
function shouldRecord(schedule) {
  if (schedule.status !== 'ACTIVE') {
    console.log('⏸️ Schedule pausado, no grabar');
    return false;
  }
  
  // Verificar horario
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  if (!schedule.days.includes(currentDay)) {
    return false;
  }
  
  // Verificar rango de horas
  const [startHour] = schedule.schedule.startTime.split(':');
  const [endHour] = schedule.schedule.endTime.split(':');
  
  if (currentHour >= startHour && currentHour < endHour) {
    return true;
  }
  
  return false;
}
```

---

## 📁 Estructura de Archivos en VPS

Sugerencia de estructura:

```
/schedules/
  ├── schedule_user123_1760124622206.json  ← Archivo de configuración
  ├── schedule_user123_1760124622206.status ← Estado actual (ACTIVE/PAUSED)
  └── ...

/recordings/
  ├── cmgl8uxxx001nv0noat0ta2hf/  ← Por sessionId
  │   ├── 2025-10-12_14-30-00.mp3
  │   ├── 2025-10-12_14-30-30.mp3
  │   └── ...
  └── ...

/transcriptions/
  ├── cmgl8uxxx001nv0noat0ta2hf/  ← Por sessionId
  │   ├── 2025-10-12_14-30-00.txt
  │   └── ...
  └── ...
```

---

## ✅ Checklist de Implementación VPS

- [ ] Guardar `sessionId` en cada schedule
- [ ] Implementar endpoint `/api/pause-schedule`
- [ ] Implementar endpoint `/api/resume-schedule`
- [ ] Implementar endpoint `/api/stop-schedule`
- [ ] Verificar `status` antes de grabar
- [ ] Detener grabaciones cuando status = PAUSED
- [ ] Eliminar archivos cuando se recibe STOP
- [ ] Responder con confirmaciones apropiadas
- [ ] Manejar timeouts (5 segundos)
- [ ] Logging detallado de operaciones

---

## 🧪 Pruebas

### Escenario 1: Pausar y Reanudar
1. Crear monitoreo → status: ACTIVE
2. Pausar → status: PAUSED, grabaciones detenidas
3. Reanudar → status: ACTIVE, grabaciones reiniciadas

### Escenario 2: Detener
1. Crear monitoreo → status: ACTIVE
2. Detener → Schedule eliminado, archivos limpiados

### Escenario 3: Múltiples Radios
1. Crear monitoreo con 3 radios
2. Pausar → Las 3 radios se pausan
3. Detener → Las 3 radios se eliminan

---

## 📞 Contacto

Si tienes dudas sobre la integración, revisa los logs del servidor Next.js que muestran exactamente qué datos se están enviando al VPS.

**Endpoints del VPS esperados:**
- `http://173.249.26.38:3000/api/schedule` (POST - crear)
- `http://173.249.26.38:3000/api/pause-schedule` (POST - pausar)
- `http://173.249.26.38:3000/api/resume-schedule` (POST - reanudar)
- `http://173.249.26.38:3000/api/stop-schedule` (POST - detener/eliminar)
