# Guía Rápida: Búsqueda de Frases en Transcripciones

## 🚀 Inicio Rápido

### 1. Acceder a la Funcionalidad

Navega a: **`/busqueda-frases`** en tu navegador

### 2. Realizar una Búsqueda

1. **Opcional**: Configura filtros de fecha
   - Fecha Desde: Selecciona fecha inicial
   - Fecha Hasta: Selecciona fecha final

2. Haz clic en **"Buscar"**

3. Espera a que el sistema procese las transcripciones

### 3. Ver Resultados

El sistema mostrará:

- **Estadísticas Generales**:
  - Total de grabaciones analizadas
  - Grabaciones con coincidencias
  - Total de coincidencias encontradas
  - Número de frases diferentes encontradas

- **Estadísticas por Frase**:
  - Cada frase encontrada con su contador
  - Marca asociada

- **Resultados Detallados**:
  - Haz clic en cualquier resultado para expandir
  - Verás:
    - Nombre de la grabación
    - Timestamp de cuando ocurrió
    - Todas las coincidencias encontradas
    - Contexto de cada coincidencia
    - Posición exacta en el texto

### 4. Exportar Resultados

Haz clic en **"Exportar"** para descargar los resultados en formato JSON

## 📋 Requisitos Previos

### En la Base de Datos

1. **Tener frases activas**:
   - Ve a la sección de Frases
   - Crea o activa frases que quieras buscar
   - Solo las frases con estado "Activo" serán buscadas

### En el VPS

2. **Tener grabaciones con transcripciones**:
   - Las grabaciones deben estar en carpetas con formato:
     ```
     {RadioName}_{YYYY-MM-DD}_{HH-MM-SS}/
     ```
   - Cada carpeta debe contener:
     - `transcription.txt` (requerido)
     - `transcription.json` (opcional, metadata)

3. **Generar transcripciones** (si no existen):
   ```bash
   cd /root/radio-api
   node transcription-manager.js
   ```

## 🧪 Probar el Sistema

### Desde el VPS

```bash
# Navegar al directorio
cd /root/radio-api

# Ejecutar script de prueba
node phrase-search-test.js

# O especificar directorio de grabaciones
node phrase-search-test.js /path/to/recordings
```

Este script:
- Verifica la estructura de directorios
- Cuenta transcripciones disponibles
- Simula búsquedas con frases comunes
- Genera un reporte detallado

## 🔧 Configuración Avanzada

### Usar la API Directamente

**Búsqueda Simple (GET)**:
```bash
curl http://localhost:3000/api/phrases/search
```

**Búsqueda con Frases Específicas**:
```bash
curl "http://localhost:3000/api/phrases/search?phraseIds=phrase_id_1,phrase_id_2"
```

**Búsqueda Avanzada (POST)**:
```bash
curl -X POST http://localhost:3000/api/phrases/search \
  -H "Content-Type: application/json" \
  -d '{
    "phraseIds": ["phrase_id_1"],
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31"
  }'
```

### Usar el Servicio Programáticamente

```typescript
import { phraseSearchService } from '@/lib/phrase-search-service';

// Buscar todas las frases activas
const results = await phraseSearchService.searchAllTranscriptions();

// Buscar frases específicas
const specificResults = await phraseSearchService.searchSpecificPhrases([
  'phrase-id-1',
  'phrase-id-2'
]);

// Configurar directorio personalizado
phraseSearchService.setRecordingsDir('/custom/path/to/recordings');
```

## 📊 Interpretación de Resultados

### Confianza (Confidence)

- **100%** (1.0): Coincidencia exacta
- **85-99%**: Coincidencia muy similar (posible variación menor)
- **< 85%**: Coincidencia difusa (revisar manualmente)

### Posición

- **position**: Posición del carácter en el texto completo
- **wordPosition**: Número de palabra donde aparece la frase

### Contexto

Muestra ±50 caracteres alrededor de la coincidencia para verificar el contexto

## ❓ Preguntas Frecuentes

### ¿Por qué no encuentra ninguna frase?

1. Verifica que haya frases activas en la BD
2. Verifica que existan transcripciones en las carpetas
3. Revisa que las frases estén escritas correctamente
4. Prueba con frases más genéricas

### ¿Por qué la búsqueda es lenta?

- El sistema procesa todas las transcripciones secuencialmente
- Con muchas grabaciones puede tomar varios minutos
- Usa filtros de fecha para reducir el alcance

### ¿Cómo mejoro la precisión?

1. Usa frases más específicas
2. Ajusta el umbral de confianza en la BD (campo `confidence`)
3. Crea variantes de frases para capturar diferentes formas

### ¿Puedo buscar en tiempo real?

No, esta funcionalidad busca en transcripciones ya generadas. Para detección en tiempo real, usa el sistema de monitoreo activo.

## 🐛 Solución de Problemas

### Error: "No se encontraron grabaciones"

```bash
# Verificar que el directorio existe
ls -la /root/radio-api/recordings

# Verificar permisos
chmod -R 755 /root/radio-api/recordings
```

### Error: "No hay transcripciones disponibles"

```bash
# Generar transcripciones
cd /root/radio-api
node transcription-manager.js
```

### Error: "Error al buscar frases"

1. Revisa los logs del servidor
2. Verifica conexión a la base de datos
3. Verifica que las frases existan en la BD

## 📚 Documentación Adicional

- **Documentación Completa**: Ver `BUSQUEDA_FRASES_TRANSCRIPCIONES.md`
- **API Endpoints**: Ver `ENDPOINTS_DOCUMENTATION.md`
- **Sistema de Transcripciones**: Ver `SISTEMA_TRANSCRIPCIONES_COMPLETO.md`

## 💡 Casos de Uso Comunes

### 1. Auditoría Semanal
```
1. Ir a /busqueda-frases
2. Configurar: Fecha Desde = Lunes, Fecha Hasta = Domingo
3. Buscar
4. Exportar resultados
5. Revisar con el cliente
```

### 2. Verificar Campaña Específica
```
1. Crear/activar solo las frases de la campaña
2. Buscar sin filtros de fecha
3. Verificar que aparezcan en las fechas acordadas
```

### 3. Análisis de Competencia
```
1. Crear frases de marcas competidoras
2. Buscar en período específico
3. Analizar frecuencia de aparición
```

## 🎯 Próximos Pasos

1. ✅ Búsqueda básica implementada
2. 🔄 Agregar selector de frases en UI
3. 🔄 Implementar caché de resultados
4. 🔄 Agregar timestamps de audio precisos
5. 🔄 Integrar con sistema de alertas

---

**¿Necesitas ayuda?** Contacta al equipo de desarrollo o revisa la documentación completa.
