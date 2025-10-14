# Setup Completo - Sistema de Detección con IA

## 📋 Resumen del Sistema

El sistema permite que cada usuario:
1. Configure sus API keys de IA en `/configuracion`
2. Seleccione qué IA usar al crear un monitoreo
3. El sistema detecta frases automáticamente con la IA seleccionada
4. Marca para verificación humana si la confianza es < 90%

## 🔄 Flujo Completo

```
1. Usuario configura IAs en /configuracion
   ↓
2. Se guarda en api_providers.json
   {
     "id": "openai-gpt",
     "apiKey": "sk-...",
     "enabled": true
   }
   ↓
3. Usuario crea monitoreo y selecciona IA
   {
     "phraseId": "phrase_123",
     "aiProvider": "openai-gpt"
   }
   ↓
4. API envía a VPS con aiProvider
   {
     "userId": "user_123",
     "aiProvider": "openai-gpt",
     "phrase": {...}
   }
   ↓
5. VPS guarda en recording_info.json
   {
     "userId": "user_123",
     "aiProvider": "openai-gpt",
     "phrase": {...}
   }
   ↓
6. Se transcribe el audio
   ↓
7. phrase-detector.js lee recording_info.json
   ↓
8. Carga config de "openai-gpt" desde api_providers.json
   ↓
9. Busca frase con IA seleccionada
   ↓
10. Guarda resultado con flag needsVerification
```

## 📁 Archivos Modificados

### 1. Frontend (Next.js)

#### `app/api/monitoring/start/route.ts`
✅ **Modificado** - Ahora recibe y envía `aiProvider`

```typescript
const { aiProvider } = body;

const scheduleData = {
  userId: userId,
  aiProvider: aiProvider || null,
  phrase: {...},
  ...
};
```

### 2. VPS (Node.js)

#### `enhanced-scheduler.js`
✅ **Modificado** - Recibe `aiProvider` y lo pasa a `startRecording()`

```javascript
async executeScheduledRecordings(scheduleData) {
  const { userId, aiProvider } = scheduleData;
  
  this.startRecording(radio, duration, scheduleId, phrase, userId, aiProvider);
}

startRecording(radio, duration, scheduleId, phrase, userId, aiProvider) {
  const metadata = {
    userId: userId,
    aiProvider: aiProvider,
    phrase: phrase,
    ...
  };
}
```

#### `phrase-detector.js`
✅ **Modificado** - Lee de `api_providers.json` en lugar de BD

```javascript
async loadUserAIConfig(userId, selectedProvider) {
  // Lee api_providers.json
  const providersData = JSON.parse(fs.readFileSync('api_providers.json'));
  
  // Busca el proveedor seleccionado
  const providerConfig = providersData.find(p => 
    p.id === selectedProvider && 
    p.type === 'analysis' && 
    p.enabled === true
  );
  
  // Usa su API key
  this.aiConfig = {
    provider: selectedProvider,
    apiKey: providerConfig.apiKey,
    ...
  };
}
```

### 3. Configuración

#### `data/api_providers.json`
✅ **Actualizado** - Agregados proveedores de análisis

```json
[
  {
    "id": "openai-gpt",
    "name": "OpenAI GPT",
    "type": "analysis",
    "models": [
      {
        "id": "gpt-4o-mini",
        "name": "GPT-4o Mini"
      }
    ],
    "enabled": false,
    "apiKey": ""
  },
  {
    "id": "anthropic-claude",
    "name": "Anthropic Claude",
    "type": "analysis",
    ...
  },
  {
    "id": "groq-llama",
    "name": "Groq Llama",
    "type": "analysis",
    ...
  }
]
```

## 🚀 Pasos de Instalación

### 1. Actualizar Archivos en el Proyecto

```bash
# Los archivos ya están modificados en tu proyecto local
# Solo necesitas subirlos al VPS
```

### 2. Subir Archivos al VPS

```powershell
# Desde tu máquina local (PowerShell)

# 1. Subir phrase-detector.js
scp "d:\Trabajo Radios\repositorio-2\ProyectoOndaVerificada\app\vps\phrase-detector.js" root@173.249.26.38:/root/radio-api/

# 2. Subir enhanced-scheduler.js
scp "d:\Trabajo Radios\repositorio-2\ProyectoOndaVerificada\app\vps\enhanced-scheduler.js" root@173.249.26.38:/root/radio-api/

# 3. Subir api_providers.json
scp "d:\Trabajo Radios\repositorio-2\ProyectoOndaVerificada\app\data\api_providers.json" root@173.249.26.38:/root/radio-api/
```

