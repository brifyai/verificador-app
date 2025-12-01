import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Obtener token del header Authorization (opcional, para logging)
    const authHeader = request.headers.get('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      logger.auth('AUTH/LOGOUT - Cierre de sesión', { token: token.substring(0, 10) + '...' });
    }

    // Crear respuesta que limpie la cookie del token
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

    // Limpiar la cookie del token
    response.cookies.set('auth-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expirar inmediatamente
    });

    return response;

  } catch (error) {
    logger.error('AUTH/LOGOUT - Error en logout', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}