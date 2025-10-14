# API Endpoints Documentation - OndaVerificada Sistema Completo

## 📋 Resumen General

Este documento detalla todos los endpoints API disponibles en el sistema OndaVerificada, organizados por funcionalidad y con ejemplos de uso.

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante NextAuth.js. Las rutas están protegidas y requieren una sesión válida.

---

## 📻 Radios API

### GET `/api/radios`
**Descripción**: Obtiene la lista de radios con paginación y filtros
**Parámetros de consulta**:
- `limit` (opcional): Número máximo de resultados (default: 500)
- `page` (opcional): Página para paginación
- `search` (opcional): Búsqueda por nombre
- `region` (opcional): Filtrar por región
- `active` (opcional): Filtrar por estado activo

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "radio_id",
      "name": "Radio Cooperativa",
      "programadora": "Cooperativa",
      "frequency": "93.3 FM",
      "streamUrl": "https://...",
      "streamPlatform": "icecast",
      "region": "Metropolitana",
      "city": "Santiago",
      "website": "https://...",
      "isActive": true,
      "lastMonitored": "2024-01-01T00:00:00Z",
      "genre": "Noticias",
      "pricePerDetection": 1500,
      "pricingRuleId": "rule_id",
      "priceHistory": [],
      "monitoring_enabled": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 500,
    "totalPages": 1
  }
}
```

### GET `/api/radios/[id]`
**Descripción**: Obtiene una radio específica por ID

### POST `/api/radios`
**Descripción**: Crea una nueva radio
**Body**:
```json
{
  "name": "Nueva Radio",
  "streamUrl": "https://stream.url",
  "streamPlatform": "icecast",
  "region": "Valparaíso",
  "city": "Viña del Mar",
  "frequency": "101.5 FM",
  "genre": "Musical",
  "website": "https://radio.com"
}
```

### PUT `/api/radios/[id]`
**Descripción**: Actualiza una radio existente

### DELETE `/api/radios/[id]`
**Descripción**: Elimina una radio

### POST `/api/radios/import-bulk`
**Descripción**: Importación masiva de radios desde archivo CSV/Excel

---

## 👥 Usuarios API

### GET `/api/usuarios`
**Descripción**: Obtiene la lista de usuarios del sistema
**Parámetros de consulta**:
- `limit` (opcional): Número máximo de resultados
- `page` (opcional): Página para paginación
- `search` (opcional): Búsqueda por nombre o email
- `role` (opcional): Filtrar por rol

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "email": "usuario@email.com",
      "name": "Usuario Ejemplo",
      "role": "USER",
      "active": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "totalSessions": 5
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### PATCH `/api/usuarios/[id]/toggle-status`
**Descripción**: Activa o desactiva un usuario

---

## 📝 Frases API

### GET `/api/phrases`
**Descripción**: Obtiene la lista de frases publicitarias

### GET `/api/phrases/search`
**Descripción**: Busca frases clave en archivos de transcripción de grabaciones
**Parámetros de consulta**:
- `phraseIds` (opcional): IDs de frases específicas separados por coma
- `recordingsDir` (opcional): Directorio de grabaciones (default: './recordings')

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "totalFolders": 10,
    "foldersWithMatches": 5,
    "totalMatches": 15,
    "phraseStats": [
      {
        "phraseId": "phrase_id",
        "phrase": "Coca Cola",
        "brand": "Coca Cola",
        "matchCount": 8
      }
    ],
    "results": [
      {
        "folderName": "Radio_Cooperativa_2024-10-13_14-30-00",
        "folderPath": "/path/to/folder",
        "audioFile": "audio.mp3",
        "transcriptionFile": "/path/to/transcription.txt",
        "transcriptionLength": 5000,
        "wordCount": 850,
        "timestamp": "2024-10-13 14:30:00",
        "matches": [
          {
            "phraseId": "phrase_id",
            "phrase": "Coca Cola",
            "brand": "Coca Cola",
            "campaign": "Verano 2024",
            "matchedText": "Coca Cola",
            "confidence": 1.0,
            "position": 1250,
            "wordPosition": 215,
            "context": "...y ahora un mensaje de Coca Cola, la bebida que refresca..."
          }
        ]
      }
    ]
  },
  "message": "Búsqueda completada: 15 coincidencias encontradas en 5 grabaciones"
}
```

