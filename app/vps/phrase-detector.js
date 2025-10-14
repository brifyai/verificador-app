/**
 * Detector automático de frases en transcripciones
 * Se ejecuta automáticamente después de cada transcripción
 */

const fs = require('fs');
const path = require('path');
const NotificationService = require('./notification-service');
const axios = require('axios');

class PhraseDetector {
  constructor() {
    this.notificationService = new NotificationService();
    this.aiConfig = null;
    this.apiProvidersPath = path.join(__dirname, 'api_providers.json');
  }

  /**
   * Cargar configuración de IA específica del usuario desde api_providers.json
   */
  async loadUserAIConfig(userId, selectedProvider) {
    try {
      console.log(`📥 Cargando configuración de IA (${selectedProvider})...`);
      
      // Leer archivo api_providers.json
      if (!fs.existsSync(this.apiProvidersPath)) {
        console.log(`⚠️ No se encontró archivo api_providers.json`);
        return null;
      }

      const providersData = JSON.parse(fs.readFileSync(this.apiProvidersPath, 'utf8'));
      
      // Buscar el proveedor de tipo "analysis" que coincida
      // NO verificar enabled - el usuario ya lo seleccionó
      const providerConfig = providersData.find(p => 
        p.id === selectedProvider && 
        p.type === 'analysis'
      );

      if (!providerConfig) {
        console.log(`⚠️ No se encontró configuración para ${selectedProvider}`);
        console.log(`💡 Proveedores disponibles: ${providersData.filter(p => p.type === 'analysis').map(p => p.id).join(', ')}`);
        return null;
      }

      if (!providerConfig.apiKey || providerConfig.apiKey === '') {
        console.log(`⚠️ ${selectedProvider} no tiene API key configurada`);
        console.log(`💡 Configure la API key en /configuracion para usar esta IA`);
        return null;
      }

      // Usar el primer modelo disponible
      const defaultModel = providerConfig.models && providerConfig.models.length > 0 
        ? providerConfig.models[0].id 
        : this.getDefaultModel(selectedProvider);

      this.aiConfig = {
        provider: selectedProvider,
        model: defaultModel,
        apiKey: providerConfig.apiKey,
        baseUrl: providerConfig.baseUrl
      };

      console.log(`🤖 IA configurada: ${this.aiConfig.provider} (${this.aiConfig.model})`);
      return this.aiConfig;

    } catch (error) {
      console.error('❌ Error cargando configuración de IA:', error.message);
      return null;
    }
  }

  /**
   * Cargar configuración de IA desde api_providers.json (fallback)
   * Solo se usa si no se especificó aiProvider en recording_info.json
   */
  async loadAIConfig() {
    if (this.aiConfig) {
      return this.aiConfig; // Ya está cargada
    }

    try {
      console.log('📥 Cargando configuración de IA desde api_providers.json...');
      
      if (!fs.existsSync(this.apiProvidersPath)) {
        console.log('⚠️ No se encontró archivo api_providers.json');
        return null;
      }

      const providersData = JSON.parse(fs.readFileSync(this.apiProvidersPath, 'utf8'));
      
      // Buscar proveedores de análisis con API key configurada, ordenados por prioridad
      const aiProviders = providersData
        .filter(p => p.type === 'analysis' && p.apiKey && p.apiKey !== '')
        .sort((a, b) => a.priority - b.priority);

      if (aiProviders.length === 0) {
        console.log('⚠️ No hay proveedores de IA con API key configurada');
        console.log('💡 Configure al menos una API key en /configuracion');
        return null;
      }

      // Usar el primer proveedor con API key (mayor prioridad)
      const provider = aiProviders[0];
      const defaultModel = provider.models && provider.models.length > 0 
        ? provider.models[0].id 
        : this.getDefaultModel(provider.id);
      
      this.aiConfig = {
        provider: provider.id,
        model: defaultModel,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl
      };

      console.log(`🤖 IA configurada (fallback): ${this.aiConfig.provider} (${this.aiConfig.model})`);
      return this.aiConfig;

    } catch (error) {
      console.error('❌ Error cargando configuración de IA:', error.message);
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
      const prompt = `Analiza el siguiente texto de transcripción de radio y determina si contiene menciones de la siguiente frase publicitaria, considerando variaciones, errores de transcripción o palabras similares.

FRASE OBJETIVO: "${targetPhrase}"

TEXTO DE TRANSCRIPCIÓN:
${transcriptionText}

Responde SOLO en formato JSON con esta estructura:
{
  "found": true/false,
  "matches": [
    {
      "text": "texto exacto encontrado",
      "confidence": 0.0-1.0,
      "position": posición aproximada en caracteres,
      "reason": "explicación breve de por qué coincide"
    }
  ]
}

Si no encuentras ninguna coincidencia, devuelve {"found": false, "matches": []}`;

      let response;

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

        // 2. Búsqueda con IA (semántica) si está configurada
        let aiMatches = [];
        if (exactMatches.length === 0) {
          // Cargar config de IA si no está cargada
          if (!this.aiConfig) {
            await this.loadAIConfig();
          }
        }
        
        if (this.aiConfig && exactMatches.length === 0) {
          console.log(`   🤖 No se encontró coincidencia exacta, verificando con IA...`);
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
              needsHumanVerification: match.confidence < 0.9 // Requiere verificación humana si confianza < 90%
            }));
            
            console.log(`   🤖 IA encontró ${aiMatches.length} coincidencia(s) aproximada(s)`);
            aiMatches.forEach((m, idx) => {
              console.log(`      ${idx + 1}. "${m.matchedText}" (confianza: ${(m.confidence * 100).toFixed(0)}%)`);
              if (m.needsHumanVerification) {
                console.log(`         ⚠️ Requiere verificación humana`);
              }
            });
          }
        }

        // Combinar resultados
        const allMatches = [...exactMatches, ...aiMatches];

        if (allMatches.length > 0) {
          totalMatches += allMatches.length;
          detections.push({
            phrase: phrase.phrase,
            brand: phrase.brand,
            campaign: phrase.campaign,
            matches: allMatches,
            hasAIMatches: aiMatches.length > 0,
            needsVerification: aiMatches.some(m => m.needsHumanVerification)
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
    // No hay recursos que cerrar
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
