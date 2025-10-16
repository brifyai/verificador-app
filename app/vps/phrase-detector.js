/**
 * Detector automático de frases en transcripciones
 * Se ejecuta automáticamente después de cada transcripción
 */

const fs = require('fs');
const path = require('path');
const NotificationService = require('./notification-service');
const axios = require('axios');
const { Client } = require('pg');

class PhraseDetector {
  constructor() {
    this.notificationService = new NotificationService();
    this.aiConfig = null;
    this.dbClient = null;
  }

  /**
   * Conectar a la base de datos PostgreSQL
   */
  async connectToDatabase() {
    if (this.dbClient) {
      return this.dbClient; // Ya está conectado
    }

    try {
      this.dbClient = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CuHOsyb3Xh7g@ep-sparkling-block-acyyvpq7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
        ssl: {
          rejectUnauthorized: false
        }
      });

      await this.dbClient.connect();
      console.log('✅ Conectado a la base de datos PostgreSQL');
      return this.dbClient;
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error.message);
      this.dbClient = null;
      return null;
    }
  }

  /**
   * Cargar configuración de IA específica del usuario desde la base de datos
   */
  async loadUserAIConfig(userId, selectedProvider) {
    try {
      console.log(`📥 Cargando configuración de IA (${selectedProvider}) desde BD...`);
      
      // Conectar a la base de datos
      const db = await this.connectToDatabase();
      if (!db) {
        console.log('⚠️ No se pudo conectar a la base de datos');
        return null;
      }

      // Buscar el proveedor específico en la base de datos
      const query = `
        SELECT id, provider, "apiKey", model, enabled, priority, "costPerUnit", "rateLimit", metadata
        FROM api_configurations
        WHERE id = $1 OR provider = $1
        LIMIT 1
      `;
      
      const result = await db.query(query, [selectedProvider]);

      if (result.rows.length === 0) {
        console.log(`⚠️ No se encontró configuración para ${selectedProvider} en la BD`);
        return null;
      }

      const providerConfig = result.rows[0];
      const metadata = providerConfig.metadata || {};

      // Verificar que sea de tipo analysis
      if (metadata.type !== 'analysis') {
        console.log(`⚠️ ${selectedProvider} no es un proveedor de análisis (tipo: ${metadata.type})`);
        return null;
      }

      if (!providerConfig.apiKey || providerConfig.apiKey === '') {
        console.log(`⚠️ ${selectedProvider} no tiene API key configurada`);
        console.log(`💡 Configure la API key en /configuracion para usar esta IA`);
        return null;
      }

      // Usar el modelo de la BD (campo 'model'), o el primero del metadata, o el default
      const selectedModel = providerConfig.model || 
        (metadata.models && metadata.models.length > 0 ? metadata.models[0].id : null) ||
        this.getDefaultModel(selectedProvider);

      this.aiConfig = {
        provider: selectedProvider,
        model: selectedModel,
        apiKey: providerConfig.apiKey,
        baseUrl: metadata.baseUrl || '',
        systemPrompt: metadata.systemPrompt || null // Prompt personalizado desde BD
      };

      console.log(`🤖 IA configurada desde BD: ${this.aiConfig.provider} (${this.aiConfig.model})`);
      if (this.aiConfig.systemPrompt) {
        console.log(`📝 Usando prompt personalizado desde BD`);
      }
      return this.aiConfig;

    } catch (error) {
      console.error('❌ Error cargando configuración de IA desde BD:', error.message);
      return null;
    }
  }

  /**
   * Cargar configuración de IA desde la base de datos (fallback)
   * Solo se usa si no se especificó aiProvider en recording_info.json
   */
  async loadAIConfig() {
    if (this.aiConfig) {
      return this.aiConfig; // Ya está cargada
    }

    try {
      console.log('📥 Cargando configuración de IA desde BD (fallback)...');
      
      // Conectar a la base de datos
      const db = await this.connectToDatabase();
      if (!db) {
        console.log('⚠️ No se pudo conectar a la base de datos');
        return null;
      }

      // Buscar proveedores de análisis con API key configurada, ordenados por prioridad
      const query = `
        SELECT id, provider, "apiKey", model, enabled, priority, "costPerUnit", "rateLimit", metadata
        FROM api_configurations
        WHERE "apiKey" IS NOT NULL AND "apiKey" != ''
        ORDER BY priority ASC
        LIMIT 10
      `;
      
      const result = await db.query(query);

      if (result.rows.length === 0) {
        console.log('⚠️ No hay proveedores de IA con API key configurada en la BD');
        console.log('💡 Configure al menos una API key en /configuracion');
        return null;
      }

      // Filtrar solo los de tipo analysis
      const aiProviders = result.rows.filter(p => {
        const metadata = p.metadata || {};
        return metadata.type === 'analysis';
      });

      if (aiProviders.length === 0) {
        console.log('⚠️ No hay proveedores de análisis con API key configurada');
        return null;
      }

      // Usar el primer proveedor con API key (mayor prioridad)
      const provider = aiProviders[0];
      const metadata = provider.metadata || {};
      
      // Usar el modelo de la BD (campo 'model'), o el primero del metadata, o el default
      const selectedModel = provider.model || 
        (metadata.models && metadata.models.length > 0 ? metadata.models[0].id : null) ||
        this.getDefaultModel(provider.id);
      
      this.aiConfig = {
        provider: provider.id,
        model: selectedModel,
        apiKey: provider.apiKey,
        baseUrl: metadata.baseUrl || ''
      };

      console.log(`🤖 IA configurada desde BD (fallback): ${this.aiConfig.provider} (${this.aiConfig.model})`);
      return this.aiConfig;

    } catch (error) {
      console.error('❌ Error cargando configuración de IA desde BD:', error.message);
      return null;
    }
  }

  /**
   * Obtener modelo por defecto según proveedor
   */
  getDefaultModel(provider) {
    const defaults = {
      'openai-gpt': 'gpt-4o-mini',
      'anthropic-claude': 'claude-3-5-sonnet-20241022',
      'groq-llama': 'llama-3.3-70b-versatile',
      'abacus-ai': 'abacus-ai-default'
    };
    return defaults[provider] || 'gpt-4o-mini';
  }

  /**
   * Normalizar números en texto (convertir dígitos a palabras y viceversa)
   */
  normalizeNumbers(text) {
    const numberMap = {
      '0': 'cero', '1': 'uno', '2': 'dos', '3': 'tres', '4': 'cuatro',
      '5': 'cinco', '6': 'seis', '7': 'siete', '8': 'ocho', '9': 'nueve',
      '10': 'diez', '11': 'once', '12': 'doce', '13': 'trece', '14': 'catorce',
      '15': 'quince', '16': 'dieciséis', '17': 'diecisiete', '18': 'dieciocho',
      '19': 'diecinueve', '20': 'veinte', '30': 'treinta', '40': 'cuarenta',
      '50': 'cincuenta', '60': 'sesenta', '70': 'setenta', '80': 'ochenta',
      '90': 'noventa', '100': 'cien', '1000': 'mil'
    };

    let normalized = text.toLowerCase();
    
    // Reemplazar números por palabras
    Object.entries(numberMap).forEach(([num, word]) => {
      const regex = new RegExp(`\\b${num}\\b`, 'g');
      normalized = normalized.replace(regex, word);
    });
    
    return normalized;
  }

  /**
   * Calcular similitud entre dos textos (porcentaje de palabras coincidentes)
   */
  calculateSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let matches = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++;
      }
    });
    
    return matches / words1.length;
  }

  /**
   * Eliminar coincidencias superpuestas (mantener solo la mejor de cada grupo)
   */
  removeDuplicates(matches, minDistance = 5) {
    if (matches.length === 0) return [];
    
    const filtered = [];
    const used = new Set();
    
    // Ordenar por confianza (mejor primero)
    const sorted = [...matches].sort((a, b) => b.confidence - a.confidence);
    
    for (const match of sorted) {
      // Verificar si esta posición ya fue usada o está muy cerca de una usada
      let tooClose = false;
      for (const usedPos of used) {
        if (Math.abs(match.position - usedPos) < minDistance) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        filtered.push(match);
        used.add(match.position);
      }
    }
    
    // Ordenar por posición
    return filtered.sort((a, b) => a.position - b.position);
  }

  /**
   * Búsqueda fuzzy: buscar fragmentos similares en la transcripción
   */
  fuzzySearch(transcriptionText, targetPhrase) {
    const targetWords = targetPhrase.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const transcriptionWords = transcriptionText.toLowerCase().split(/\s+/);
    
    const matches = [];
    
    // Probar diferentes tamaños de ventana para capturar frases incompletas
    const windowSizes = [
      targetWords.length + 2,  // Ventana completa
      targetWords.length + 1,  // Ventana ajustada
      targetWords.length,      // Ventana exacta
      Math.max(3, targetWords.length - 1), // Ventana reducida (para frases incompletas)
      Math.max(3, targetWords.length - 2)  // Ventana muy reducida
    ];
    
    for (const windowSize of windowSizes) {
      // Buscar en ventanas deslizantes (saltar de 2 en 2 para evitar solapamiento excesivo)
      for (let i = 0; i <= transcriptionWords.length - Math.min(3, windowSize); i += 2) {
        const window = transcriptionWords.slice(i, i + windowSize).join(' ');
        const windowNormalized = this.normalizeNumbers(window);
        const targetNormalized = this.normalizeNumbers(targetPhrase);
        
        const similarity = this.calculateSimilarity(windowNormalized, targetNormalized);
        
        // Umbral más bajo: 50% para capturar frases incompletas
        if (similarity >= 0.50) {
          const matchedText = transcriptionWords.slice(i, i + windowSize).join(' ');
          
          // Determinar nivel de confianza
          let confidenceLevel = '';
          if (similarity >= 0.85) {
            confidenceLevel = 'Alta';
          } else if (similarity >= 0.70) {
            confidenceLevel = 'Media-Alta';
          } else if (similarity >= 0.60) {
            confidenceLevel = 'Media';
          } else {
            confidenceLevel = 'Baja - Requiere verificación';
          }
          
          matches.push({
            text: matchedText,
            confidence: similarity,
            position: i,
            reason: `Similitud: ${(similarity * 100).toFixed(0)}% (${confidenceLevel}) - Búsqueda fuzzy con normalización numérica`
          });
        }
      }
    }
    
    // Eliminar duplicados y ordenar por confianza
    const uniqueMatches = this.removeDuplicates(matches, Math.max(3, Math.floor(targetWords.length / 2)));
    return uniqueMatches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Verificar con IA si un texto contiene una frase (búsqueda semántica)
   */
  async verifyWithAI(transcriptionText, targetPhrase) {
    // Cargar configuración de IA si no está cargada
    if (!this.aiConfig) {
      await this.loadAIConfig();
    }

    if (!this.aiConfig || !this.aiConfig.apiKey) {
      return null; // Sin IA, usar búsqueda tradicional
    }

    try {
      // Usar prompt personalizado de la BD o el prompt por defecto
      const defaultPrompt = `Analiza el siguiente texto de transcripción de radio y determina si contiene menciones de la siguiente frase publicitaria.

IMPORTANTE: Considera estas variaciones como VÁLIDAS:
- Números escritos en palabras vs dígitos (ej: "15" = "quince", "19990" = "diecinueve mil novecientos noventa")
- Palabras faltantes u omitidas
- Orden ligeramente diferente
- Sinónimos o palabras similares
- Errores de transcripción automática

FRASE OBJETIVO: "${targetPhrase}"

TEXTO DE TRANSCRIPCIÓN:
${transcriptionText}

Responde SOLO en formato JSON con esta estructura:
{
  "found": true/false,
  "matches": [
    {
      "text": "texto exacto encontrado en la transcripción",
      "confidence": 0.0-1.0,
      "position": posición aproximada en caracteres,
      "reason": "explicación de por qué coincide (ej: 'iPhone 15 = iPhone quince')"
    }
  ]
}

CRITERIOS DE CONFIANZA:
- 0.95-1.0: Coincidencia casi perfecta (solo variaciones numéricas)
- 0.85-0.94: Buena coincidencia (1-2 palabras diferentes)
- 0.70-0.84: Coincidencia aceptable (varias palabras diferentes pero mismo mensaje)
- <0.70: No reportar

Si no encuentras ninguna coincidencia con confianza >= 0.70, devuelve {"found": false, "matches": []}`;

      // Si hay prompt personalizado, reemplazar las variables
      const prompt = this.aiConfig.systemPrompt 
        ? this.aiConfig.systemPrompt
            .replace('{{targetPhrase}}', targetPhrase)
            .replace('{{transcriptionText}}', transcriptionText)
        : defaultPrompt;

      let response;

      console.log(`   🔧 Proveedor de IA: ${this.aiConfig.provider}`);
      console.log(`   🔧 Modelo: ${this.aiConfig.model}`);
      console.log(`   🔧 Base URL: ${this.aiConfig.baseUrl}`);

      // Llamar a la IA según el proveedor
      if (this.aiConfig.provider === 'openai-gpt' || this.aiConfig.provider === 'openai') {
        response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: this.aiConfig.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Eres un experto en análisis de transcripciones de radio y detección de menciones publicitarias.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.aiConfig.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const content = response.data.choices[0].message.content;
        return JSON.parse(content);

      } else if (this.aiConfig.provider === 'anthropic-claude' || this.aiConfig.provider === 'anthropic') {
        response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: this.aiConfig.model || 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [
              { role: 'user', content: prompt }
            ]
          },
          {
            headers: {
              'x-api-key': this.aiConfig.apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            }
          }
        );

        const content = response.data.content[0].text;
        return JSON.parse(content);

      } else if (this.aiConfig.provider === 'groq-llama' || this.aiConfig.provider === 'groq') {
        response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: this.aiConfig.model || 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'Eres un experto en análisis de transcripciones de radio. Responde SOLO en formato JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.aiConfig.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const content = response.data.choices[0].message.content;
        return JSON.parse(content);

      } else if (this.aiConfig.provider === 'abacus-ai' || this.aiConfig.provider === 'abacus') {
        // Abacus AI - Ajustar según su API real
        response = await axios.post(
          'https://api.abacus.ai/v1/chat/completions',
          {
            model: this.aiConfig.model || 'abacus-ai-default',
            messages: [
              { role: 'system', content: 'Eres un experto en análisis de transcripciones de radio. Responde SOLO en formato JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1
          },
          {
            headers: {
              'Authorization': `Bearer ${this.aiConfig.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const content = response.data.choices[0].message.content;
        return JSON.parse(content);

      } else if (this.aiConfig.provider === 'deepgram') {
        // Deepgram - Nota: Deepgram es principalmente para transcripción, no análisis
        // Si se usa para análisis, necesitaría un endpoint diferente
        console.log('⚠️ Deepgram es principalmente para transcripción, no análisis de texto');
        return null;
      }

    } catch (error) {
      console.error('❌ Error verificando con IA:', error.message);
      if (error.response) {
        console.error('📋 Respuesta de la API:', error.response.status, error.response.statusText);
        console.error('📋 Datos:', JSON.stringify(error.response.data, null, 2));
      }
      return null;
    }
  }

  /**
   * Detectar frases en una transcripción recién completada
   * Prioriza la frase del recording_info.json si existe
   */
  async detectPhrasesInTranscription(folderPath, folderName) {
    try {
      console.log(`\n🔍 Buscando frases en: ${folderName}`);
      
      // IMPORTANTE: Limpiar configuración de IA anterior
      this.aiConfig = null;

      // PRIORIDAD 1: Buscar frase específica del recording_info.json
      const recordingInfoPath = path.join(folderPath, 'recording_info.json');
      let phrasesToSearch = [];
      let userId = null;
      let selectedAIProvider = null;

      if (fs.existsSync(recordingInfoPath)) {
        try {
          const recordingInfo = JSON.parse(fs.readFileSync(recordingInfoPath, 'utf8'));
          
          // Extraer userId y proveedor de IA seleccionado
          userId = recordingInfo.userId;
          selectedAIProvider = recordingInfo.aiProvider; // 'openai', 'anthropic', 'groq', 'abacus', 'deepgram'
          
          if (selectedAIProvider) {
            console.log(`   🤖 IA seleccionada por el usuario: ${selectedAIProvider}`);
          }
          
          if (recordingInfo.phrase && recordingInfo.phrase.text) {
            console.log(`   🎯 Frase específica del monitoreo: "${recordingInfo.phrase.text}"`);
            
            // Usar la frase específica del monitoreo
            phrasesToSearch = [{
              id: recordingInfo.phrase.id || 'monitoring_phrase',
              phrase: recordingInfo.phrase.text,
              brand: recordingInfo.phrase.brand || 'Unknown',
              campaign: recordingInfo.phrase.campaign,
              confidence: 0.85, // Umbral por defecto
            }];
          }
        } catch (error) {
          console.log('   ⚠️ Error leyendo recording_info.json:', error.message);
        }
      }

      // Cargar configuración de IA específica del usuario
      if (selectedAIProvider && userId) {
        await this.loadUserAIConfig(userId, selectedAIProvider);
      } else if (!selectedAIProvider) {
        console.log('   ⚠️ No se especificó IA para este monitoreo, se omitirá análisis con IA');
      }

      // Si no hay frase específica, no hay nada que buscar
      if (phrasesToSearch.length === 0) {
        console.log('   ⚠️ No hay recording_info.json con frase específica');
        console.log('   ℹ️ El sistema requiere que cada grabación tenga su frase configurada');
        return { success: true, matches: 0, detections: [] };
      }

      // Leer transcripción
      const transcriptionPath = path.join(folderPath, 'transcription.txt');
      if (!fs.existsSync(transcriptionPath)) {
        console.log('   ⚠️ No se encontró archivo de transcripción');
        return { success: false, error: 'No transcription file' };
      }

      const transcriptionText = fs.readFileSync(transcriptionPath, 'utf8');
      const normalizedText = transcriptionText.toLowerCase();

      // Buscar cada frase
      const detections = [];
      let totalMatches = 0;

      for (const phrase of phrasesToSearch) {
        console.log(`   🔍 Buscando: "${phrase.phrase}"...`);
        
        // 1. Búsqueda exacta/tradicional
        const exactMatches = this.findPhraseInText(
          transcriptionText,
          normalizedText,
          phrase
        );

        if (exactMatches.length > 0) {
          console.log(`   ✓ Encontradas ${exactMatches.length} coincidencia(s) exacta(s)`);
        }

        // 2. Búsqueda fuzzy (palabra por palabra con normalización numérica)
        console.log(`   🔍 Búsqueda fuzzy (normalización numérica)...`);
        const fuzzyMatches = this.fuzzySearch(transcriptionText, phrase.phrase);
        
        if (fuzzyMatches.length > 0) {
          console.log(`   ✓ Búsqueda fuzzy encontró ${fuzzyMatches.length} coincidencia(s):`);
          fuzzyMatches.forEach((match, idx) => {
            console.log(`      ${idx + 1}. "${match.text.substring(0, 80)}..." (${(match.confidence * 100).toFixed(0)}%)`);
          });
        }

        // 3. Usar IA para búsqueda semántica si está configurada (solo si fuzzy no encontró nada)
        let aiMatches = [];
        
        // Solo usar IA si fue configurada específicamente para este monitoreo
        if (this.aiConfig && fuzzyMatches.length === 0) {
          console.log(`   🤖 Verificando con IA para detectar variaciones semánticas...`);
          const aiResult = await this.verifyWithAI(transcriptionText, phrase.phrase);
          
          if (aiResult && aiResult.found && aiResult.matches) {
            aiMatches = aiResult.matches.map(match => ({
              matchedText: match.text,
              confidence: match.confidence,
              position: match.position || 0,
              wordPosition: 0,
              context: this.extractContext(transcriptionText, match.position || 0, 100),
              verifiedBy: 'AI',
              aiReason: match.reason,
              needsHumanVerification: match.confidence < 0.85 // Requiere verificación si confianza < 85%
            }));
            
            console.log(`   🤖 IA encontró ${aiMatches.length} coincidencia(s) semántica(s)`);
            aiMatches.forEach((m, idx) => {
              console.log(`      ${idx + 1}. "${m.matchedText}" (confianza: ${(m.confidence * 100).toFixed(0)}%)`);
              console.log(`         💡 ${m.aiReason}`);
              if (m.needsHumanVerification) {
                console.log(`         ⚠️ Requiere verificación humana`);
              }
            });
          } else {
            console.log(`   🤖 IA no encontró coincidencias semánticas`);
          }
        }

        // Convertir fuzzyMatches al formato esperado
        const fuzzyMatchesFormatted = fuzzyMatches.map(match => ({
          matchedText: match.text,
          confidence: match.confidence,
          position: match.position,
          wordPosition: match.position,
          context: match.text,
          verifiedBy: 'Fuzzy',
          aiReason: match.reason,
          needsHumanVerification: match.confidence < 0.70 // Requiere verificación si < 70%
        }));

        // Combinar resultados
        const allMatches = [...exactMatches, ...fuzzyMatchesFormatted, ...aiMatches];

        if (allMatches.length > 0) {
          totalMatches += allMatches.length;
          detections.push({
            phrase: phrase.phrase,
            brand: phrase.brand,
            campaign: phrase.campaign,
            matches: allMatches,
            hasAIMatches: aiMatches.length > 0,
            needsVerification: allMatches.some(m => m.needsHumanVerification) // Verificar TODOS los matches
          });

          const exactCount = exactMatches.length;
          const aiCount = aiMatches.length;
          console.log(`   ✓ "${phrase.phrase}" encontrada ${allMatches.length} vez/veces (${exactCount} exacta(s), ${aiCount} con IA)`);
        } else {
          console.log(`   ✗ "${phrase.phrase}" no encontrada`);
        }
      }

      // Guardar resultados en archivo
      if (detections.length > 0) {
        const detectionsFile = path.join(folderPath, 'phrase-detections.json');
        const detectionsData = {
          folderName: folderName,
          timestamp: new Date().toISOString(),
          totalMatches: totalMatches,
          detections: detections,
        };

        fs.writeFileSync(detectionsFile, JSON.stringify(detectionsData, null, 2));
        console.log(`   💾 Detecciones guardadas: ${detectionsFile}`);

        // 🔔 CREAR NOTIFICACIÓN DE ALERTA
        // Si la frase fue del monitoreo específico (recording_info.json), crear alerta
        if (fs.existsSync(recordingInfoPath)) {
          try {
            const recordingInfo = JSON.parse(fs.readFileSync(recordingInfoPath, 'utf8'));
            
            if (recordingInfo.phrase && recordingInfo.phrase.text) {
              // Extraer fecha de grabación del nombre de carpeta
              const recordingDate = this.extractTimestampFromFolderName(folderName);
              
              // Crear notificación para cada frase detectada
              for (const detection of detections) {
                await this.notificationService.createPhraseDetectionAlert({
                  folderName: folderName,
                  phrase: detection.phrase,
                  brand: detection.brand,
                  campaign: detection.campaign,
                  totalMatches: detection.matches.length,
                  recordingDate: recordingDate,
                  matches: detection.matches, // Incluir todas las coincidencias con sus metadatos
                  userId: userId, // ID del usuario que creó el monitoreo
                  needsVerification: detection.needsVerification // Si requiere verificación humana
                });
              }
            }
          } catch (error) {
            console.log('   ⚠️ Error creando notificación:', error.message);
          }
        }
      }

      console.log(`   📊 Total: ${totalMatches} coincidencias en ${detections.length} frases diferentes`);

      return {
        success: true,
        matches: totalMatches,
        detections: detections,
      };
    } catch (error) {
      console.error('❌ Error detectando frases:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extraer contexto alrededor de una posición
   */
  extractContext(text, position, radius = 50) {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    let context = text.substring(start, end);
    
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context.trim();
  }

  /**
   * Buscar una frase en el texto
   */
  findPhraseInText(originalText, normalizedText, phrase) {
    const matches = [];
    const normalizedPhrase = phrase.phrase.toLowerCase();
    let position = 0;

    // Búsqueda exacta
    while ((position = normalizedText.indexOf(normalizedPhrase, position)) !== -1) {
      const matchedText = originalText.substring(position, position + phrase.phrase.length);
      const wordsBefore = originalText.substring(0, position).split(/\s+/).length;

      // Extraer contexto
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(originalText.length, position + phrase.phrase.length + 50);
      const context = originalText.substring(contextStart, contextEnd);

      matches.push({
        matchedText: matchedText,
        confidence: 1.0,
        position: position,
        wordPosition: wordsBefore,
        context: `...${context}...`,
      });

      position += phrase.phrase.length;
    }

    // Si no hay coincidencias exactas y el umbral lo permite, buscar difusas
    if (matches.length === 0 && phrase.confidence < 1.0) {
      const fuzzyMatches = this.findFuzzyMatches(
        originalText,
        normalizedText,
        phrase.phrase,
        phrase.confidence
      );
      matches.push(...fuzzyMatches);
    }

    return matches;
  }

  /**
   * Búsqueda difusa de frases
   */
  findFuzzyMatches(originalText, normalizedText, phrase, minConfidence) {
    const matches = [];
    const phraseWords = phrase.toLowerCase().split(/\s+/);
    const textWords = originalText.split(/\s+/);

    for (let i = 0; i <= textWords.length - phraseWords.length; i++) {
      const windowWords = textWords.slice(i, i + phraseWords.length);
      const windowText = windowWords.join(' ');
      const similarity = this.calculateSimilarity(
        phraseWords.join(' '),
        windowText.toLowerCase()
      );

      if (similarity >= minConfidence) {
        const position = originalText.indexOf(windowText);

        if (position !== -1) {
          const contextStart = Math.max(0, position - 50);
          const contextEnd = Math.min(originalText.length, position + windowText.length + 50);
          const context = originalText.substring(contextStart, contextEnd);

          matches.push({
            matchedText: windowText,
            confidence: similarity,
            position: position,
            wordPosition: i,
            context: `...${context}...`,
          });
        }
      }
    }

    return matches;
  }

  /**
   * Calcular similitud entre dos textos
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Distancia de Levenshtein
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Procesar todas las transcripciones pendientes de análisis
   * Solo procesa carpetas que tengan recording_info.json
   */
  async processAllPendingDetections(recordingsDir = './recordings') {
    try {
      console.log('\n🔍 Procesando detecciones pendientes...');
      console.log('ℹ️ Solo se procesarán carpetas con recording_info.json\n');

      const folders = this.findRecordingFolders(recordingsDir);
      let processed = 0;
      let totalDetections = 0;
      let skipped = 0;

      for (const folder of folders) {
        const transcriptionPath = path.join(folder.path, 'transcription.txt');
        const detectionsPath = path.join(folder.path, 'phrase-detections.json');
        const recordingInfoPath = path.join(folder.path, 'recording_info.json');

        // Solo procesar si tiene transcripción, recording_info.json y no tiene detecciones
        if (fs.existsSync(transcriptionPath) && 
            fs.existsSync(recordingInfoPath) && 
            !fs.existsSync(detectionsPath)) {
          
          const result = await this.detectPhrasesInTranscription(
            folder.path,
            folder.name
          );

          if (result.success) {
            processed++;
            totalDetections += result.matches || 0;
          }

          // Pausa entre procesamiento
          await this.sleep(500);
        } else if (!fs.existsSync(recordingInfoPath)) {
          skipped++;
        }
      }

      console.log(`\n✅ Procesamiento completado:`);
      console.log(`   📁 Carpetas procesadas: ${processed}`);
      console.log(`   ⏭️ Carpetas omitidas (sin recording_info.json): ${skipped}`);
      console.log(`   🎯 Total de detecciones: ${totalDetections}`);

      return { processed, detections: totalDetections, skipped };
    } catch (error) {
      console.error('❌ Error procesando detecciones pendientes:', error);
      return { processed: 0, detections: 0, skipped: 0, error: error.message };
    }
  }

  /**
   * Encontrar carpetas de grabaciones
   */
  findRecordingFolders(recordingsDir) {
    const folders = [];

    if (!fs.existsSync(recordingsDir)) {
      return folders;
    }

    const items = fs.readdirSync(recordingsDir);

    for (const item of items) {
      const itemPath = path.join(recordingsDir, item);

      try {
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          folders.push({
            name: item,
            path: itemPath,
            created: stat.birthtime,
          });
        }
      } catch (error) {
        // Ignorar errores de lectura
      }
    }

    return folders.sort((a, b) => b.created - a.created);
  }

  /**
   * Extraer timestamp del nombre de carpeta
   */
  extractTimestampFromFolderName(folderName) {
    const parts = folderName.split('_');
    
    if (parts.length >= 3) {
      const date = parts[parts.length - 2]; // YYYY-MM-DD
      const time = parts[parts.length - 1].replace(/-/g, ':'); // HH:MM:SS
      return `${date} ${time}`;
    }

    return new Date().toISOString();
  }

  /**
   * Función auxiliar para pausas
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cerrar recursos
   */
  async disconnect() {
    if (this.dbClient) {
      try {
        await this.dbClient.end();
        console.log('✅ Conexión a BD cerrada');
      } catch (error) {
        console.error('❌ Error cerrando conexión a BD:', error.message);
      }
      this.dbClient = null;
    }
    return Promise.resolve();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const detector = new PhraseDetector();
  const recordingsDir = process.argv[2] || './recordings';

  console.log('🎙️ Detector Automático de Frases');
  console.log(`📁 Directorio: ${recordingsDir}\n`);

  detector
    .processAllPendingDetections(recordingsDir)
    .then((result) => {
      console.log('\n✅ Proceso completado');
      return detector.disconnect();
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      return detector.disconnect();
    })
    .finally(() => {
      process.exit(0);
    });
}

module.exports = PhraseDetector;