### POST `/api/phrases/search`
**Descripción**: Búsqueda avanzada de frases con filtros de fecha
**Body**:
```json
{
  "phraseIds": ["phrase_id_1", "phrase_id_2"],
  "recordingsDir": "./recordings",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31"
}
```

**Respuesta**: Igual que GET pero con resultados filtrados por fecha

### GET `/api/phrases`
**Descripción**: Obtiene la lista de frases publicitarias (legacy)
**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "phrase_id",
      "phrase": "Coca Cola",
      "brand": "Coca Cola",
      "campaign": "Campaña Verano 2024",
      "category": "Bebidas",
      "description": "Frase publicitaria principal",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/phrases`
**Descripción**: Crea una nueva frase objetivo
**Body**:
```json
{
  "phrase": "Nueva frase",
  "brand": "Marca",
  "campaign": "Campaña",
  "category": "Categoría",
  "description": "Descripción opcional"
}
```

---

## 🎵 Frases API

### GET `/api/frases`
**Descripción**: Obtiene la lista de frases objetivo para detección
**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "phrase_id",
      "phrase": "Coca Cola",
      "brand": "Coca Cola",
      "campaign": "Campaña Verano 2024",
      "category": "Bebidas",
      "description": "Frase publicitaria principal",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/frases`
**Descripción**: Crea una nueva frase objetivo
**Body**:
```json
{
  "phrase": "Nueva frase",
  "brand": "Marca",
  "campaign": "Campaña",
  "category": "Categoría",
  "description": "Descripción opcional"
}
```

---

## 🎧 Audio API

### GET `/api/audios/list`
**Descripción**: Lista archivos de audio capturados
**Parámetros de consulta**:
- `radioId` (opcional): Filtrar por radio
- `startDate` (opcional): Fecha inicio
- `endDate` (opcional): Fecha fin
- `phrase` (opcional): Filtrar por frase detectada
- `limit` (opcional): Límite de resultados (default: 100)

**Respuesta**:
```json
{
  "success": true,
  "audios": [
    {
      "id": "audio_id",
      "name": "2024-01-01T12-00-00_radio_cooperativa_coca_cola_det123.wav",
      "radioName": "Radio Cooperativa",
      "phrase": "Coca Cola",
      "timestamp": "2024-01-01T12:00:00Z",
      "duration": 30,
      "size": 1048576,
      "audioUrl": "https://drive.google.com/uc?export=download&id=...",
      "downloadUrl": "https://drive.google.com/...",
      "transcription": "Texto transcrito del audio"
    }
  ],
  "total": 1
}
```

### GET `/api/audios/stats`
**Descripción**: Estadísticas de almacenamiento de audio
**Respuesta**:
```json
{
  "success": true,
  "stats": {
    "totalFiles": 150,
    "totalSize": 157286400,
    "usedStorage": "150 MB"
  }
}
```

### POST `/api/audios/upload`
**Descripción**: Sube un archivo de audio al sistema
**Content-Type**: `multipart/form-data`
**Campos**:
- `audio`: Archivo de audio
- `radioId`: ID de la radio
- `radioName`: Nombre de la radio
- `detectionId`: ID de la detección
- `phrase`: Frase detectada
- `timestamp`: Timestamp de la captura
- `duration`: Duración en segundos
- `transcription`: Transcripción del audio

---

## 📊 Monitoreo API

### GET `/api/monitoring/status`
**Descripción**: Estado actual del sistema de monitoreo
**Respuesta**:
```json
{
  "dependencies": {
    "node-fetch": true,
    "audio-capture": true,
    "stream-processing": true,
    "database": true
  },
  "transcriptionProviders": {
    "total": 3,
    "enabled": 2,
    "providers": {
      "openai": { "enabled": true, "cost": 0.006 },
      "assemblyai": { "enabled": true, "cost": 0.00037 }
    }
  },
  "activeCaptures": 5,
  "activeSessions": [
    {
      "id": "session_id",
      "radioId": "radio_id",
      "radioName": "Radio Cooperativa",
      "streamUrl": "https://...",
      "platform": "icecast",
      "isActive": true,
      "startTime": "2024-01-01T12:00:00Z",
      "captureInterval": 30,
      "captureDuration": 10,
      "totalCaptures": 120,
      "advertisementsFound": 8
    }
  ],
  "totalEvents": 25,
  "systemReady": true,
  "systemStatus": "ready",
  "recentDetections": [
    {
      "id": "detection_id",
      "radioName": "Radio Cooperativa",
      "phrase": "Coca Cola",
      "brand": "Coca Cola",
      "confidence": 0.95,
      "timestamp": "2024-01-01T12:30:00Z"
    }
  ],
  "queueStats": {
    "pending": 2,
    "processing": 1,
    "completed": 150
  },
  "phraseCount": 25,
  "lastCheck": "2024-01-01T12:35:00Z"
}
```