### 3. Configurar IAs en el VPS

```bash
# En el VPS
cd /root/radio-api

# Editar api_providers.json
nano api_providers.json
```

Habilitar y configurar las IAs que quieras usar:

```json
{
  "id": "openai-gpt",
  "name": "OpenAI GPT",
  "type": "analysis",
  "enabled": true,  ← Cambiar a true
  "apiKey": "sk-proj-tu-api-key-aqui",  ← Agregar tu key
  ...
}
```

### 4. Instalar Dependencias

```bash
cd /root/radio-api

# Instalar axios (para llamadas a APIs de IA)
npm install axios

# Verificar instalación
npm list axios
```

### 5. Reiniciar Servicios

```bash
# Reiniciar el scheduler
pm2 restart scheduler

# Ver logs
pm2 logs scheduler
```

## 🧪 Prueba Completa

### 1. Configurar IA en la UI

1. Ir a `/configuracion`
2. En la sección de IAs, agregar API key de OpenAI
3. Habilitar el proveedor
4. Guardar

### 2. Crear Monitoreo de Prueba

1. Ir a `/monitoreo/nuevo`
2. Seleccionar una radio
3. Seleccionar una frase
4. **Seleccionar IA**: OpenAI GPT
5. Configurar horario
6. Iniciar monitoreo

### 3. Verificar en el VPS

```bash
# Ver logs del scheduler
pm2 logs scheduler

# Deberías ver:
# 🤖 IA seleccionada: openai-gpt
# ✅ Grabación iniciada: Radio_Name_2024-10-13_15-00-00
```

### 4. Verificar recording_info.json

```bash
# Buscar la última grabación
cd /root/radio-api/recordings
ls -lt | head -5

# Ver el recording_info.json
cat Radio_Name_2024-10-13_15-00-00/recording_info.json

# Debe contener:
# {
#   "userId": "user_123",
#   "aiProvider": "openai-gpt",
#   "phrase": {
#     "text": "Coca Cola",
#     "brand": "Coca Cola"
#   }
# }
```

### 5. Simular Transcripción y Detección

```bash
cd /root/radio-api

# Crear transcripción de prueba con error intencional
mkdir -p recordings/Test_IA_2024-10-13_17-00-00

# recording_info.json
cat > recordings/Test_IA_2024-10-13_17-00-00/recording_info.json << 'EOF'
{
  "userId": "user_test",
  "aiProvider": "openai-gpt",
  "radioName": "Test Radio",
  "phrase": {
    "text": "Coca Cola la chispa de la vida",
    "brand": "Coca Cola"
  }
}
EOF

# transcription.txt con error (falta "la")
cat > recordings/Test_IA_2024-10-13_17-00-00/transcription.txt << 'EOF'
Buenos días, ahora un mensaje de Coca Cola chispa de vida.
EOF

# Ejecutar detector
node phrase-detector.js
```

### 6. Verificar Resultado

```bash
# Ver logs
# Deberías ver:
# 🔍 Buscando frases en: Test_IA_2024-10-13_17-00-00
#    🤖 IA seleccionada por el usuario: openai-gpt
#    📥 Cargando configuración de IA (openai-gpt)...
#    🤖 IA configurada: openai-gpt (gpt-4o-mini)
#    🔍 Buscando: "Coca Cola la chispa de la vida"...
#    🤖 No se encontró coincidencia exacta, verificando con IA...
#    🤖 IA encontró 1 coincidencia(s) aproximada(s)
#       1. "Coca Cola chispa de vida" (confianza: 85%)
#          ⚠️ Requiere verificación humana

# Ver resultado guardado
cat recordings/Test_IA_2024-10-13_17-00-00/phrase-detections.json | jq
```

## 📊 Estructura de Datos

### recording_info.json (VPS)

