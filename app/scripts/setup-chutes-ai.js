// Script para configurar chutes.ai en la base de datos
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno desde app/.env
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Verificar que las variables se cargaron
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL no está definida');
  console.error('📁 Buscando en:', envPath);
  console.error('🔍 Verifica que app/.env existe y contiene:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL="https://..."');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY="..."');
  process.exit(1);
}

const { supabaseDirect } = require('../lib/supabase-direct');

async function setupChutesAI() {
  console.log('🚀 Configurando chutes.ai en Supabase...');
  
  try {
    // Datos de chutes.ai
    const chutesConfig = {
      provider: 'chutes',
      api_key: process.env.CHUTES_API_KEY || 'sk-tu-api-key-aqui', // Placeholder
      model: 'whisper-large-v3',
      enabled: true,
      priority: 1,
      cost_per_unit: 5, // $5 CLP por minuto
      rate_limit: 100,
      metadata: {
        baseUrl: 'https://api.chutes.ai/v1',
        models: [
          { 
            id: 'whisper-large-v3', 
            name: 'Whisper Large V3', 
            description: 'Transcripción de alta precisión', 
            costPerMinute: 5, 
            accuracy: 96.0, 
            speed: 'fast' 
          },
          { 
            id: 'whisper-medium', 
            name: 'Whisper Medium', 
            description: 'Balance optimizado', 
            costPerMinute: 3, 
            accuracy: 93.0, 
            speed: 'fast' 
          }
        ],
        rateLimits: { 
          requestsPerMinute: 100, 
          requestsPerHour: 5000 
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Verificar si ya existe (usando service key para bypass RLS)
    const existing = await supabaseDirect.request(
      'api_configurations?select=*&provider=eq.chutes',
      { useServiceKey: true }
    );

    if (existing.length > 0) {
      console.log('⚠️  chutes.ai ya está configurado. Actualizando...');
      
      // Actualizar existente (usando service key)
      const updated = await supabaseDirect.request(
        'api_configurations?provider=eq.chutes',
        {
          method: 'PATCH',
          body: JSON.stringify(chutesConfig),
          headers: { 'Prefer': 'return=representation' },
          useServiceKey: true
        }
      );
      
      console.log('✅ chutes.ai actualizado correctamente');
      console.log('📊 Datos:', JSON.stringify(updated[0], null, 2));
    } else {
      // Crear nuevo (usando service key para bypass RLS)
      const created = await supabaseDirect.request(
        'api_configurations',
        {
          method: 'POST',
          body: JSON.stringify(chutesConfig),
          headers: { 'Prefer': 'return=representation' },
          useServiceKey: true
        }
      );
      
      console.log('✅ chutes.ai configurado correctamente');
      console.log('📊 Datos:', JSON.stringify(created[0], null, 2));
    }

    console.log('\n📝 Instrucciones:');
    console.log('1. Ve a http://localhost:3000/configuracion');
    console.log('2. Verás chutes.ai en la lista');
    console.log('3. Podrás probar, activar/desactivar y eliminar chutes.ai');
    
  } catch (error) {
    console.error('❌ Error configurando chutes.ai:', error.message);
    process.exit(1);
  }
}

// Ejecutar
setupChutesAI().then(() => {
  console.log('\n✨ Script completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});