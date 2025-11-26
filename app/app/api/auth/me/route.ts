import { NextRequest, NextResponse } from 'next/server';
import { authManual } from '@/lib/auth-manual';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }
    
    const session = await authManual.verifySession(token);
    
    if (session) {
      return NextResponse.json({
        authenticated: true,
        user: session.user
      });
    }
    
    return NextResponse.json({ authenticated: false });
    
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: 'Error verificando sesión' },
      { status: 500 }
    );
  }
}