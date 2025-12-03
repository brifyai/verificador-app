import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';

// Secreto JWT - usar el mismo que el middleware
const JWT_SECRET = 'supersecret-key-for-nextauth-jwt-2024-verificador-app-secure';

// Función para verificar autenticación JWT (misma que radios-direct)
async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tokenCookie = request.cookies.get('auth-token');
    
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenCookie) {
      token = tokenCookie.value;
    }
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verificar que el usuario exista y esté activo
    const users = await supabaseDirect.getUsers();
    const user = users.find((u: any) => u.id === decoded.id && u.email === decoded.email);
    
    if (!user || !user.active) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name || 'Usuario',
      role: user.role || 'user'
    };
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return null;
  }
}

/**
 * PATCH /api/radios/[id]/status
 * Actualiza solo el estado (activo/inactivo) de una radio
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación con JWT (mismo sistema que radios-direct)
    const user = await verifyAuth(request);
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    logger.info(`[RADIO-STATUS] Usuario autenticado: ${user.email}`);

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