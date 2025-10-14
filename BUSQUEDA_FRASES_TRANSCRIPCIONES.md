# Sistema de Búsqueda de Frases en Transcripciones

## Descripción General

Este sistema permite buscar frases clave (definidas en la base de datos) dentro de los archivos de transcripción de las grabaciones de audio. El sistema reporta:

- **Qué frase** fue encontrada
- **Dónde** fue encontrada (carpeta/grabación)
- **Cuándo** ocurrió (timestamp de la grabación)
- **En qué posición** del texto (palabra y carácter)
- **Contexto** alrededor de la coincidencia
- **Confianza** de la coincidencia (100% para exactas, menor para difusas)

## Arquitectura

### 1. Servicio de Búsqueda (`lib/phrase-search-service.ts`)

**Funcionalidades principales:**

- `searchAllTranscriptions()`: Busca todas las frases activas en todas las transcripciones
- `searchSpecificPhrases(phraseIds)`: Busca frases específicas por ID
- `findPhraseInText()`: Encuentra coincidencias exactas de una frase en un texto
- `findFuzzyMatches()`: Encuentra coincidencias difusas usando similitud de Levenshtein

**Algoritmos:**

- **Búsqueda exacta**: Coincidencia case-insensitive del texto completo
- **Búsqueda difusa**: Usa distancia de Levenshtein para encontrar frases similares
- **Umbral de confianza**: Configurable por frase (default 0.85)

### 2. API Endpoint (`app/api/phrases/search/route.ts`)

**GET /api/phrases/search**

Query params:
- `phraseIds` (opcional): IDs de frases separados por coma
- `recordingsDir` (opcional): Directorio de grabaciones

Respuesta:
```json
{
  "success": true,
  "data": {
    "totalFolders": 10,
    "foldersWithMatches": 5,
    "totalMatches": 15,
    "phraseStats": [...],
    "results": [...]
  },
  "message": "Búsqueda completada: 15 coincidencias encontradas en 5 grabaciones"
}
```

**POST /api/phrases/search**

Body:
```json
{
  "phraseIds": ["phrase-id-1", "phrase-id-2"],
  "recordingsDir": "./recordings",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31"
}
```

Permite filtrado avanzado por fechas.

### 3. Interfaz de Usuario

**Componente**: `components/phrase-search-results.tsx`

**Características:**

- Filtros por fecha (desde/hasta)
- Búsqueda de todas las frases o frases específicas
- Estadísticas generales:
  - Total de grabaciones analizadas
  - Grabaciones con coincidencias
  - Total de coincidencias
  - Frases encontradas
- Estadísticas por frase (cuántas veces aparece cada una)
- Resultados detallados expandibles
- Exportación a JSON

**Página**: `/busqueda-frases`

Página dedicada para acceder a la funcionalidad.

## Estructura de Datos

### PhraseMatch
```typescript
{
  phraseId: string;
  phrase: string;
  brand: string;
  campaign?: string;
  matchedText: string;        // Texto exacto encontrado
  confidence: number;         // 0-1 (1 = coincidencia exacta)
  position: number;           // Posición del carácter
  wordPosition: number;       // Posición de la palabra
  context: string;            // Contexto (±50 caracteres)
}
```

### TranscriptionSearchResult
```typescript
{
  folderName: string;         // Nombre de la carpeta de grabación
  folderPath: string;         // Ruta completa
  audioFile: string;          // Nombre del archivo de audio
  transcriptionFile: string;  // Ruta del archivo de transcripción
  transcriptionLength: number;
  wordCount: number;
  matches: PhraseMatch[];     // Todas las coincidencias
  timestamp: string;          // Timestamp extraído del nombre de carpeta
}
```

### SearchSummary
```typescript
{
  totalFolders: number;
  foldersWithMatches: number;
  totalMatches: number;
  phraseStats: Array<{
    phraseId: string;
    phrase: string;
    brand: string;
    matchCount: number;
  }>;
  results: TranscriptionSearchResult[];
}
```

## Flujo de Trabajo

1. **Usuario accede** a `/busqueda-frases`
2. **Configura filtros** (opcional):
   - Fecha desde/hasta
   - Frases específicas (futuro)
3. **Hace clic en "Buscar"**
4. **Sistema procesa**:
   - Lee frases activas de la BD
   - Escanea carpetas de grabaciones
   - Lee archivos `transcription.txt`
   - Busca cada frase en cada transcripción
   - Calcula posiciones y contexto
5. **Muestra resultados**:
   - Estadísticas generales
   - Estadísticas por frase
   - Resultados detallados (expandibles)
6. **Usuario puede**:
   - Expandir/colapsar resultados
   - Ver contexto de cada coincidencia
   - Exportar resultados a JSON

## Formato de Carpetas de Grabación

Las carpetas de grabación deben seguir el formato:
```
{RadioName}_{YYYY-MM-DD}_{HH-MM-SS}/
  ├── audio.mp3
  ├── transcription.txt
  └── transcription.json (metadata)
```

