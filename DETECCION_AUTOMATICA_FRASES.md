# Sistema de Detección Automática de Frases

## 🎯 Descripción

El sistema ahora detecta **automáticamente** las frases clave después de cada transcripción completada. No requiere intervención manual.

## 🔄 Flujo Automático

```
1. Grabación de Audio
   ↓
2. Transcripción (Whisper)
   ↓
3. ✨ DETECCIÓN AUTOMÁTICA DE FRASES ✨
   ↓
4. Guardado de Resultados
   ↓
5. Visualización en UI
```

## 📁 Archivos Generados

Cada carpeta de grabación contendrá:

```
Radio_Cooperativa_2024-10-13_14-30-00/
├── audio.mp3                      # Audio grabado
├── transcription.txt              # Transcripción de Whisper
├── transcription.json             # Metadata de transcripción
└── phrase-detections.json         # ✨ NUEVO: Detecciones automáticas
```

### Formato de `phrase-detections.json`

```json
{
  "folderName": "Radio_Cooperativa_2024-10-13_14-30-00",
  "timestamp": "2024-10-13T14:35:00.000Z",
  "totalMatches": 3,
  "detections": [
    {
      "phrase": "Coca Cola",
      "brand": "Coca Cola",
      "campaign": "Verano 2024",
      "matches": [
        {
          "matchedText": "Coca Cola",
          "confidence": 1.0,
          "position": 1250,
          "wordPosition": 215,
          "context": "...y ahora un mensaje de Coca Cola, la bebida que refresca..."
        }
      ]
    }
  ]
}
```

## 🚀 Componentes del Sistema

### 1. PhraseDetector (`vps/phrase-detector.js`)

**Funciones principales:**
- `loadActivePhrases()`: Carga frases activas desde la BD
- `detectPhrasesInTranscription()`: Detecta frases en una transcripción
- `processAllPendingDetections()`: Procesa todas las transcripciones sin detecciones

**Características:**
- Caché de frases (actualización cada 5 minutos)
- Búsqueda exacta y difusa
- Guarda resultados en JSON
- No bloquea el proceso de transcripción si falla

### 2. TranscriptionManager Modificado

**Cambios:**
```javascript
// Después de cada transcripción exitosa:
if (result.success) {
  // Detección automática
  const detectionResult = await this.phraseDetector.detectPhrasesInTranscription(
    item.folderPath,
    item.folderName
  );
}
```

### 3. API Endpoint (`/api/phrases/detections`)

**GET**: Obtiene todas las detecciones automáticas
**DELETE**: Elimina detecciones (útil para reprocesar)

### 4. UI Component (`AutomaticDetectionsViewer`)

**Características:**
- Vista en tiempo real de detecciones
- Auto-actualización cada 30 segundos (opcional)
- Filtros por fecha
- Estadísticas por frase
- Resultados expandibles

## 📊 Interfaz de Usuario

### Acceso

Navega a: **`/busqueda-frases`**

Verás dos pestañas:
1. **Detecciones Automáticas** (por defecto)
2. **Búsqueda Manual**

### Detecciones Automáticas

**Muestra:**
- Grabaciones analizadas
- Total de coincidencias
- Frases más detectadas
- Detecciones recientes con detalles

**Opciones:**
- Filtrar por rango de fechas
- Auto-actualización (cada 30 segundos)
- Ver contexto de cada coincidencia
- Expandir/colapsar resultados

## 🔧 Configuración

### En el VPS

El sistema está **pre-configurado** y funciona automáticamente. No requiere configuración adicional.

### Requisitos

1. **Base de Datos**: Frases activas en la tabla `Phrase`
2. **Prisma**: Instalado y configurado (`@prisma/client`)
3. **Permisos**: Escritura en carpetas de grabaciones

### Variables de Entorno

Asegúrate de tener configurada:
```bash
DATABASE_URL="postgresql://..."
```

## 🧪 Probar el Sistema

### 1. Probar Detector Manualmente

```bash
cd /root/radio-api

# Procesar todas las transcripciones pendientes
node phrase-detector.js

# O especificar directorio
node phrase-detector.js /path/to/recordings
```

### 2. Verificar Detecciones

```bash
# Ver archivos de detecciones generados
find ./recordings -name "phrase-detections.json"

# Ver contenido de una detección
cat ./recordings/Radio_Name_2024-10-13_14-30-00/phrase-detections.json
```

### 3. Reprocesar Detecciones

