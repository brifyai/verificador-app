# Selección de IA por Usuario

## 🎯 Descripción

Cada usuario puede **seleccionar qué IA usar** para la detección de frases. El sistema lee la configuración específica del usuario desde la base de datos.

## 🤖 IAs Disponibles

| Proveedor | Uso | Velocidad | Costo | Recomendado para |
|-----------|-----|-----------|-------|------------------|
| **OpenAI** | Análisis semántico | 2-3s | $0.0001 | Producción general |
| **Anthropic** | Análisis semántico | 2-4s | $0.0003 | Máxima precisión |
| **Groq** | Análisis semántico | <1s | Gratis | Testing rápido |
| **Abacus** | Análisis semántico | 2-3s | Variable | Alternativa |
| **Deepgram** | Transcripción | N/A | Variable | Solo transcripción |

**Nota:** Deepgram es principalmente para transcripción, no para análisis semántico de frases.

## 📋 Flujo de Selección

### 1. Usuario Configura Monitoreo

Cuando el usuario crea un monitoreo, selecciona:
- Radio a monitorear
- Frase a buscar
- **IA a utilizar** (openai, anthropic, groq, abacus)

### 2. Se Guarda en recording_info.json

```json
{
  "radioName": "Radio Cooperativa",
  "streamUrl": "https://...",
  "startTime": "2024-10-13T14:30:00.000Z",
  "userId": "user_123",
  "aiProvider": "openai",
  "phrase": {
    "id": "phrase_paris",
    "text": "Paris liquidación total hasta agotar stock",
    "brand": "Paris",
    "campaign": "Liquidación Total"
  }
}
```

### 3. Sistema Lee Configuración del Usuario

Cuando se ejecuta la detección:

```javascript
// 1. Lee recording_info.json
const recordingInfo = JSON.parse(fs.readFileSync('recording_info.json'));

// 2. Extrae userId y aiProvider
const userId = recordingInfo.userId;
const selectedAI = recordingInfo.aiProvider; // 'openai'

// 3. Carga configuración específica de la BD
const config = await prisma.apiConfiguration.findFirst({
  where: {
    provider: selectedAI,  // 'openai'
    enabled: true
  }
});

// 4. Usa la API key del usuario
const apiKey = config.apiKey;
```

## 🗄️ Configuración en Base de Datos

### Estructura de api_configurations

```sql
CREATE TABLE api_configurations (
  id          TEXT PRIMARY KEY,
  provider    TEXT UNIQUE,  -- 'openai', 'anthropic', 'groq', 'abacus', 'deepgram'
  api_key     TEXT,         -- API key del proveedor
  model       TEXT,         -- Modelo específico
  enabled     BOOLEAN,      -- Si está habilitado
  priority    INTEGER,      -- Prioridad (menor = más prioritario)
  metadata    JSONB,        -- Configuración adicional
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
);
```

### Ejemplo de Configuración

```sql
-- OpenAI
INSERT INTO api_configurations (provider, api_key, model, enabled, priority)
VALUES ('openai', 'sk-proj-...', 'gpt-4o-mini', true, 1);

-- Anthropic
INSERT INTO api_configurations (provider, api_key, model, enabled, priority)
VALUES ('anthropic', 'sk-ant-...', 'claude-3-5-sonnet-20241022', true, 2);

-- Groq
INSERT INTO api_configurations (provider, api_key, model, enabled, priority)
VALUES ('groq', 'gsk_...', 'llama-3.3-70b-versatile', true, 3);

-- Abacus
INSERT INTO api_configurations (provider, api_key, model, enabled, priority)
VALUES ('abacus', 'abacus_...', 'abacus-ai-default', true, 4);
```

## 🔄 Flujo Completo

```
1. Usuario selecciona IA en UI
   ↓
2. Se guarda en recording_info.json
   {
     "userId": "user_123",
     "aiProvider": "openai"
   }
   ↓
3. Se graba audio
   ↓
4. Se transcribe
   ↓
5. phrase-detector.js lee recording_info.json
   ↓
6. Carga configuración de "openai" desde BD
   ↓
7. Busca frase con IA seleccionada
   ↓
8. Guarda resultados
```

## 🎨 Interfaz de Usuario

### Selector de IA en el Monitoreo

```tsx
<select name="aiProvider">
  <option value="openai">OpenAI (GPT-4o-mini) - Recomendado</option>
  <option value="anthropic">Anthropic (Claude) - Máxima precisión</option>
  <option value="groq">Groq (Llama 3.3) - Más rápido</option>
  <option value="abacus">Abacus AI</option>
</select>
```

### Validación

Antes de permitir seleccionar una IA, verificar que esté configurada:

```typescript
// Verificar IAs disponibles
const availableAIs = await prisma.apiConfiguration.findMany({
  where: {
    enabled: true,
    apiKey: { not: null }
  },
  select: {
    provider: true,
    model: true
  }
});

// Mostrar solo las disponibles en el selector
```

