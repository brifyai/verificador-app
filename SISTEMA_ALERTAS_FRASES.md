# Sistema de Alertas de Detección de Frases

## 🎯 Descripción

Sistema automático que detecta la frase específica configurada en el monitoreo y genera **alertas visuales** cuando la encuentra.

## 🔄 Flujo Completo

```
1. Usuario configura monitoreo
   ↓
2. Se guarda frase específica en recording_info.json
   ↓
3. Se graba audio
   ↓
4. Se transcribe con Whisper
   ↓
5. ✨ DETECCIÓN AUTOMÁTICA ✨
   - Lee frase del recording_info.json
   - Busca en la transcripción
   ↓
6. Si encuentra la frase:
   🔔 GENERA ALERTA
   ↓
7. Alerta visible en UI
```

## 📁 Estructura de Archivos

### recording_info.json (Configuración del Monitoreo)

```json
{
  "radioName": "Radio Cooperativa",
  "streamUrl": "https://...",
  "startTime": "2024-10-13T14:30:00.000Z",
  "scheduleId": "schedule_user123_1760062376822",
  "phrase": {
    "id": "phrase_paris",
    "text": "Paris liquidación total hasta agotar stock",
    "brand": "Paris",
    "campaign": "Liquidación Total",
    "category": "PROMOTION",
    "description": "Liquidación de temporada"
  }
}
```

### phrase-detections.json (Resultado de Detección)

```json
{
  "folderName": "Radio_Cooperativa_2024-10-13_14-30-00",
  "timestamp": "2024-10-13T14:35:00.000Z",
  "totalMatches": 2,
  "detections": [
    {
      "phrase": "Paris liquidación total hasta agotar stock",
      "brand": "Paris",
      "campaign": "Liquidación Total",
      "matches": [
        {
          "matchedText": "Paris liquidación total hasta agotar stock",
          "confidence": 1.0,
          "position": 1250,
          "wordPosition": 215,
          "context": "...y ahora Paris liquidación total hasta agotar stock, aprovecha..."
        }
      ]
    }
  ]
}
```

### notifications.json (Alertas Generadas)

```json
{
  "notifications": [
    {
      "id": "notif_1729012345678_abc123",
      "type": "PHRASE_DETECTED",
      "priority": "HIGH",
      "timestamp": "2024-10-13T14:35:00.000Z",
      "read": false,
      "data": {
        "folderName": "Radio_Cooperativa_2024-10-13_14-30-00",
        "phrase": "Paris liquidación total hasta agotar stock",
        "brand": "Paris",
        "campaign": "Liquidación Total",
        "totalMatches": 2,
        "recordingDate": "2024-10-13 14:30:00",
        "radioName": "Radio Cooperativa"
      },
      "message": "¡Frase detectada! \"Paris liquidación total hasta agotar stock\" encontrada 2 vez/veces en Radio Cooperativa"
    }
  ]
}
```

## 🔧 Componentes del Sistema

### 1. PhraseDetector (Modificado)

**Prioridades de búsqueda:**

1. **PRIORIDAD 1**: Frase específica del `recording_info.json`
   - Si existe, busca **solo esa frase**
   - Es la frase que el usuario configuró en el monitoreo

2. **PRIORIDAD 2**: Todas las frases activas de la BD
   - Solo si no hay frase específica
   - Búsqueda general

**Código clave:**
```javascript
// Leer frase específica del monitoreo
const recordingInfoPath = path.join(folderPath, 'recording_info.json');
if (fs.existsSync(recordingInfoPath)) {
  const recordingInfo = JSON.parse(fs.readFileSync(recordingInfoPath, 'utf8'));
  
  if (recordingInfo.phrase && recordingInfo.phrase.text) {
    // Usar SOLO esta frase
    phrasesToSearch = [{
      id: recordingInfo.phrase.id,
      phrase: recordingInfo.phrase.text,
      brand: recordingInfo.phrase.brand,
      campaign: recordingInfo.phrase.campaign,
      confidence: 0.85,
    }];
  }
}
```

