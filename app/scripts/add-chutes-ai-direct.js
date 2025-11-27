const { supabaseDirect } = require('../lib/supabase-direct');

async function addChutesAI() {
  try {
    console.log('🚀 Verificando si chutes.ai existe en la base de datos...');
    
    // Verificar si ya existe chutes.ai
    const existing = await supabaseDirect.request(
      'api_configurations?select=*&provider=eq.chutes',
      { useServiceKey: true }
    );

    const chutesConfig = {
      provider: 'chutes',
      api_key: process.env.CHUTES_API_KEY || 'sk-tu-api-key-aqui',
      model: 'whisper-large-v3-turbo',
      enabled: true,
      priority: 1,
      cost_per_unit: 2.5,
      rate_limit: 120,
      metadata: {
        baseUrl: 'https://api.chutes.ai/api/v1',
        headers: {
          'Authorization': `Bearer ${process.env.CHUTES_API_KEY || 'sk-tu-api-key-aqui'}`,
          'Content-Type': 'application/json'
        },
        models: [
          {
            id: 'whisper-large-v3-turbo',
            name: 'Whisper Large V3 Turbo',
            description: 'Modelo optimizado de Whisper con máxima velocidad',
            costPerMinute: 2.5,
            accuracy: 95.0,
            speed: 'ultra-fast',
            languages: ['es', 'en', 'pt']
          },
          {
            id: 'whisper-large-v3',
            name: 'Whisper Large V3',
            description: 'Modelo estándar de Whisper con alta precisión',
            costPerMinute: 5,
            accuracy: 96.5,
            speed: 'fast',
            languages: ['es', 'en', 'pt', 'fr', 'de', 'it']
          },
          {
            id: 'whisper-medium',
            name: 'Whisper Medium',
            description: 'Modelo balanceado entre precisión y velocidad',
            costPerMinute: 3,
            accuracy: 93.0,
            speed: 'fast',
            languages: ['es', 'en', 'pt']
          }
        ],
        rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 },
        features: ['transcription', 'translation', 'speaker-diarization'],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let result;
    if (existing.length > 0) {
      // Actualizar existente
      console.log('⚠️  chutes.ai ya existe, actualizando...');
      result = await supabaseDirect.request(
        'api_configurations?provider=eq.chutes',
        {
          method: 'PATCH',
          body: JSON.stringify(chutesConfig),
          headers: { 'Prefer': 'return=representation' },
          useServiceKey: true
        }
      );
      console.log('✅ chutes.ai actualizado exitosamente');
    } else {
      // Crear nuevo
      console.log('➕ chutes.ai no existe, creando nuevo registro...');
      result = await supabaseDirect.request(
        'api_configurations',
        {
          method: 'POST',
          body: JSON.stringify(chutesConfig),
          headers: { 'Prefer': 'return=representation' },
          useServiceKey: true
        }
      );
      console.log('✅ chutes.ai creado exitosamente');
    }

    console.log('\n📊 Resultado:');
    console.log(JSON.stringify(result[0], null, 2));
    
    console.log('\n🎉 chutes.ai está ahora configurado en Supabase');
    console.log('💡 Recuerda actualizar la API key real en el archivo .env: CHUTES_API_KEY=sk-...');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addChutesAI();