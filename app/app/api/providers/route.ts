
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ApiProvider {
  id: string;
  name: string;
  type: 'transcription' | 'audio_processing' | 'translation' | 'ai_chat';
  baseUrl: string;
  apiKey?: string;
  models: Array<{
    id: string;
    name: string;
    description: string;
    costPerMinute: number; // en USD
    accuracy?: number; // porcentaje
    speed?: string; // 'slow', 'standard', 'fast', 'ultra-fast'
    languages?: string[];
  }>;
  headers?: Record<string, string>;
  enabled: boolean;
  priority: number; // para fallback order
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  created_at: string;
  updated_at: string;
}

const PROVIDERS_FILE = path.join(process.cwd(), 'data', 'api_providers.json');

// Proveedores predeterminados que se crean automáticamente
const DEFAULT_PROVIDERS: ApiProvider[] = [
  {
    id: 'abacus-ai',
    name: 'Abacus AI',
    type: 'transcription',
    baseUrl: 'https://api.abacus.ai/v1',
    models: [
      {
        id: 'whisper-large-v3',
        name: 'Whisper Large V3',
        description: 'Máxima precisión para español chileno',
        costPerMinute: 0.05,
        accuracy: 97,
        speed: 'standard',
        languages: ['es', 'es-CL', 'en']
      },
      {
        id: 'whisper-medium',
        name: 'Whisper Medium',
        description: 'Balance precisión/costo',
        costPerMinute: 0.03,
        accuracy: 94,
        speed: 'standard',
        languages: ['es', 'es-CL', 'en']
      }
    ],
    enabled: true,
    priority: 1,
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'groq-api',
    name: 'Groq API',
    type: 'transcription',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      {
        id: 'whisper-large-v3',
        name: 'Whisper Large V3',
        description: '15x más rápido que OpenAI',
        costPerMinute: 0.01,
        accuracy: 95,
        speed: 'ultra-fast',
        languages: ['es', 'en', 'fr', 'de', 'it', 'pt']
      },
      {
        id: 'distil-whisper-large-v3',
        name: 'Distil-Whisper Large V3',
        description: 'Versión ultra optimizada',
        costPerMinute: 0.008,
        accuracy: 93,
        speed: 'ultra-fast',
        languages: ['es', 'en']
      }
    ],
    enabled: true,
    priority: 2,
    rateLimits: {
      requestsPerMinute: 30,
      requestsPerHour: 500
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'openai',
    name: 'OpenAI Whisper',
    type: 'transcription',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      {
        id: 'whisper-1',
        name: 'Whisper-1',
        description: 'Modelo estándar de OpenAI',
        costPerMinute: 0.006,
        accuracy: 94,
        speed: 'standard',
        languages: ['es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
      }
    ],
    enabled: false,
    priority: 3,
    rateLimits: {
      requestsPerMinute: 50,
      requestsPerHour: 1000
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    type: 'transcription',
    baseUrl: 'https://api.assemblyai.com/v2',
    models: [
      {
        id: 'best',
        name: 'Best Model',
        description: 'Mejor modelo de AssemblyAI',
        costPerMinute: 0.00037,
        accuracy: 95,
        speed: 'standard',
        languages: ['es', 'en']
      },
      {
        id: 'nano',
        name: 'Nano Model',
        description: 'Modelo más rápido y económico',
        costPerMinute: 0.00018,
        accuracy: 88,
        speed: 'fast',
        languages: ['en']
      }
    ],
    enabled: false,
    priority: 4,
    rateLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 2000
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function ensureProvidersFile() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(PROVIDERS_FILE)) {
    fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(DEFAULT_PROVIDERS, null, 2));
    console.log('✅ Archivo de proveedores creado con datos predeterminados');
  }
}

async function loadProviders(): Promise<ApiProvider[]> {
  await ensureProvidersFile();
  try {
    const data = fs.readFileSync(PROVIDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error cargando proveedores:', error);
    return DEFAULT_PROVIDERS;
  }
}

async function saveProviders(providers: ApiProvider[]) {
  try {
    fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(providers, null, 2));
  } catch (error) {
    console.error('Error guardando proveedores:', error);
    throw error;
  }
}

// GET - Obtener todos los proveedores
export async function GET(request: NextRequest) {
  try {
    const providers = await loadProviders();
    
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const enabled = url.searchParams.get('enabled');
    
    let filteredProviders = providers;
    
    if (type) {
      filteredProviders = filteredProviders.filter(p => p.type === type);
    }
    
    if (enabled !== null) {
      const isEnabled = enabled === 'true';
      filteredProviders = filteredProviders.filter(p => p.enabled === isEnabled);
    }
    
    // Ordenar por prioridad
    filteredProviders.sort((a, b) => a.priority - b.priority);
    
    return NextResponse.json({
      success: true,
      providers: filteredProviders,
      count: filteredProviders.length
    });
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validar campos requeridos
    if (!data.name || !data.type || !data.baseUrl) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, type, baseUrl' },
        { status: 400 }
      );
    }
    
    const providers = await loadProviders();
    
    // Verificar que no exista un proveedor con el mismo nombre
    if (providers.some(p => p.name.toLowerCase() === data.name.toLowerCase())) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre' },
        { status: 409 }
      );
    }
    
    const newProvider: ApiProvider = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      type: data.type,
      baseUrl: data.baseUrl,
      apiKey: data.apiKey || '',
      models: data.models || [],
      headers: data.headers || {},
      enabled: data.enabled ?? true,
      priority: data.priority ?? (Math.max(...providers.map(p => p.priority)) + 1),
      rateLimits: data.rateLimits || {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    providers.push(newProvider);
    await saveProviders(providers);
    
    console.log(`✅ Nuevo proveedor creado: ${newProvider.name}`);
    
    return NextResponse.json({
      success: true,
      provider: newProvider,
      message: 'Proveedor creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando proveedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar proveedor existente
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Se requiere ID del proveedor' },
        { status: 400 }
      );
    }
    
    const providers = await loadProviders();
    const providerIndex = providers.findIndex(p => p.id === data.id);
    
    if (providerIndex === -1) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }
    
    // Actualizar campos
    const updatedProvider = {
      ...providers[providerIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    providers[providerIndex] = updatedProvider;
    await saveProviders(providers);
    
    console.log(`✅ Proveedor actualizado: ${updatedProvider.name}`);
    
    return NextResponse.json({
      success: true,
      provider: updatedProvider,
      message: 'Proveedor actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando proveedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar proveedor
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere ID del proveedor' },
        { status: 400 }
      );
    }
    
    const providers = await loadProviders();
    const providerIndex = providers.findIndex(p => p.id === id);
    
    if (providerIndex === -1) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }
    
    const deletedProvider = providers[providerIndex];
    providers.splice(providerIndex, 1);
    await saveProviders(providers);
    
    console.log(`🗑️ Proveedor eliminado: ${deletedProvider.name}`);
    
    return NextResponse.json({
      success: true,
      message: 'Proveedor eliminado exitosamente',
      deleted: deletedProvider.name
    });
  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