### 2. NotificationService (Nuevo)

**Funciones:**
- `createPhraseDetectionAlert()`: Crea alerta cuando se detecta frase
- `getNotifications()`: Obtiene lista de notificaciones
- `markAsRead()`: Marca notificación como leída
- `markAllAsRead()`: Marca todas como leídas
- `getUnreadCount()`: Cuenta notificaciones no leídas
- `cleanOldNotifications()`: Limpia notificaciones antiguas

**Características:**
- Guarda en archivo JSON local
- Mantiene últimas 100 notificaciones
- Logs visuales en consola
- Extrae nombre de radio automáticamente

### 3. API Endpoint `/api/notifications`

**GET**: Obtiene notificaciones
```bash
# Todas las notificaciones
GET /api/notifications

# Solo no leídas
GET /api/notifications?unreadOnly=true

# Limitar resultados
GET /api/notifications?limit=20
```

**PATCH**: Marca como leídas
```bash
# Marcar una específica
PATCH /api/notifications
Body: { "notificationId": "notif_123" }

# Marcar todas
PATCH /api/notifications
Body: { "markAllAsRead": true }
```

**DELETE**: Elimina antiguas
```bash
# Eliminar más de 30 días
DELETE /api/notifications?daysToKeep=30
```

## 🔔 Alertas en Consola

Cuando se detecta una frase, verás:

```
🔔 ═══════════════════════════════════════════════════════
🔔 ¡ALERTA! FRASE DETECTADA
🔔 ═══════════════════════════════════════════════════════
📻 Radio: Radio Cooperativa
💬 Frase: "Paris liquidación total hasta agotar stock"
🏢 Marca: Paris
📢 Campaña: Liquidación Total
🎯 Coincidencias: 2
📅 Fecha: 13/10/2024, 14:30:00
📁 Grabación: Radio_Cooperativa_2024-10-13_14-30-00
🔔 ═══════════════════════════════════════════════════════
```

## 📊 Logs del Sistema

### Durante Transcripción

```
📝 Transcribiendo: Radio_Cooperativa_2024-10-13_14-30-00/audio.mp3
✅ Transcripción completada

🔍 Buscando frases en: Radio_Cooperativa_2024-10-13_14-30-00
   🎯 Frase específica del monitoreo: "Paris liquidación total hasta agotar stock"
   ✓ "Paris liquidación total hasta agotar stock" encontrada 2 vez/veces
   💾 Detecciones guardadas: .../phrase-detections.json

🔔 ═══════════════════════════════════════════════════════
🔔 ¡ALERTA! FRASE DETECTADA
🔔 ═══════════════════════════════════════════════════════
📻 Radio: Radio Cooperativa
💬 Frase: "Paris liquidación total hasta agotar stock"
🏢 Marca: Paris
🎯 Coincidencias: 2
🔔 ═══════════════════════════════════════════════════════

   📊 Total: 2 coincidencias en 1 frases diferentes
   ✅ Detección completada: 2 coincidencias
```

## 🎨 Interfaz de Usuario (Próximo)

### Panel de Notificaciones

- Badge con contador de no leídas
- Lista de alertas recientes
- Detalles de cada detección
- Marcar como leída
- Filtros por fecha/radio/marca

### Ubicación Sugerida

- Header del dashboard (campana con badge)
- Página dedicada `/notificaciones`
- Widget en dashboard principal

## 🧪 Probar el Sistema

### 1. Configurar Monitoreo con Frase

```javascript
// Al crear monitoreo, incluir frase
const monitoringConfig = {
  radioName: "Radio Cooperativa",
  streamUrl: "https://...",
  phrase: {
    id: "phrase_paris",
    text: "Paris liquidación total hasta agotar stock",
    brand: "Paris",
    campaign: "Liquidación Total",
    category: "PROMOTION"
  }
};
```

### 2. Verificar recording_info.json

```bash
cat ./recordings/Radio_Name_2024-10-13_14-30-00/recording_info.json
```

