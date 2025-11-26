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
  
  // Resolver API key desde variables de entorno si es un placeholder
  let apiKey = c.apiKey || '';
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
  
  return {
    id: c.id,
    name: defaults.name || c.provider,
    type: defaults.type || 'transcription',
    baseUrl: metadata.baseUrl || defaults.baseUrl || '',
    apiKey: apiKey,
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
    const configs = await supabaseDirect.request('api_configurations?select=*&order=priority.asc');
    // Si no hay, devolver defaults deshabilitados
    if (configs.length === 0) {
      const providers = Object.entries(PROVIDER_DEFAULTS).map(([provider, def]) => ({
        id: provider,
        name: def.name,
        type: def.type,
        baseUrl: def.baseUrl,
        apiKey: '',
        models: def.models,
        enabled: false,
        priority: 99,
        rateLimits: def.rateLimits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      return NextResponse.json({ providers });
    }

    const providers = configs.map(toApiProvider);
    return NextResponse.json({ providers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error listando proveedores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // body puede venir con name o id; inferir provider code
    const providerCode = NAME_TO_PROVIDER[body.name] || body.id || body.provider || 'custom';
    const defaults = PROVIDER_DEFAULTS[providerCode] || {};

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

      const updated = await supabaseDirect.request(
        `api_configurations?provider=eq.${providerCode}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
          headers: { 'Prefer': 'return=representation' }
        }
      );
      created = updated[0];
    } else {
      // Crear nuevo
      const createData = {
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

      const newConfigs = await supabaseDirect.request('api_configurations', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Prefer': 'return=representation' }
      });
      created = newConfigs[0];
    }

    return NextResponse.json({ provider: toApiProvider(created) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creando proveedor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id as string | undefined;
    
    // Buscar configuración existente
    let existing = null;
    if (id) {
      const existingConfigs = await supabaseDirect.request(
        `api_configurations?select=*&id=eq.${id}`
      );
      existing = existingConfigs[0] || null;
    }

    const providerCode = existing?.provider || NAME_TO_PROVIDER[body.name] || body.provider || 'custom';
    const defaults = PROVIDER_DEFAULTS[providerCode] || {};

    const prev = existing || (await supabaseDirect.request(
      `api_configurations?select=*&provider=eq.${providerCode}`
    ))[0];
    const prevMeta = (prev?.metadata as any) || {};

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

      const updateResult = await supabaseDirect.request(
        `api_configurations?provider=eq.${providerCode}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
          headers: { 'Prefer': 'return=representation' }
        }
      );
      updated = updateResult[0];
    } else {
      // Crear nuevo
      const createData = {
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

      const newConfigs = await supabaseDirect.request('api_configurations', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Prefer': 'return=representation' }
      });
      updated = newConfigs[0];
    }

    return NextResponse.json({ provider: toApiProvider(updated) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error actualizando proveedor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    await supabaseDirect.request(`api_configurations?id=eq.${id}`, {
      method: 'DELETE'
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error eliminando proveedor' }, { status: 500 });
  }
}
