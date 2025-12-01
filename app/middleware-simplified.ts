import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseDirect } from './lib/supabase-direct';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/test-login',
  '/test-streaming-platform',
  '/api/auth/login-direct',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/providers',
  '/api/auth/session',
  '/api/dashboard/stats-direct',
  '/api/radios-direct',
  '/api/audios/list',
  '/api/audios/stats',
  '/api/audios/download',
  '/api/detecciones-direct',
  '/api/monitoring/detections-direct',
  '/api/monitoring/start-direct',
  '/api/monitoring/stop-direct',
  '/api/billing/invoices-direct',
  '/api/billing/profiles-direct',
  '/api/billing/subscriptions-direct',
  '/api/payment-methods-direct'
];

// Función para verificar si una ruta es pública
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

// Función para verificar token JWT
async function verifyJWTToken(token: string): Promise<any | null> {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET no configurado');
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verificar que el usuario exista y esté activo
    const users = await supabaseDirect.getUsers();
    const user = users.find((u: any) => u.id === decoded.userId && u.email === decoded.email);
    
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
    console.error('Error verificando token JWT:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Obtener token del header Authorization o de la cookie
  const authHeader = request.headers.get('Authorization');
  const tokenCookie = request.cookies.get('auth-token');
  
  let token: string | null = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (tokenCookie) {
    token = tokenCookie.value;
  }

  // Si no hay token, redirigir al login
  if (!token) {
    console.log('Middleware - Sin token, redirigiendo al login:', pathname);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Verificar el token
  const user = await verifyJWTToken(token);
  
  if (!user) {
    console.log('Middleware - Token inválido, redirigiendo al login:', pathname);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Si el usuario está autenticado y trata de acceder a rutas de auth, redirigir al dashboard
  if (user && ['/auth/signin', '/auth/signup'].includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Agregar información del usuario al header para que esté disponible en las rutas
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-email', user.email);
  requestHeaders.set('x-user-role', user.role);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Si hay un token válido, asegurar la cookie
  if (token) {
    response.cookies.set('auth-token', token, {
      httpOnly: false, // Debe ser accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });
  }

  console.log('Middleware - Usuario autenticado:', user.email, 'Ruta:', pathname);
  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas EXCEPTO:
     * - Archivos estáticos de Next.js (_next/static, _next/image)
     * - Favicon y archivos de imagen
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
};