### 3. Ejecutar Transcripción

```bash
cd /root/radio-api
node transcription-manager.js
```

### 4. Ver Notificaciones

```bash
# Ver archivo de notificaciones
cat ./notifications.json

# Ver últimas 5 notificaciones
cat ./notifications.json | jq '.notifications[:5]'

# Contar no leídas
cat ./notifications.json | jq '[.notifications[] | select(.read == false)] | length'
```

### 5. Probar API

```bash
# Obtener notificaciones
curl http://localhost:3000/api/notifications

# Solo no leídas
curl http://localhost:3000/api/notifications?unreadOnly=true

# Marcar como leída
curl -X PATCH http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"notificationId": "notif_123"}'

# Marcar todas como leídas
curl -X PATCH http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"markAllAsRead": true}'
```

## 🔍 Ventajas del Sistema

1. **Frase Específica**: Busca exactamente lo que el usuario configuró
2. **Alertas Inmediatas**: Notificación segundos después de la detección
3. **Contexto Completo**: Muestra dónde y cuándo se encontró
4. **Histórico**: Mantiene registro de todas las detecciones
5. **No Intrusivo**: No bloquea el proceso de transcripción
6. **Escalable**: Maneja múltiples monitoreos simultáneos

## 📝 Casos de Uso

### 1. Verificación de Pauta Publicitaria

**Escenario**: Cliente contrató spot de "Paris Liquidación"

**Flujo:**
1. Configurar monitoreo con frase exacta
2. Sistema graba y transcribe
3. Detecta frase automáticamente
4. Genera alerta inmediata
5. Cliente recibe confirmación

### 2. Monitoreo de Competencia

**Escenario**: Monitorear menciones de marca competidora

**Flujo:**
1. Configurar frase de competidor
2. Sistema detecta menciones
3. Alertas en tiempo real
4. Análisis de frecuencia

### 3. Compliance Publicitario

**Escenario**: Verificar cumplimiento de contrato

**Flujo:**
1. Frase contractual configurada
2. Detección automática
3. Evidencia con timestamp
4. Reporte para facturación

## 🚨 Solución de Problemas

### No se generan alertas

**Verificar:**
1. ¿Existe `recording_info.json` en la carpeta?
2. ¿Tiene el campo `phrase.text`?
3. ¿La frase está en la transcripción?

```bash
# Verificar recording_info.json
cat ./recordings/Radio_Name_*/recording_info.json | jq '.phrase'

# Buscar manualmente en transcripción
grep -i "paris" ./recordings/Radio_Name_*/transcription.txt
```

### Alertas duplicadas

**Causa**: Múltiples ejecuciones del detector

**Solución**: El sistema evita reprocesar si ya existe `phrase-detections.json`

### No se ven en la UI

**Próximo paso**: Implementar componente de notificaciones en el frontend

## 📊 Métricas

### Desde el VPS

```bash
# Total de notificaciones
cat notifications.json | jq '.notifications | length'

# No leídas
cat notifications.json | jq '[.notifications[] | select(.read == false)] | length'

# Por marca
cat notifications.json | jq '[.notifications[] | .data.brand] | group_by(.) | map({brand: .[0], count: length})'

# Últimas 24 horas
cat notifications.json | jq --arg date "$(date -d '24 hours ago' -Iseconds)" '[.notifications[] | select(.timestamp > $date)]'
```

## 🎯 Próximos Pasos

- [ ] Componente UI de notificaciones
- [ ] Badge en header con contador
- [ ] Sonido de alerta (opcional)
- [ ] Email/SMS cuando se detecta (opcional)
- [ ] Dashboard de métricas de detecciones
- [ ] Exportar reporte de detecciones

## 🆘 Soporte

Para problemas:
1. Revisar logs de consola
2. Verificar `recording_info.json`
3. Verificar `phrase-detections.json`
4. Verificar `notifications.json`
5. Probar API manualmente

---

**Sistema completamente funcional y listo para usar** 🎉
