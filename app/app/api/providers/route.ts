import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

export const dynamic = 'force-dynamic';

// Map display names to backend provider codes
const NAME_TO_PROVIDER: Record<string, string> = {
  'Abacus AI': 'abacus',
  'Groq API': 'groq',
  'OpenAI Whisper': 'openai',
  'AssemblyAI': 'assemblyai',
};

const PROVIDER_DEFAULTS: Record<string, any> = {
  chutes: {
    name: 'Chutes AI',
    type: 'transcription',
    baseUrl: 'https://api.chutes.ai/api/v1',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY_HERE',
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
  abacus: {
    name: 'Abacus AI',
    type: 'transcription',
    baseUrl: 'https://api.abacus.ai/v1',
    models: [
      { id: 'whisper-large-v3', name: 'Whisper Large V3', description: 'Máxima precisión para español chileno', costPerMinute: 50, accuracy: 97.0, speed: 'standard' },
      { id: 'whisper-medium', name: 'Whisper Medium', description: 'Balance precisión/costo', costPerMinute: 30, accuracy: 94.0, speed: 'standard' },
    ],
    rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
  },
  groq: {
    name: 'Groq API',
    type: 'transcription',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'whisper-large-v3', name: 'Whisper Large V3', description: '15x más rápido que OpenAI', costPerMinute: 10, accuracy: 95.0, speed: 'ultra-fast' },
      { id: 'distil-whisper-large-v3', name: 'Distil-Whisper Large V3', description: 'Versión ultra optimizada', costPerMinute: 8, accuracy: 93.0, speed: 'ultra-fast' },
    ],
    rateLimits: { requestsPerMinute: 120, requestsPerHour: 2000 },
  },
  openai: {
    name: 'OpenAI Whisper',
    type: 'transcription',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'whisper-1', name: 'Whisper-1', description: 'Modelo estándar de OpenAI', costPerMinute: 6, accuracy: 94.0, speed: 'standard' },
    ],
    rateLimits: { requestsPerMinute: 50, requestsPerHour: 1000 },
  },
  assemblyai: {
    name: 'AssemblyAI',
    type: 'transcription',
    baseUrl: 'https://api.assemblyai.com/v2',
    models: [
      { id: 'best', name: 'Best Model', description: 'Mejor modelo de AssemblyAI', costPerMinute: 0.37, accuracy: 95.0, speed: 'standard' },
      { id: 'nano', name: 'Nano Model', description: 'Modelo más rápido y económico', costPerMinute: 0.18, accuracy: 88.0, speed: 'fast' },
    ],
    rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
  },
};

