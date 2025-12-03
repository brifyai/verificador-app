import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt-simple';

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/api/auth/login-direct',
  '/api/auth/register',
  '/api/auth/providers',
  '/api/auth/setup-admin',
  '/api/health',
  '/favicon.ico',
  '/_next',
  '/static',
  '/.well-known'
];

// Rutas de API públicas
const publicApiRoutes = [
  '/api/auth/login-direct',
  '/api/auth/register',
  '/api/auth/providers',
  '/api/auth/setup-admin',
  '/api/verify-stream-public', // Nuevo endpoint público para verificación de streams
  '/api/recording-proxy-public', // Proxy público para grabaciones
  '/api/recording-vps-direct', // Endpoint directo al VPS para grabaciones
  '/api/recording-vps-fixed', // Endpoint con solución definitiva para el bug del VPS
  '/api/vps-diagnostic' // Endpoint de diagnóstico del VPS
];

function isPublicRoute(pathname: string): boolean {
  // Verificar rutas exactas
  if (publicRoutes.includes(pathname)) {
    return true;
  }
  
  // Verificar rutas que comienzan con prefijos públicos
  return publicRoutes.some(route => 
    route !== '/' && pathname.startsWith(route)
  );
}

function isPublicApiRoute(pathname: string): boolean {
  return publicApiRoutes.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('[MIDDLEWARE] Procesando ruta:', pathname);
  
  // Permitir rutas públicas
  if (isPublicRoute(pathname)) {
    console.log('[MIDDLEWARE] Ruta pública permitida:', pathname);
    return NextResponse.next();
  }
  
  // Para rutas de API, verificar si es pública
  if (pathname.startsWith('/api/') && isPublicApiRoute(pathname)) {
    console.log('[MIDDLEWARE] Ruta API pública permitida:', pathname);
    return NextResponse.next();
  }
  
  // Obtener token de los headers o cookies
  const authHeader = request.headers.get('authorization');
  const tokenCookie = request.cookies.get('auth-token');
  
  console.log('[MIDDLEWARE] Auth header:', authHeader ? 'Presente' : 'No presente');
  console.log('[MIDDLEWARE] Token cookie:', tokenCookie ? 'Presente' : 'No presente');
  
  const token = authHeader?.replace('Bearer ', '') || tokenCookie?.value;
  
  if (!token) {
    console.log('[MIDDLEWARE] No token found, redirigiendo al login desde:', pathname);
    
    // Para rutas de API, devolver error 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Para rutas de página, redirigir al login
    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  console.log('[MIDDLEWARE] Token encontrado, verificando...');
  console.log('[MIDDLEWARE] Token preview:', token.substring(0, 20) + '...');
  
  try {
    // Verificar token usando implementación Edge Runtime compatible
    const decoded = await verifyJWT(token);
    
    if (!decoded) {
      console.log('[MIDDLEWARE] Token inválido, redirigiendo al login desde:', pathname);
      
      // Para rutas de API, devolver error 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        );
      }
      
      // Para rutas de página, redirigir al login
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log('[MIDDLEWARE] Token válido, permitiendo acceso');
    
    // Agregar información del usuario al header para que esté disponible en las rutas
    const response = NextResponse.next();
    response.headers.set('x-user-id', decoded.id);
    response.headers.set('x-user-email', decoded.email);
    response.headers.set('x-user-role', decoded.role);
    
    return response;
    
  } catch (error) {
    console.error('[MIDDLEWARE] Error verificando token:', error);
    console.log('[MIDDLEWARE] Token inválido, redirigiendo al login desde:', pathname);
    
    // Para rutas de API, devolver error 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }
    
    // Para rutas de página, redirigir al login
    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};