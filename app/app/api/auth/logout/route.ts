import { NextRequest, NextResponse } from 'next/server';
import { authManual } from '@/lib/auth-manual';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      await authManual.logout(token);
    }
    
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');
    
    return response;
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error en logout' },
      { status: 500 }
    );
  }
}