function toApiProvider(c: any) {
  const metadata = (c?.metadata as any) || {};
  const defaults = PROVIDER_DEFAULTS[c.provider] || {};
  
  // IMPORTANTE: Usar c.api_key (con guion bajo) que es el nombre real del campo en la BD
  let apiKey = c.api_key || '';
  if (apiKey && typeof apiKey === 'string') {
    // Si la API key es un placeholder de variable de entorno, resolverla
    const envVarName = apiKey.toUpperCase();
    if (envVarName.endsWith('_API_KEY') && !apiKey.startsWith('sk-') && !apiKey.startsWith('gsk_')) {
      const envValue = process.env[envVarName];
      if (envValue) {
        apiKey = envValue;
      }
    }
  }
  
  console.log('🔍 DEBUG toApiProvider - c.api_key:', c.api_key);
  console.log('🔍 DEBUG toApiProvider - apiKey final:', apiKey);
  
  return {
    id: c.id,
    name: defaults.name || c.provider,
    type: defaults.type || 'transcription',
    baseUrl: metadata.baseUrl || defaults.baseUrl || '',
    apiKey: apiKey, // Ahora usa el campo correcto de la BD
    models: metadata.models || defaults.models || [],
    headers: metadata.headers || undefined,
    enabled: c.enabled,
    priority: c.priority,
    rateLimits: metadata.rateLimits || defaults.rateLimits || undefined,
    created_at: c.createdAt?.toISOString?.() || new Date().toISOString(),
    updated_at: c.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

export async function GET() {
  try {
    // Obtener todos los proveedores usando Service Role Key (bypass RLS)
    const configs = await supabaseDirect.request(
      'api_configurations?select=*&order=priority.asc',
      { useServiceKey: true }
    );
    
    // Si no hay proveedores, crear chutes.ai automáticamente
    if (configs.length === 0) {
      console.log('🚀 No hay proveedores, creando chutes.ai automáticamente...');
      
      const chutesConfig = {
        id: `api-${Date.now()}-chutes`,
        provider: 'chutes',
        api_key: process.env.CHUTES_API_KEY || 'sk-configura-tu-api-key',
        model: 'whisper-large-v3-turbo',
        enabled: false,
        priority: 1,
        cost_per_unit: 2.5,
        rate_limit: 120,
        metadata: {
          baseUrl: 'https://api.chutes.ai/api/v1',
          headers: {
            'Authorization': `Bearer ${process.env.CHUTES_API_KEY || 'sk-configura-tu-api-key'}`,
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

      const newProvider = await supabaseDirect.request(
        'api_configurations',
        {
          method: 'POST',
          body: JSON.stringify(chutesConfig),
          headers: { 'Prefer': 'return=representation' },
          useServiceKey: true
        }
      );
      
      console.log('✅ chutes.ai creado automáticamente');
      return NextResponse.json({ providers: [toApiProvider(newProvider[0])] });
    }
    
    const providers = configs.map(toApiProvider);
    return NextResponse.json({ providers });
  } catch (error: any) {
    console.error('❌ Error en GET /api/providers:', error);
    return NextResponse.json({ error: error.message || 'Error listando proveedores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 DEBUG POST /api/providers - Body recibido:', JSON.stringify(body, null, 2));
    
    // body puede venir con name o id; inferir provider code
    const providerCode = NAME_TO_PROVIDER[body.name] || body.id || body.provider || 'custom';
    const defaults = PROVIDER_DEFAULTS[providerCode] || {};
    
    console.log('🔍 DEBUG - providerCode:', providerCode);
    console.log('🔍 DEBUG - body.apiKey:', body.apiKey);

    const metadata = {
      baseUrl: body.baseUrl || defaults.baseUrl || '',
      models: Array.isArray(body.models) ? body.models : (defaults.models || []),
      rateLimits: body.rateLimits || defaults.rateLimits || undefined,
      headers: body.headers || undefined,
    };

    // Verificar si existe la configuración
    const existingConfigs = await supabaseDirect.request(
      `api_configurations?select=*&provider=eq.${providerCode}`
    );
    
    console.log('🔍 DEBUG - existingConfigs.length:', existingConfigs.length);

    let created;
    
    if (existingConfigs.length > 0) {
      // Actualizar existente
      const updateData = {
        api_key: body.apiKey || null,
        model: Array.isArray(metadata.models) && metadata.models[0]?.id ? metadata.models[0].id : body.model || null,
        enabled: body.enabled ?? true,
        priority: body.priority ?? defaults.priority ?? 99,
        cost_per_unit: body.costPerUnit ?? (metadata.models?.[0]?.costPerMinute ?? 0),
        rate_limit: body.rateLimits?.requestsPerMinute ?? null,
        metadata,
        updated_at: new Date().toISOString()
      };
      
      console.log('🔍 DEBUG - updateData.api_key:', updateData.api_key);
      console.log('🔍 DEBUG - Enviando PATCH a:', `api_configurations?provider=eq.${providerCode}`);

      const updated = await supabaseDirect.request(
        `api_configurations?provider=eq.${providerCode}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
          headers: { 'Prefer': 'return=representation' }
        }
      );
      console.log('🔍 DEBUG - Resultado PATCH:', JSON.stringify(updated, null, 2));
      created = updated[0];
    } else {
      // Crear nuevo
      const uniqueId = `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const createData = {
        id: uniqueId,
        provider: providerCode,
        api_key: body.apiKey || null,
        model: Array.isArray(metadata.models) && metadata.models[0]?.id ? metadata.models[0].id : body.model || null,
        enabled: body.enabled ?? true,
        priority: body.priority ?? 99,
        cost_per_unit: body.costPerUnit ?? (metadata.models?.[0]?.costPerMinute ?? 0),
        rate_limit: body.rateLimits?.requestsPerMinute ?? null,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('🔍 DEBUG - createData.api_key:', createData.api_key);
      console.log('🔍 DEBUG - Creando nuevo proveedor con ID:', uniqueId);

      const newConfigs = await supabaseDirect.request('api_configurations', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Prefer': 'return=representation' }
      });
      console.log('🔍 DEBUG - Resultado POST:', JSON.stringify(newConfigs, null, 2));
      created = newConfigs[0];
    }

    return NextResponse.json({ provider: toApiProvider(created) });
  } catch (error: any) {
    console.error('❌ Error en POST /api/providers:', error);
    return NextResponse.json({ error: error.message || 'Error creando proveedor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 DEBUG PUT /api/providers - Body recibido:', JSON.stringify(body, null, 2));
    
    const id = body.id as string | undefined;
    console.log('🔍 DEBUG PUT - ID:', id);
    console.log('🔍 DEBUG PUT - body.apiKey:', body.apiKey);
    
    // Buscar configuración existente
    let existing = null;
    if (id) {
      const existingConfigs = await supabaseDirect.request(
        `api_configurations?select=*&id=eq.${id}`
      );
      existing = existingConfigs[0] || null;
      console.log('🔍 DEBUG PUT - existing por ID:', existing);
    }

    const providerCode = existing?.provider || NAME_TO_PROVIDER[body.name] || body.provider || 'custom';
    const defaults = PROVIDER_DEFAULTS[providerCode] || {};
    console.log('🔍 DEBUG PUT - providerCode:', providerCode);

    const prev = existing || (await supabaseDirect.request(
      `api_configurations?select=*&provider=eq.${providerCode}`
    ))[0];
    const prevMeta = (prev?.metadata as any) || {};
    console.log('🔍 DEBUG PUT - prev.api_key:', prev?.api_key);

    const metadata = {
      baseUrl: body.baseUrl ?? prevMeta.baseUrl ?? defaults.baseUrl ?? '',
      models: Array.isArray(body.models) ? body.models : (prevMeta.models || defaults.models || []),
      rateLimits: body.rateLimits ?? prevMeta.rateLimits ?? defaults.rateLimits ?? undefined,
      headers: body.headers ?? prevMeta.headers ?? undefined,
    };

    // Verificar si existe para upsert
    const existingConfigs = await supabaseDirect.request(
      `api_configurations?select=*&provider=eq.${providerCode}`
    );
    console.log('🔍 DEBUG PUT - existingConfigs.length:', existingConfigs.length);

    let updated;
    
    if (existingConfigs.length > 0) {
      // Actualizar existente
      const updateData = {
        api_key: body.apiKey !== undefined ? (body.apiKey || null) : prev?.api_key || null,
        model: Array.isArray(metadata.models) && metadata.models[0]?.id ? metadata.models[0].id : body.model || prev?.model || null,
        enabled: body.enabled ?? prev?.enabled ?? false,
        priority: body.priority ?? prev?.priority ?? defaults.priority ?? 99,
        cost_per_unit: body.costPerUnit ?? prev?.cost_per_unit ?? (metadata.models?.[0]?.costPerMinute ?? 0),
        rate_limit: body.rateLimits?.requestsPerMinute ?? prev?.rate_limit ?? null,
        metadata,
        updated_at: new Date().toISOString()
      };
      
      console.log('🔍 DEBUG PUT - updateData.api_key:', updateData.api_key);
      console.log('🔍 DEBUG PUT - body.apiKey !== undefined:', body.apiKey !== undefined);

      const updateResult = await supabaseDirect.request(
        `api_configurations?provider=eq.${providerCode}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
          headers: { 'Prefer': 'return=representation' }
        }
      );
      console.log('🔍 DEBUG PUT - Resultado PATCH:', JSON.stringify(updateResult, null, 2));
      updated = updateResult[0];
    } else {
      // Crear nuevo
      const uniqueId = `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const createData = {
        id: uniqueId,
        provider: providerCode,
        api_key: body.apiKey || null,
        model: Array.isArray(metadata.models) && metadata.models[0]?.id ? metadata.models[0].id : body.model || null,
        enabled: body.enabled ?? true,
        priority: body.priority ?? 99,
        cost_per_unit: body.costPerUnit ?? (metadata.models?.[0]?.costPerMinute ?? 0),
        rate_limit: body.rateLimits?.requestsPerMinute ?? null,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('🔍 DEBUG PUT - Creando nuevo con api_key:', createData.api_key);

      const newConfigs = await supabaseDirect.request('api_configurations', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Prefer': 'return=representation' }
      });
      console.log('🔍 DEBUG PUT - Resultado POST:', JSON.stringify(newConfigs, null, 2));
      updated = newConfigs[0];
    }
    
    return NextResponse.json({ provider: toApiProvider(updated) });
  } catch (error: any) {
    console.error('❌ Error en PUT /api/providers:', error);
    return NextResponse.json({ error: error.message || 'Error actualizando proveedor' }, { status: 500 });
  }
}

// Endpoint especial para configurar chutes.ai automáticamente
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Solo permitir setup de chutes.ai
    if (body.action !== 'setup-chutes') {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    // Verificar si ya existe chutes.ai
    const existing = await supabaseDirect.request(
      'api_configurations?select=*&provider=eq.chutes',
      { useServiceKey: true }
    );

    const chutesConfig = {
      id: `api-${Date.now()}-chutes-setup`,
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
      result = await supabaseDirect.request(
        'api_configurations?provider=eq.chutes',
        {
          method: 'PATCH',
          body: JSON.stringify(chutesConfig),
          headers: { 'Prefer': 'return=representation' },
          useServiceKey: true
        }
      );
      console.log('✅ chutes.ai actualizado en la base de datos');
    } else {
      // Crear nuevo
      result = await supabaseDirect.request(
        'api_configurations',
        {
          method: 'POST',
          body: JSON.stringify(chutesConfig),
          headers: { 'Prefer': 'return=representation' },
          useServiceKey: true
        }
      );
      console.log('✅ chutes.ai creado en la base de datos');
    }

    return NextResponse.json({
      success: true,
      message: 'chutes.ai configurado exitosamente',
      provider: result[0]
    });

  } catch (error: any) {
    console.error('Error configurando chutes.ai:', error);
    return NextResponse.json({
      error: error.message || 'Error configurando chutes.ai'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all') === 'true'; // Nuevo parámetro para eliminar todos

    // Si se solicita eliminar todos los registros
    if (all) {
      const confirmDelete = searchParams.get('confirm') === 'true';
      if (!confirmDelete) {
        return NextResponse.json({
          error: 'Se requiere confirmación para eliminar todos los registros. Usa ?all=true&confirm=true'
        }, { status: 400 });
      }

      console.log('🚨 Eliminando TODOS los registros de api_configurations...');
      const result = await supabaseDirect.request('api_configurations', {
        method: 'DELETE'
      });
      
      console.log('✅ Todos los registros eliminados:', result);
      return NextResponse.json({
        success: true,
        message: 'Todos los registros eliminados correctamente',
        deletedCount: result ? result.length : 0
      });
    }

    // Eliminación individual (código existente)
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    // Primero, obtener todos los proveedores para ver qué columna usar
    const allProviders = await supabaseDirect.request('api_configurations?select=*');
    console.log('DEBUG: Todos los proveedores:', JSON.stringify(allProviders, null, 2));
    
    // Intentar eliminar usando 'provider' como columna (la clave primaria)
    const result = await supabaseDirect.request(`api_configurations?provider=eq.${id}`, {
      method: 'DELETE'
    });
    
    console.log('DEBUG: Resultado de DELETE:', result);
    
    // Si result es null (respuesta vacía de Supabase), devolver JSON válido
    if (result === null) {
      return NextResponse.json({ success: true, message: 'Proveedor eliminado correctamente' });
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DEBUG: Error en DELETE:', error);
    return NextResponse.json({ error: error.message || 'Error eliminando proveedor' }, { status: 500 });
  }
}