```json
{
  "recordingId": "schedule_user_123_1697234567890",
  "userId": "user_123",
  "aiProvider": "openai-gpt",
  "radio": {
    "id": "radio_cooperativa",
    "name": "Radio Cooperativa",
    "streamUrl": "https://..."
  },
  "scheduleId": "schedule_123",
  "phrase": {
    "id": "phrase_cocacola",
    "text": "Coca Cola la chispa de la vida",
    "brand": "Coca Cola",
    "campaign": "Chispa de la Vida"
  },
  "recording": {
    "startTime": "2024-10-13T15:00:00.000Z",
    "duration": 3600,
    "filename": "audio.mp3",
    "folderName": "Radio_Cooperativa_2024-10-13_15-00-00"
  },
  "transcription": {
    "scheduled": true,
    "status": "pending"
  },
  "status": "recording"
}
```

### phrase-detections.json (VPS)

```json
{
  "folderName": "Radio_Cooperativa_2024-10-13_15-00-00",
  "timestamp": "2024-10-13T18:30:00.000Z",
  "totalMatches": 1,
  "detections": [
    {
      "phrase": "Coca Cola la chispa de la vida",
      "brand": "Coca Cola",
      "campaign": "Chispa de la Vida",
      "hasAIMatches": true,
      "needsVerification": true,
      "matches": [
        {
          "matchedText": "Coca Cola chispa de vida",
          "confidence": 0.85,
          "position": 1250,
          "wordPosition": 0,
          "context": "...ahora un mensaje de Coca Cola chispa de vida...",
          "verifiedBy": "AI",
          "aiReason": "Coincidencia alta pero falta 'la' en la frase",
          "needsHumanVerification": true
        }
      ]
    }
  ]
}
```

## 🔍 Verificación de Funcionamiento

### Checklist

- [ ] `api_providers.json` copiado al VPS
- [ ] Al menos una IA configurada con `enabled: true` y `apiKey`
- [ ] `phrase-detector.js` actualizado en el VPS
- [ ] `enhanced-scheduler.js` actualizado en el VPS
- [ ] `axios` instalado en el VPS
- [ ] Servicios reiniciados con `pm2 restart`
- [ ] UI permite seleccionar IA al crear monitoreo
- [ ] API envía `aiProvider` al VPS
- [ ] VPS guarda `aiProvider` en `recording_info.json`
- [ ] `phrase-detector.js` lee y usa la IA correcta

### Comandos de Verificación

```bash
# 1. Verificar archivos
ls -la /root/radio-api/api_providers.json
ls -la /root/radio-api/phrase-detector.js
ls -la /root/radio-api/enhanced-scheduler.js

# 2. Verificar que api_providers.json tiene IAs habilitadas
cat /root/radio-api/api_providers.json | jq '.[] | select(.type == "analysis" and .enabled == true)'

# 3. Verificar axios instalado
npm list axios

# 4. Ver logs en tiempo real
pm2 logs scheduler --lines 50

# 5. Probar detector manualmente
cd /root/radio-api
node phrase-detector.js
```

## 🚨 Solución de Problemas

### Error: "Cannot find module 'axios'"

```bash
cd /root/radio-api
npm install axios
```

### Error: "No se encontró archivo api_providers.json"

```bash
# Verificar que existe
ls -la /root/radio-api/api_providers.json

# Si no existe, copiarlo
scp "d:\Trabajo Radios\repositorio-2\ProyectoOndaVerificada\app\data\api_providers.json" root@173.249.26.38:/root/radio-api/
```

### IA no se está usando

```bash
# Verificar que hay proveedores habilitados
cat /root/radio-api/api_providers.json | jq '.[] | select(.type == "analysis" and .enabled == true) | {id, enabled, hasKey: (.apiKey != null and .apiKey != "")}'

# Debe mostrar al menos un proveedor con:
# {
#   "id": "openai-gpt",
#   "enabled": true,
#   "hasKey": true
# }
```

### Detecciones no aparecen en la UI

Verificar que:
1. `phrase-detections.json` se está creando
2. El archivo tiene `needsVerification: true`
3. La UI está consultando el endpoint correcto

## ✅ Sistema Listo

Una vez completados todos los pasos:

1. ✅ Usuario configura IAs en `/configuracion`
2. ✅ Usuario selecciona IA al crear monitoreo
3. ✅ Sistema guarda `aiProvider` en `recording_info.json`
4. ✅ Detector usa la IA seleccionada automáticamente
5. ✅ Detecta frases con variaciones y errores
6. ✅ Marca para verificación humana si confianza < 90%
7. ✅ Todo sin necesidad de base de datos en el VPS

**Sistema completamente funcional** 🎉
