# Configuración de IA para Detección de Frases

## 🎯 Credenciales desde Base de Datos

El sistema **lee automáticamente** las credenciales de IA desde la tabla `api_configurations` en la base de datos. No necesitas archivos de configuración en el VPS.

## 🤖 ¿Por qué usar IA?

La IA permite detectar frases incluso cuando la transcripción tiene errores o variaciones:

### Ejemplos de Detección:

**Frase Original:** `"WOM iPhone 15 disponible con planes desde 19990 pesos"`

**Variaciones que la IA detecta:**
- ✅ `"WOM iPhone 15 disponible con planes desde 199 pesos"` (error de transcripción)
- ✅ `"WOM iPhone 15 disponible con plan de 19990 pesos"` (palabra diferente)
- ✅ `"WOM iPhone quince disponible con planes desde diecinueve mil novecientos noventa pesos"` (números en texto)
- ✅ `"WOM iPhone 15 disponible planes 19990"` (palabras faltantes)

## 📋 Configuración

### 1. Configurar en la Base de Datos

Las credenciales de IA se configuran desde la **UI de administración** o directamente en la base de datos:

```sql
-- Insertar configuración de OpenAI
INSERT INTO api_configurations (provider, api_key, model, enabled, priority)
VALUES ('openai', 'sk-tu-api-key', 'gpt-4o-mini', true, 1);

-- Insertar configuración de Anthropic
INSERT INTO api_configurations (provider, api_key, model, enabled, priority)
VALUES ('anthropic', 'sk-ant-tu-api-key', 'claude-3-5-sonnet-20241022', true, 2);

-- Insertar configuración de Groq
INSERT INTO api_configurations (provider, api_key, model, enabled, priority)
VALUES ('groq', 'gsk-tu-api-key', 'llama-3.3-70b-versatile', true, 3);
```

**Prioridad:** El sistema usa el proveedor con menor número de prioridad (1 = más prioritario).

### 2. Opciones de Proveedores

#### OpenAI (Recomendado)
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "apiKey": "sk-..."
}
```

**Modelos disponibles:**
- `gpt-4o-mini` (rápido y económico)
- `gpt-4o` (más preciso)
- `gpt-4-turbo`

#### Anthropic (Claude)
```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "apiKey": "sk-ant-..."
}
```

**Modelos disponibles:**
- `claude-3-5-sonnet-20241022` (recomendado)
- `claude-3-5-haiku-20241022` (más rápido)

#### Groq (Más rápido)
```json
{
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "apiKey": "gsk_..."
}
```

**Modelos disponibles:**
- `llama-3.3-70b-versatile` (recomendado)
- `llama-3.1-70b-versatile`
- `mixtral-8x7b-32768`

### 3. Instalar dependencias en el VPS

```bash
cd /root/radio-api

# Instalar dependencias necesarias
npm install axios @prisma/client

# Generar cliente de Prisma
npx prisma generate
```

### 4. Configurar DATABASE_URL en el VPS

```bash
# Configurar variable de entorno
export DATABASE_URL="postgresql://usuario:password@host:5432/database"

# Hacerla permanente
echo 'export DATABASE_URL="postgresql://usuario:password@host:5432/database"' >> ~/.bashrc
source ~/.bashrc
```

## 🔄 Flujo de Detección

### Con IA Configurada:

```
1. Buscar coincidencia exacta en transcripción
   ↓
2. Si NO encuentra → Consultar IA
   ↓
3. IA analiza semánticamente el texto
   ↓
4. IA devuelve coincidencias aproximadas con confianza
   ↓
5. Si confianza < 90% → Marca para verificación humana
   ↓
6. Guarda resultado con flag needsHumanVerification
```

### Sin IA Configurada:

```
1. Buscar coincidencia exacta en transcripción
   ↓
2. Si NO encuentra → No detecta nada
   ↓