Ejemplo:
```
Radio_Cooperativa_2024-10-13_14-30-00/
  ├── Radio_Cooperativa_2024-10-13_14-30-00.mp3
  ├── transcription.txt
  └── transcription.json
```

## Configuración

### Directorio de Grabaciones

Por defecto: `./recordings`

Se puede configurar:
- En el servicio: `phraseSearchService.setRecordingsDir('/path/to/recordings')`
- En la API: Query param `recordingsDir` o body `recordingsDir`

### Umbral de Confianza

Configurado por frase en la BD (campo `confidence`):
- Default: 0.85 (85%)
- Rango: 0.0 - 1.0
- 1.0 = solo coincidencias exactas
- < 1.0 = permite coincidencias difusas

## Algoritmo de Búsqueda

### 1. Búsqueda Exacta
```
1. Normalizar texto (lowercase)
2. Buscar substring exacto
3. Extraer contexto (±50 caracteres)
4. Calcular posición de palabra
5. Confianza = 1.0
```

### 2. Búsqueda Difusa (si no hay exactas)
```
1. Dividir texto en ventanas del tamaño de la frase
2. Para cada ventana:
   - Calcular similitud de Levenshtein
   - Si similitud >= umbral:
     - Registrar coincidencia
     - Confianza = similitud
```

### 3. Distancia de Levenshtein
```
Mide el número mínimo de operaciones (inserción, eliminación, sustitución)
necesarias para transformar un string en otro.

Similitud = (len_max - distancia) / len_max
```

## Casos de Uso

### 1. Auditoría de Publicidad
"¿Cuántas veces se mencionó 'Coca-Cola' en las grabaciones de esta semana?"

### 2. Verificación de Campañas
"¿Se transmitió el spot de 'Verano 2024' en las fechas acordadas?"

### 3. Análisis de Competencia
"¿Qué marcas competidoras aparecen en las grabaciones?"

### 4. Compliance
"¿Se cumplieron los contratos de publicidad?"

## Limitaciones Actuales

1. **Solo texto plano**: No analiza audio directamente, depende de transcripciones
2. **Sin timestamps de audio**: Reporta posición en texto, no tiempo exacto en audio
3. **Búsqueda secuencial**: Puede ser lenta con muchas grabaciones
4. **Sin caché**: Cada búsqueda procesa todo desde cero

## Mejoras Futuras

### Corto Plazo
- [ ] Selector de frases en UI
- [ ] Paginación de resultados
- [ ] Ordenamiento (por fecha, por coincidencias, etc.)
- [ ] Filtros adicionales (por radio, por marca, etc.)

### Mediano Plazo
- [ ] Caché de resultados
- [ ] Búsqueda incremental
- [ ] Índice de búsqueda (Elasticsearch/Algolia)
- [ ] Timestamps de audio precisos

### Largo Plazo
- [ ] Búsqueda en tiempo real durante transcripción
- [ ] Alertas automáticas cuando se detecta una frase
- [ ] Análisis de sentimiento
- [ ] Reconocimiento de voz del locutor

## Integración con Sistema Existente

### Frases (BD)
- Usa tabla `Phrase` existente
- Campo `active` determina qué frases buscar
- Campo `confidence` configura umbral de búsqueda

### Transcripciones (VPS)
- Lee archivos generados por `transcription-manager.js`
- Formato: `transcription.txt` (texto plano)
- Metadata: `transcription.json` (opcional)

### Detecciones (Futuro)
- Podría crear registros en tabla `Detection`
- Vincular con `Capture`, `Session`, `Radio`
- Permitir verificación manual

## Ejemplo de Uso

```typescript
// Buscar todas las frases activas
const results = await phraseSearchService.searchAllTranscriptions();

console.log(`Encontradas ${results.totalMatches} coincidencias`);

// Buscar frases específicas
const specificResults = await phraseSearchService.searchSpecificPhrases([
  'phrase-id-1',
  'phrase-id-2'
]);

// Exportar resultados
const json = JSON.stringify(results, null, 2);
fs.writeFileSync('results.json', json);
```

## Troubleshooting

### No se encuentran grabaciones
- Verificar que `recordingsDir` apunte al directorio correcto
- Verificar permisos de lectura
- Verificar formato de carpetas

### No se encuentran transcripciones
- Verificar que existan archivos `transcription.txt`
- Ejecutar `transcription-manager.js` si faltan

### Búsqueda muy lenta
- Reducir rango de fechas
- Buscar frases específicas en lugar de todas
- Considerar implementar caché o índice

### Muchos falsos positivos
- Aumentar umbral de confianza en la frase
- Usar frases más específicas
- Revisar variantes de la frase

## Soporte

Para dudas o problemas:
1. Revisar logs del servidor
2. Verificar estructura de archivos
3. Probar con búsqueda simple primero
4. Contactar al equipo de desarrollo
