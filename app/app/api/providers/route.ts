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
    
    // Preparar metadata con la información adicional
    const metadata = {
      name: body.name,
      type: body.type || 'transcription',
      baseUrl: body.baseUrl || '',
      models: body.models || [],
      rateLimits: body.rateLimits || {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      headers: body.headers || {}
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
    return NextResponse.json({ error: error.message || 'Error creando proveedor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }
    
    // Buscar el registro existente
    const existing = await prisma.apiConfiguration.findUnique({
      where: { id: id }
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
      where: { id: id },
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
    return NextResponse.json({ error: error.message || 'Error actualizando proveedor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
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
    
    return NextResponse.json({ error: error.message || 'Error eliminando proveedor' }, { status: 500 });
  }
}