```bash
# Eliminar detecciones existentes
find ./recordings -name "phrase-detections.json" -delete

# Ejecutar detector nuevamente
node phrase-detector.js
```

## 📈 Monitoreo

### Logs del Sistema

Durante la transcripción verás:
```
📝 Transcribiendo: Radio_Cooperativa_2024-10-13_14-30-00/audio.mp3
   📝 Transcripción: ...
   📊 850 palabras en 15000ms
✅ Transcripción completada: Radio_Cooperativa_2024-10-13_14-30-00

🔍 Iniciando detección automática de frases...
📥 Cargando frases activas desde la base de datos...
✅ 25 frases activas cargadas
   ✓ "Coca Cola" encontrada 2 vez/veces
   ✓ "Banco Estado" encontrada 1 vez/veces
   💾 Detecciones guardadas: .../phrase-detections.json
   📊 Total: 3 coincidencias en 2 frases diferentes
   ✅ Detección completada: 3 coincidencias
```

### Verificar Estado

```bash
# Ver estadísticas de detecciones
node -e "
const fs = require('fs');
const path = require('path');
const dir = './recordings';
let total = 0;
let withDetections = 0;

fs.readdirSync(dir).forEach(folder => {
  const folderPath = path.join(dir, folder);
  if (fs.statSync(folderPath).isDirectory()) {
    total++;
    if (fs.existsSync(path.join(folderPath, 'phrase-detections.json'))) {
      withDetections++;
    }
  }
});

console.log(\`Total: \${total}, Con detecciones: \${withDetections}\`);
"
```

## 🔄 Proceso Programado

El sistema se ejecuta automáticamente:

1. **Grabaciones**: Según horario configurado (5 AM - 2 AM)
2. **Transcripciones**: Cada 30 minutos entre 2-5 AM
3. **Detecciones**: Inmediatamente después de cada transcripción

## 🎨 Características de la UI

### Detecciones Automáticas

- **Estadísticas en tiempo real**
- **Frases más detectadas** (top 10)
- **Detecciones recientes** con detalles completos
- **Auto-actualización** opcional
- **Filtros por fecha**
- **Indicadores de confianza** con colores

### Búsqueda Manual

- Búsqueda bajo demanda
- Todas las funcionalidades anteriores
- Útil para análisis históricos

## 🚨 Solución de Problemas

### No se generan detecciones

**Verificar:**
1. ¿Hay frases activas en la BD?
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM phrases WHERE active = true;"
   ```

2. ¿El transcription-manager está actualizado?
   ```bash
   grep "phraseDetector" transcription-manager.js
   ```

3. ¿Hay errores en los logs?
   ```bash
   tail -f /var/log/radio-api.log
   ```

### Detecciones incompletas

**Solución:**
```bash
# Reprocesar todas las transcripciones
node phrase-detector.js
```

### Error de conexión a BD

**Verificar:**
```bash
# Probar conexión
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.phrase.count().then(count => {
  console.log('Frases en BD:', count);
  prisma.\$disconnect();
});
"
```

## 📊 Métricas y Estadísticas

### Desde la UI

- Total de grabaciones analizadas
- Total de coincidencias
- Frases más detectadas
- Distribución temporal

### Desde la API

```bash
# Obtener estadísticas
curl http://localhost:3000/api/phrases/detections | jq '.data.phraseStats'
```

## 🔐 Seguridad

- Las detecciones se guardan **localmente** en el VPS
- No se exponen datos sensibles en la API
- Solo usuarios autenticados pueden acceder

## 🎯 Ventajas del Sistema Automático

1. **Sin intervención manual**: Todo es automático
2. **Resultados inmediatos**: Disponibles segundos después de la transcripción
3. **Histórico completo**: Todas las detecciones se guardan
4. **Eficiente**: No reprocesa transcripciones ya analizadas
5. **Robusto**: Si falla la detección, no afecta la transcripción
6. **Escalable**: Procesa múltiples grabaciones en paralelo

## 📝 Próximas Mejoras

- [ ] Guardar detecciones en la BD (tabla `Detection`)
- [ ] Alertas en tiempo real cuando se detecta una frase
- [ ] Exportación de reportes automáticos
- [ ] Dashboard de métricas en tiempo real
- [ ] Integración con sistema de facturación

## 🆘 Soporte

Para problemas o dudas:
1. Revisar logs del sistema
2. Verificar estructura de archivos
3. Probar detector manualmente
4. Consultar documentación completa en `BUSQUEDA_FRASES_TRANSCRIPCIONES.md`