3. Fin
```

## 📊 Formato de Resultados

### phrase-detections.json con IA:

```json
{
  "folderName": "Radio_Test_2024-10-13_15-00-00",
  "timestamp": "2024-10-13T15:35:00.000Z",
  "totalMatches": 2,
  "detections": [
    {
      "phrase": "WOM iPhone 15 disponible con planes desde 19990 pesos",
      "brand": "WOM",
      "campaign": "iPhone 15",
      "hasAIMatches": true,
      "needsVerification": true,
      "matches": [
        {
          "matchedText": "WOM iPhone 15 disponible con planes desde 199 pesos",
          "confidence": 0.85,
          "position": 1250,
          "wordPosition": 0,
          "context": "...y ahora WOM iPhone 15 disponible con planes desde 199 pesos...",
          "verifiedBy": "AI",
          "aiReason": "Coincidencia alta pero con error en precio (199 vs 19990)",
          "needsHumanVerification": true
        }
      ]
    }
  ]
}
```

## 🎯 Niveles de Confianza

| Confianza | Acción | Descripción |
|-----------|--------|-------------|
| 100% | ✅ Auto-aprobado | Coincidencia exacta |
| 90-99% | ✅ Auto-aprobado | IA muy segura, variación mínima |
| 70-89% | ⚠️ Verificación humana | IA detecta similitud, requiere revisión |
| < 70% | ❌ Rechazado | No se considera coincidencia |

## 🧪 Probar Configuración

### 1. Verificar configuración en BD

```bash
# En el VPS, verificar que hay proveedores configurados
cd /root/radio-api
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.apiConfiguration.findMany({
  where: { enabled: true }
}).then(configs => {
  console.log('Proveedores de IA configurados:');
  configs.forEach(c => {
    console.log(\`- \${c.provider}: \${c.model} (prioridad: \${c.priority})\`);
  });
  prisma.\$disconnect();
});
"
```

### 2. Crear transcripción de prueba con error

```bash
cd /root/radio-api
mkdir -p recordings/Test_AI_2024-10-13_15-00-00

# recording_info.json
cat > recordings/Test_AI_2024-10-13_15-00-00/recording_info.json << 'EOF'
{
  "radioName": "Test AI",
  "phrase": {
    "text": "WOM iPhone 15 disponible con planes desde 19990 pesos",
    "brand": "WOM"
  }
}
EOF

# transcription.txt con ERROR en el precio
cat > recordings/Test_AI_2024-10-13_15-00-00/transcription.txt << 'EOF'
Buenos días estimados auditores.
Y ahora un mensaje de WOM iPhone 15 disponible con planes desde 199 pesos.
No te lo pierdas, visítanos en nuestras tiendas.
EOF

# Ejecutar detector
node phrase-detector.js

# Deberías ver:
# 📥 Cargando configuración de IA desde base de datos...
# 🤖 IA configurada: openai (gpt-4o-mini)
# 🔍 Buscando: "WOM iPhone 15 disponible con planes desde 19990 pesos"...
# 🤖 No se encontró coincidencia exacta, verificando con IA...
# 🤖 IA encontró 1 coincidencia(s) aproximada(s)
#    1. "WOM iPhone 15 disponible con planes desde 199 pesos" (confianza: 85%)
#       ⚠️ Requiere verificación humana
```

### 3. Ver resultado

```bash
cat recordings/Test_AI_2024-10-13_15-00-00/phrase-detections.json | jq
```

## 💰 Costos Estimados

### OpenAI (gpt-4o-mini)
- **Costo:** ~$0.0001 por detección
- **Velocidad:** 2-3 segundos
- **Recomendado para:** Producción

### Anthropic (Claude Sonnet)
- **Costo:** ~$0.0003 por detección
- **Velocidad:** 2-4 segundos
- **Recomendado para:** Máxima precisión

### Groq (Llama 3.3)
- **Costo:** Gratis (con límites)
- **Velocidad:** < 1 segundo
- **Recomendado para:** Desarrollo/Testing

## 🔐 Seguridad

### Las API Keys están en la Base de Datos

- ✅ **Centralizadas**: Todas las credenciales en un solo lugar
- ✅ **Seguras**: Protegidas por la seguridad de PostgreSQL
- ✅ **Fácil gestión**: Cambiar desde la UI sin tocar el VPS
- ✅ **Multi-usuario**: Cada usuario puede tener sus propias keys

### Encriptación (Recomendado)

Para mayor seguridad, encripta las API keys antes de guardarlas:

```javascript
// Ejemplo de encriptación (implementar en la UI)
const crypto = require('crypto');

function encryptApiKey(apiKey, secret) {
  const cipher = crypto.createCipher('aes-256-cbc', secret);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptApiKey(encryptedKey, secret) {
  const decipher = crypto.createDecipher('aes-256-cbc', secret);
  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

## 📈 Monitoreo

### Ver uso de IA

```bash
# Contar detecciones con IA
find recordings/ -name "phrase-detections.json" -exec jq '.detections[] | select(.hasAIMatches == true)' {} \; | wc -l

# Ver detecciones que requieren verificación
find recordings/ -name "phrase-detections.json" -exec jq '.detections[] | select(.needsVerification == true)' {} \;
```

## 🚨 Solución de Problemas

### Error: "Cannot find module 'axios'"

```bash
cd /root/radio-api
npm install axios
```

### Error: "Invalid API key"

Verificar que la API key sea correcta:
```bash
cat /root/radio-api/ai-config.json
```

### IA no se está usando

Verificar que hay proveedores habilitados en la BD:
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.apiConfiguration.findMany({ where: { enabled: true } })
  .then(c => console.log('Proveedores habilitados:', c.length))
  .finally(() => prisma.\$disconnect());
"
```

Si devuelve 0, necesitas configurar proveedores en la base de datos.

### Detecciones muy lentas

Cambiar a Groq (más rápido):
```json
{
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "apiKey": "gsk_..."
}
```

## ✅ Verificación Humana

Las detecciones con `needsHumanVerification: true` deben revisarse en la UI:

1. Ver en `/verificacion`
2. Reproducir audio en ese momento
3. Confirmar o rechazar
4. Sistema aprende de las decisiones

## 🎯 Mejores Prácticas

1. **Usar IA solo cuando sea necesario** (no hay coincidencia exacta)
2. **Configurar umbral de confianza** (90% recomendado)
3. **Revisar detecciones con baja confianza**
4. **Monitorear costos de API**
5. **Usar Groq para testing** (gratis y rápido)
6. **Usar OpenAI para producción** (mejor balance precio/calidad)

---

**Sistema listo para detectar frases con variaciones y errores de transcripción** 🎉
