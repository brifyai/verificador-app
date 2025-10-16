import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Función para convertir el registro de la BD al formato esperado por el frontend
function toApiProvider(config: any) {
  const metadata = (config?.metadata as any) || {};
  
  return {
    id: config.id,
    name: metadata.name || config.provider,
    type: metadata.type || 'transcription',
    baseUrl: metadata.baseUrl || '',
    apiKey: config.apiKey || '',
    models: metadata.models || [],
    headers: metadata.headers || undefined,
    enabled: config.enabled,
    priority: config.priority,
    rateLimits: metadata.rateLimits || {
      requestsPerMinute: config.rateLimit || 60,
      requestsPerHour: 1000
    },
    created_at: config.createdAt?.toISOString?.() || new Date().toISOString(),
    updated_at: config.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

export async function GET() {
  try {
    // Leer de la base de datos
    const configs = await prisma.apiConfiguration.findMany({ 
      orderBy: { priority: 'asc' } 
    });

    const providers = configs.map(toApiProvider);
    return NextResponse.json({ providers });
  } catch (error: any) {
    console.error('Error listando proveedores:', error);
    return NextResponse.json({ error: error.message || 'Error listando proveedores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
<<<<<<< HEAD
    
    // Preparar metadata con la información adicional
      name: body.name,
      type: body.type || 'transcription',
      baseUrl: body.baseUrl || '',
      models: body.models || [],
      rateLimits: body.rateLimits || {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      headers: body.headers || undefined
    };
    
    // Crear en la base de datos
    const config = await prisma.apiConfiguration.create({
      data: {
        provider: body.id || body.name.toLowerCase().replace(/\s+/g, '-'),
        apiKey: body.apiKey || null,
        model: body.models?.[0]?.id || null,
        enabled: body.enabled ?? true,
        priority: body.priority ?? 1,
        costPerUnit: body.models?.[0]?.costPerMinute || 0,
        rateLimit: body.rateLimits?.requestsPerMinute || 60,
        metadata: metadata
      }
    });
    
    const provider = toApiProvider(config);
    return NextResponse.json({ provider });
  } catch (error: any) {
    console.error('Error creando proveedor:', error);
=======
    // body puede venir con name o id; inferir provider code
    const providerCode = NAME_TO_PROVIDER[body.name] || body.id || body.provider || 'custom';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
<<<<<<< HEAD
    
    if (!body.id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }
    
    // Buscar el registro existente
    const existing = await prisma.apiConfiguration.findUnique({
      where: { id: body.id }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }
    
    const existingMetadata = (existing.metadata as any) || {};
    
    // Preparar metadata actualizada
    const metadata = {
      name: body.name ?? existingMetadata.name,
      type: body.type ?? existingMetadata.type,
      baseUrl: body.baseUrl ?? existingMetadata.baseUrl,
      models: body.models ?? existingMetadata.models,
      rateLimits: body.rateLimits ?? existingMetadata.rateLimits,
      headers: body.headers ?? existingMetadata.headers
    };
    
    // Actualizar en la base de datos
    const config = await prisma.apiConfiguration.update({
      where: { id: body.id },
      data: {
        apiKey: body.apiKey !== undefined ? body.apiKey : existing.apiKey,
        model: body.models?.[0]?.id ?? existing.model,
        enabled: body.enabled ?? existing.enabled,
        priority: body.priority ?? existing.priority,
        costPerUnit: body.models?.[0]?.costPerMinute ?? existing.costPerUnit,
        rateLimit: body.rateLimits?.requestsPerMinute ?? existing.rateLimit,
        metadata: metadata
      }
    });
    
    const provider = toApiProvider(config);
    return NextResponse.json({ provider });
  } catch (error: any) {
    console.error('Error actualizando proveedor:', error);
=======
    const id = body.id as string | undefined;
    const existing = id
      ? await prisma.apiConfiguration.findUnique({ where: { id } })
      : null;

    const providerCode = existing?.provider || NAME_TO_PROVIDER[body.name] || body.provider || 'custom';
    const defaults = PROVIDER_DEFAULTS[providerCode] || {};

    const prev = existing || (await prisma.apiConfiguration.findUnique({ where: { provider: providerCode } }));
    const prevMeta = (prev?.metadata as any) || {};

    const metadata = {
      baseUrl: body.baseUrl ?? prevMeta.baseUrl ?? defaults.baseUrl ?? '',
      models: Array.isArray(body.models) ? body.models : (prevMeta.models || defaults.models || []),
      rateLimits: body.rateLimits ?? prevMeta.rateLimits ?? defaults.rateLimits ?? undefined,
      headers: body.headers ?? prevMeta.headers ?? undefined,
    };

    const updated = await prisma.apiConfiguration.upsert({
      where: id ? { id } : { provider: providerCode },
      update: {
        apiKey: body.apiKey !== undefined ? (body.apiKey || null) : prev?.apiKey || null,
        model: Array.isArray(metadata.models) && metadata.models[0]?.id ? metadata.models[0].id : body.model || prev?.model || null,
        enabled: body.enabled ?? prev?.enabled ?? false,
        priority: body.priority ?? prev?.priority ?? defaults.priority ?? 99,
        costPerUnit: body.costPerUnit ?? prev?.costPerUnit ?? (metadata.models?.[0]?.costPerMinute ?? 0),
        rateLimit: body.rateLimits?.requestsPerMinute ?? prev?.rateLimit ?? null,
        metadata,
      },
      create: {
        provider: providerCode,
        apiKey: body.apiKey || null,
        model: Array.isArray(metadata.models) && metadata.models[0]?.id ? metadata.models[0].id : body.model || null,
        enabled: body.enabled ?? true,
        priority: body.priority ?? 99,
        costPerUnit: body.costPerUnit ?? (metadata.models?.[0]?.costPerMinute ?? 0),
        rateLimit: body.rateLimits?.requestsPerMinute ?? null,
        metadata,
      },
    });

    return NextResponse.json({ provider: toApiProvider(updated) });
  } catch (error: any) {
>>>>>>> 99cf29b403b8f1e10a76b487acd81b5c8b2f0a09
    return NextResponse.json({ error: error.message || 'Error actualizando proveedor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
<<<<<<< HEAD
    
    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    // Eliminar de la base de datos
    await prisma.apiConfiguration.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error eliminando proveedor:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }
    
=======
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    await prisma.apiConfiguration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
>>>>>>> 99cf29b403b8f1e10a76b487acd81b5c8b2f0a09
    return NextResponse.json({ error: error.message || 'Error eliminando proveedor' }, { status: 500 });
  }
}
