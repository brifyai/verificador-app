import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt-simple';
import { logger } from '@/lib/logger';
import { supabaseDirect } from '@/lib/supabase-direct';

export async function GET(request: NextRequest) {
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { authenticated: false, error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar JWT_SECRET - usar el mismo secreto que el middleware
    const JWT_SECRET = 'supersecret-key-for-nextauth-jwt-2024-verificador-app-secure';
    if (!JWT_SECRET) {
      logger.error('AUTH/ME - JWT_SECRET no configurado');
      return NextResponse.json(
        { authenticated: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    logger.auth('AUTH/ME - Verificando token con secreto', { secretPreview: JWT_SECRET.substring(0, 10) + '...' });

    // Verificar y decodificar el token usando implementación Edge Runtime compatible
    let decoded: any;
    try {
      decoded = await verifyJWT(token);
      if (!decoded) {
        logger.auth('AUTH/ME - Token inválido', { token: token.substring(0, 20) + '...' });
        return NextResponse.json(
          { authenticated: false, error: 'Token inválido o expirado' },
          { status: 401 }
        );
      }
    } catch (error) {
      logger.auth('AUTH/ME - Error verificando token', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { authenticated: false, error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario exista en Supabase
    const users = await supabaseDirect.getUsers();
    const user = users.find((u: any) => u.id === decoded.id && u.email === decoded.email);

    if (!user) {
      logger.auth('AUTH/ME - Usuario no encontrado', { userId: decoded.id });
      return NextResponse.json(
        { authenticated: false, error: 'Usuario no encontrado' },
        { status: 401 }
      );
    }

    if (!user.active) {
      logger.auth('AUTH/ME - Usuario inactivo', { userId: decoded.id });
      return NextResponse.json(
        { authenticated: false, error: 'Usuario inactivo' },
        { status: 401 }
      );
    }

    // Devolver datos del usuario
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name || 'Usuario',
      role: user.role || 'user'
    };

    logger.auth('AUTH/ME - Usuario autenticado', { userId: user.id, email: user.email });
    
    return NextResponse.json({
      authenticated: true,
      user: userData
    });

  } catch (error) {
    logger.error('AUTH/ME - Error verificando autenticación', error);
    return NextResponse.json(
      { authenticated: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}