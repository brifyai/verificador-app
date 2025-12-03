import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/register',
  '/api/verify-stream-public', // Nuevo endpoint público
];

export function middlewarePublic(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si la ruta es pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    // Permitir acceso sin autenticación
    return NextResponse.next();
  }

  // Para rutas no públicas, no hacer nada (dejar que el middleware principal maneje)
  return null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};