### POST `/api/monitoring/start`
**Descripción**: Inicia el monitoreo de una radio
**Body**:
```json
{
  "radioId": "radio_id",
  "radioName": "Radio Cooperativa",
  "streamUrl": "https://stream.url",
  "platform": "icecast",
  "targetPhrases": ["Coca Cola", "Pepsi", "McDonald's"],
  "captureInterval": 30,
  "captureDuration": 10
}
```

**Respuesta**:
```json
{
  "success": true,
  "sessionId": "session_id",
  "message": "Monitoreo iniciado correctamente"
}
```

### POST `/api/monitoring/stop`
**Descripción**: Detiene el monitoreo de una sesión
**Body**:
```json
{
  "sessionId": "session_id"
}
```

### GET `/api/monitoring/detections`
**Descripción**: Obtiene las detecciones recientes
**Parámetros de consulta**:
- `limit` (opcional): Número de detecciones (default: 50)
- `radioId` (opcional): Filtrar por radio
- `startDate` (opcional): Fecha inicio
- `endDate` (opcional): Fecha fin

---

## 📈 Reportes API

### GET `/api/reportes`
**Descripción**: Genera reportes de detecciones
**Parámetros de consulta**:
- `startDate`: Fecha inicio (requerido)
- `endDate`: Fecha fin (requerido)
- `radioId` (opcional): Filtrar por radio
- `phraseId` (opcional): Filtrar por frase
- `brand` (opcional): Filtrar por marca
- `format` (opcional): 'json' | 'csv' | 'excel'

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "detections": [
      {
        "id": "detection_id",
        "timestamp": "2024-01-01T12:00:00Z",
        "radioName": "Radio Cooperativa",
        "phrase": "Coca Cola",
        "brand": "Coca Cola",
        "confidence": 0.95,
        "audioPath": "/captures/audio.wav",
        "transcription": "Texto completo...",
        "duration": 30
      }
    ],
    "summary": {
      "totalDetections": 150,
      "uniqueRadios": 25,
      "uniqueBrands": 15,
      "averageConfidence": 0.87,
      "totalDuration": 4500
    },
    "byRadio": {
      "Radio Cooperativa": 45,
      "Radio Bío Bío": 32
    },
    "byBrand": {
      "Coca Cola": 25,
      "Pepsi": 18
    }
  }
}
```

---

## 👤 Perfil API

### GET `/api/profile`
**Descripción**: Obtiene el perfil del usuario actual

### PUT `/api/profile`
**Descripción**: Actualiza el perfil del usuario

---

## ⚙️ Configuración API

### GET `/api/config`
**Descripción**: Obtiene la configuración del sistema

### PUT `/api/config`
**Descripción**: Actualiza la configuración del sistema

---

## 🔧 Códigos de Estado HTTP

- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Solicitud incorrecta
- `401`: No autorizado
- `403`: Prohibido
- `404`: No encontrado
- `500`: Error interno del servidor

---

## 📝 Notas de Implementación

### Autenticación
Todos los endpoints están protegidos por NextAuth.js. Incluir las cookies de sesión en las solicitudes.

### Paginación
Los endpoints que soportan paginación usan el formato:
```json
{
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

### Manejo de Errores
Formato estándar de respuesta de error:
```json
{
  "success": false,
  "error": "Mensaje de error descriptivo",
  "code": "ERROR_CODE"
}
```

### Filtros y Búsqueda
Los parámetros de búsqueda son case-insensitive y soportan coincidencias parciales.

---

## 🚀 Estado del Sistema

✅ **Completamente Implementado**:
- API de Radios con CRUD completo
- API de Usuarios con gestión de roles
- API de Frases objetivo
- API de Audio con Google Drive
- API de Monitoreo en tiempo real
- API de Reportes con múltiples formatos

✅ **Conectado y Funcional**:
- Dashboard completamente integrado
- Formularios de datos conectados
- Reproductor de audio funcional
- Sistema de monitoreo activo
- Autenticación y autorización

🎯 **Sistema Listo para Producción**