## 📊 Logs del Sistema

### Cuando se usa IA seleccionada

```
🔍 Buscando frases en: Radio_Cooperativa_2024-10-13_14-30-00
   🤖 IA seleccionada por el usuario: openai
   🎯 Frase específica del monitoreo: "Paris liquidación total..."
   📥 Cargando configuración de IA del usuario (openai)...
   🤖 IA configurada: openai (gpt-4o-mini)
   🔍 Buscando: "Paris liquidación total..."...
   🤖 No se encontró coincidencia exacta, verificando con IA...
   🤖 IA encontró 1 coincidencia(s) aproximada(s)
      1. "Paris liquidación total" (confianza: 85%)
         ⚠️ Requiere verificación humana
```

## 🧪 Pruebas

### 1. Crear grabación de prueba con IA específica

```bash
cd /root/radio-api
mkdir -p recordings/Test_OpenAI_2024-10-13_15-00-00

# recording_info.json con IA seleccionada
cat > recordings/Test_OpenAI_2024-10-13_15-00-00/recording_info.json << 'EOF'
{
  "radioName": "Test OpenAI",
  "userId": "user_123",
  "aiProvider": "openai",
  "phrase": {
    "text": "WOM iPhone 15 disponible con planes desde 19990 pesos",
    "brand": "WOM"
  }
}
EOF

# transcription.txt con error
cat > recordings/Test_OpenAI_2024-10-13_15-00-00/transcription.txt << 'EOF'
Buenos días, ahora WOM iPhone 15 disponible con planes desde 199 pesos.
EOF

# Ejecutar detector
node phrase-detector.js
```

### 2. Verificar que usa la IA correcta

```bash
# Ver logs
node phrase-detector.js 2>&1 | grep "IA seleccionada"
# Debería mostrar: 🤖 IA seleccionada por el usuario: openai
```

## 🔐 Seguridad

### API Keys por Usuario

Cada usuario tiene sus propias API keys en la base de datos:

```sql
-- Opción 1: Tabla global (actual)
SELECT * FROM api_configurations WHERE provider = 'openai';

-- Opción 2: API keys por usuario (futuro)
CREATE TABLE user_api_configurations (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id),
  provider    TEXT,
  api_key     TEXT,
  enabled     BOOLEAN,
  UNIQUE(user_id, provider)
);
```

### Encriptación de API Keys

```javascript
// Encriptar antes de guardar
const crypto = require('crypto');

function encryptApiKey(apiKey, secret) {
  const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Desencriptar al usar
function decryptApiKey(encryptedKey, secret) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', secret, iv);
  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

## 🚨 Manejo de Errores

### Si la IA seleccionada no está disponible

```javascript
if (!providerConfig || !providerConfig.apiKey) {
  console.log(`⚠️ ${selectedProvider} no está configurado`);
  
  // Fallback: usar búsqueda exacta
  return this.findPhraseInText(text, phrase);
}
```

### Si la API key es inválida

```javascript
try {
  const result = await verifyWithAI(text, phrase);
} catch (error) {
  if (error.response?.status === 401) {
    console.log('❌ API key inválida para', this.aiConfig.provider);
    // Notificar al usuario
    // Usar búsqueda exacta como fallback
  }
}
```

## 📈 Métricas

### Uso por IA

```sql
-- Contar detecciones por proveedor
SELECT 
  ai_provider,
  COUNT(*) as total_detections
FROM (
  SELECT 
    json_extract(recording_info, '$.aiProvider') as ai_provider
  FROM recordings
) 
GROUP BY ai_provider;
```

### Costos por Usuario

```sql
-- Calcular costos aproximados
SELECT 
  user_id,
  ai_provider,
  COUNT(*) as detections,
  COUNT(*) * cost_per_detection as estimated_cost
FROM recordings
JOIN api_configurations ON recordings.ai_provider = api_configurations.provider
GROUP BY user_id, ai_provider;
```

## ✅ Checklist de Implementación

- [x] Modificar `phrase-detector.js` para leer `aiProvider` del `recording_info.json`
- [x] Agregar método `loadUserAIConfig(userId, provider)`
- [x] Soportar 4 proveedores: openai, anthropic, groq, abacus
- [ ] Crear UI para seleccionar IA en el monitoreo
- [ ] Validar que la IA seleccionada esté configurada
- [ ] Mostrar solo IAs disponibles en el selector
- [ ] Agregar indicador de IA usada en los resultados
- [ ] Implementar fallback si la IA falla

## 🎯 Próximos Pasos

1. **UI de Selección**: Agregar selector de IA en el formulario de monitoreo
2. **Validación**: Verificar que la IA esté configurada antes de permitir selección
3. **Indicadores**: Mostrar qué IA se usó en cada detección
4. **Estadísticas**: Dashboard de uso por IA
5. **Costos**: Tracking de costos por usuario y por IA

---

**Sistema listo para que cada usuario seleccione su IA preferida** 🎉
