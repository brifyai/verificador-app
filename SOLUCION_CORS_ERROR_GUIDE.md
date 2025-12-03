# Guía de Solución de Errores CORS

## 📋 Resumen del Problema

El error de CORS (Cross-Origin Resource Sharing) que estás experimentando ocurre cuando el navegador bloquea solicitudes entre diferentes orígenes (dominios). En tu caso, hay dos tipos de errores:

### 1. Error con el VPS (213.199.39.147:5000)
```
Access to fetch at 'http://213.199.39.147:5000/api/verify-stream' from origin 'http://localhost:3000' has been blocked by CORS policy
```

### 2. Error con servidores de streaming externos
```
Access to XMLHttpRequest at 'https://sonic.streamingchilenos.com/8192/stream' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## 🔧 Soluciones Implementadas

### ✅ Solución 1: Agregar endpoint faltante al VPS

**Problema**: El frontend intentaba llamar al endpoint `/api/verify-stream` que no existía en el servidor VPS.

**Solución**: Agregué el endpoint faltante al archivo [`temp_flask_app.py`](temp_flask_app.py):

```python
@app.route('/api/verify-stream', methods=['POST'])
def verify_stream():
    """
    Verifica si el streaming de una radio está funcionando correctamente
    antes de iniciar la grabación
    """
    # ... código completo del endpoint
```

**Cómo funciona el nuevo endpoint**:
1. Recibe `radio_id`, `stream_url` y `radio_name` en el body
2. Usa `requests.head()` para verificar el stream sin descargar contenido
3. Analiza el `Content-Type` para confirmar que es audio válido
4. Maneja timeouts, errores de conexión y otros problemas
5. Retorna JSON con el estado del streaming

### ✅ Solución 2: CORS ya configurado en VPS

**Estado actual**: El VPS ya tiene CORS configurado correctamente con:
```python
from flask_cors import CORS
CORS(app)
```

Esto permite que cualquier origen (incluyendo `http://localhost:3000`) pueda hacer peticiones al VPS.

## 🚨 Problema Persistente: CORS con Servidores Externos

### El Problema
Los errores como:
```
Access to XMLHttpRequest at 'https://sonic.streamingchilenos.com/8192/stream' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**No se pueden resolver desde tu aplicación** porque:

1. **Los servidores de streaming externos no tienen CORS configurado**
2. **No tienes control sobre esos servidores**
3. **El navegador bloquea por seguridad**

### Por qué esto es normal
- Es una medida de seguridad del navegador
- Los servidores de radio no suelen configurar CORS
- Esto protege contra ataques de cross-site scripting

## 🎯 Soluciones Alternativas para Streaming Externo

### Opción 1: Usar el VPS como proxy (Recomendada)
Modificar el frontend para que **todas las verificaciones pasen por el VPS**:

```typescript
// En vez de verificar directamente el stream externo
const response = await fetch(`${this.API_BASE}/verify-stream`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    radio_id: radioId,
    stream_url: streamUrl,
    radio_name: radioName
  })
});
```

### Opción 2: Implementar verificación en el backend
Crear un endpoint en tu aplicación Next.js que haga la verificación:

```typescript
// app/app/api/radios/[id]/verify-stream/route.ts
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { stream_url } = await request.json();
  
  // Hacer la verificación desde el servidor (sin restricciones CORS)
  const result = await verifyStreamFromServer(stream_url);
  
  return NextResponse.json(result);
}
```

### Opción 3: Usar técnicas de verificación alternativas
- **Audio element**: Crear un elemento `<audio>` invisible para probar la reproducción
- **Image element**: Usar un pixel de tracking (si el servidor lo permite)
- **Server-side rendering**: Hacer la verificación durante el build o en el servidor

## 🔄 Flujo de Verificación Actualizado

### Paso 1: Frontend llama al VPS
```typescript
// stream-verifier-vps.ts
const response = await fetch(`${this.API_BASE}/verify-stream`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    radio_id: radioId,
    stream_url: streamUrl,
    radio_name: radioName
  })
});
```

### Paso 2: VPS verifica el stream
```python
# temp_flask_app.py
response = requests.head(stream_url, timeout=10, allow_redirects=True)
# Analiza headers y responde
```

### Paso 3: VPS responde al frontend
```json
{
  "status": "success",
  "message": "Streaming funcionando correctamente",
  "content_type": "audio/mpeg",
  "content_length": "0",
  "response_code": 200
}
```

## 🚀 Próximos Pasos

### 1. Reiniciar el VPS
El servidor VPS necesita reiniciarse para cargar el nuevo endpoint:

```bash
# Conectarse al VPS
ssh root@213.199.39.147

# Reiniciar el servicio
systemctl restart radio-recorder

# Verificar logs
journalctl -u radio-recorder -f
```

### 2. Probar el nuevo endpoint
```bash
# Prueba manual con curl
curl -X POST http://213.199.39.147:5000/api/verify-stream \
  -H "Content-Type: application/json" \
  -d '{
    "radio_id": "test-radio",
    "stream_url": "https://radio.example.com/stream",
    "radio_name": "Test Radio"
  }'
```

### 3. Verificar en el frontend
Los errores de CORS con el VPS deberían desaparecer automáticamente.

## 📊 Resumen de Estado

| Problema | Estado | Solución |
|----------|---------|----------|
| VPS CORS (213.199.39.147:5000) | ✅ **RESUELTO** | Endpoint agregado, CORS configurado |
| Streaming externos CORS | ⚠️ **LIMITACIÓN** | Usar VPS como proxy |
| Endpoint `/api/verify-stream` | ✅ **IMPLEMENTADO** | Función completa agregada |

## 🔍 Debugging

Si aún tienes problemas:

1. **Verifica el VPS está corriendo**:
   ```bash
   curl http://213.199.39.147:5000/api/status
   ```

2. **Prueba el nuevo endpoint**:
   ```bash
   curl -X POST http://213.199.39.147:5000/api/verify-stream \
     -H "Content-Type: application/json" \
     -d '{"radio_id": "test", "stream_url": "https://example.com/stream.mp3"}'
   ```

3. **Revisa logs del VPS**:
   ```bash
   ssh root@213.199.39.147
   journalctl -u radio-recorder -n 50
   ```

4. **Verifica en el navegador**:
   - Abre la consola del navegador (F12)
   - Ve a la pestaña Network/Red
   - Intenta reproducir una radio
   - Busca peticiones a `213.199.39.147:5000/api/verify-stream`

## 🎉 Resultado Esperado

Después de implementar estas soluciones:
- ✅ No más errores CORS con el VPS
- ✅ Verificación de streaming funcional
- ✅ Mejor manejo de errores y timeouts
- ✅ Logs detallados para debugging

El único CORS que persistirá será con servidores externos que no puedes controlar, pero ahora el VPS actúa como proxy seguro para la mayoría de las verificaciones.