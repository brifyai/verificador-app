import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';
import { verifyStreamStatus } from '@/lib/stream-verifier-enhanced';
import jwt from 'jsonwebtoken';

// Secreto JWT - usar el mismo que el middleware
const JWT_SECRET = 'supersecret-key-for-nextauth-jwt-2024-verificador-app-secure';

// Función para verificar autenticación JWT
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
 * POST /api/radios-direct/[id]/verify
 * Verifica manualmente el estado de una radio específica
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación con nuestro sistema JWT
    const user = await verifyAuth(request);
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Buscar la radio
    const radios = await supabaseDirect.request(
      `radios?select=id,name,stream_url,region&id=eq.${id}`
    );

    if (radios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Radio no encontrada' },
        { status: 404 }
      );
    }

    const radio = radios[0];

    // Verificar el stream
    logger.info(`Manual verification requested for radio: ${radio.name} (${id})`);
    const verification = await verifyStreamStatus(radio.stream_url);
    logger.info(
      `Verification result for ${radio.name}: ${verification.status} - ${verification.details}`
    );

    // Determinar el estado final (ONLINE/OFFLINE)
    const finalStatus = verification.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
    const finalDetails = verification.details;

    // Actualizar la base de datos con el resultado
    await supabaseDirect.request(
      `radios?id=eq.${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          last_verification_status: finalStatus,
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        radioId: id,
        radioName: radio.name,
        status: finalStatus,
        details: finalDetails,
        method: verification.method,
        responseCode: verification.responseCode,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Error en verificación manual de radio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}