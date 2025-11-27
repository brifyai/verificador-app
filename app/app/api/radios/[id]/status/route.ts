import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';

/**
 * PATCH /api/radios/[id]/status
 * Actualiza solo el estado (activo/inactivo) de una radio
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    
    const { isActive } = body;
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'El campo isActive debe ser booleano' 
      }, { status: 400 });
    }

    // Verificar que la radio existe
    const existingRadios = await supabaseDirect.request(`radios?select=*&id=eq.${id}`);
    if (existingRadios.length === 0) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }

    const existingRadio = existingRadios[0];

    // Actualizar solo el estado
    const updateData = {
      status: isActive ? 'ACTIVE' : 'INACTIVE',
      updated_at: new Date().toISOString()
    };

    const updatedRadios = await supabaseDirect.request(`radios?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedRadio = updatedRadios[0];
    
    // Devolver la radio actualizada
    const metadata = updatedRadio.metadata as Record<string, any> || {};
    const transformedRadio = {
      id: updatedRadio.id,
      name: updatedRadio.name,
      programadora: metadata.programadora || '',
      frequency: metadata.frequency || '',
      streamUrl: updatedRadio.stream_url,
      streamPlatform: metadata.streamPlatform || updatedRadio.platform.toLowerCase(),
      region: updatedRadio.region,
      city: metadata.city || '',
      website: metadata.website || '',
      isActive: updatedRadio.status === 'ACTIVE',
      genre: updatedRadio.description || 'Música',
      priority: updatedRadio.priority || 1,
      costPerHour: updatedRadio.cost_per_hour || 0.0,
      lastMonitored: metadata.lastMonitored || 'Nunca',
      lastVerificationStatus: updatedRadio.last_verification_status,
      lastVerifiedAt: updatedRadio.last_verified_at,
      createdAt: updatedRadio.created_at,
      updatedAt: updatedRadio.updated_at,
    };

    logger.info(`Estado de radio actualizado: ${updatedRadio.name} - ${isActive ? 'ACTIVO' : 'INACTIVO'}`);
    
    return NextResponse.json({ 
      success: true, 
      data: transformedRadio,
      message: `Radio ${isActive ? 'activada' : 'desactivada'} exitosamente` 
    });
  } catch (error) {
    logger.error('Error actualizando estado de radio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}