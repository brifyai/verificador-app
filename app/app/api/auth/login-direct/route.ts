import { NextRequest, NextResponse } from 'next/server';
import { authManual } from '@/lib/auth-manual';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    const result = await authManual.login(email, password);
    
    if (result.success && result.session) {
      // Guardar el user_id como token (simple y directo)
      const userId = result.session.user.id;
      
      const response = NextResponse.json({
        success: true,
        user: result.session.user,
        token: userId  // El token es simplemente el user_id
      });
      
      // Configurar cookie con el user_id
      response.cookies.set('auth-token', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/'
      });
      
      return response;
    }
    
    return NextResponse.json(
      { success: false, error: result.error || 'Login fallido' },
      { status: 401 }
    );
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}