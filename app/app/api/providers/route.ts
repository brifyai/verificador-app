import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

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
  return {
    id: c.id,
    name: defaults.name || c.provider,
    type: defaults.type || 'transcription',
    baseUrl: metadata.baseUrl || defaults.baseUrl || '',
    apiKey: c.apiKey || '', // texto plano temporal para pruebas
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
    // Leer desde api_providers.json
    const filePath = path.join(process.cwd(), 'data', 'api_providers.json');
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const providers = JSON.parse(fileContent);
      // Retornar en el formato esperado por DynamicProvidersManager
      return NextResponse.json({ providers });
    }
    
    // Fallback: leer de la base de datos
    const configs = await prisma.apiConfiguration.findMany({ orderBy: { priority: 'asc' } });
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
    const filePath = path.join(process.cwd(), 'data', 'api_providers.json');
    
    // Leer archivo actual
    let providers = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      providers = JSON.parse(fileContent);
    }
    
    // Crear nuevo proveedor
    const newProvider = {
      id: body.id || body.name.toLowerCase().replace(/\s+/g, '-'),
      name: body.name,
      type: body.type || 'transcription',
      baseUrl: body.baseUrl || '',
      apiKey: body.apiKey || '',
      models: body.models || [],
      enabled: body.enabled ?? true,
      priority: body.priority ?? (Math.max(...providers.map((p: any) => p.priority || 0), 0) + 1),
      rateLimits: body.rateLimits || {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Agregar al array
    providers.push(newProvider);
    
    // Guardar archivo
    fs.writeFileSync(filePath, JSON.stringify(providers, null, 2), 'utf-8');
    
    return NextResponse.json({ provider: newProvider });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creando proveedor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const filePath = path.join(process.cwd(), 'data', 'api_providers.json');
    
    // Leer archivo actual
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Archivo de proveedores no encontrado' }, { status: 404 });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let providers = JSON.parse(fileContent);
    
    // Buscar el proveedor a actualizar
    const index = providers.findIndex((p: any) => p.id === body.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }
    
    // Actualizar proveedor
    providers[index] = {
      ...providers[index],
      name: body.name ?? providers[index].name,
      type: body.type ?? providers[index].type,
      baseUrl: body.baseUrl ?? providers[index].baseUrl,
      apiKey: body.apiKey !== undefined ? body.apiKey : providers[index].apiKey,
      models: body.models ?? providers[index].models,
      enabled: body.enabled ?? providers[index].enabled,
      priority: body.priority ?? providers[index].priority,
      rateLimits: body.rateLimits ?? providers[index].rateLimits,
      updated_at: new Date().toISOString()
    };
    
    // Guardar archivo
    fs.writeFileSync(filePath, JSON.stringify(providers, null, 2), 'utf-8');
    
    return NextResponse.json({ provider: providers[index] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error actualizando proveedor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const filePath = path.join(process.cwd(), 'data', 'api_providers.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Archivo de proveedores no encontrado' }, { status: 404 });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let providers = JSON.parse(fileContent);
    
    // Filtrar el proveedor a eliminar
    providers = providers.filter((p: any) => p.id !== id);
    
    // Guardar archivo
    fs.writeFileSync(filePath, JSON.stringify(providers, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error eliminando proveedor' }, { status: 500 });
  }
}
