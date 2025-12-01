import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasPermission } from './lib/permissions';

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Rutas públicas que no requieren autenticación
    const publicRoutes = [
      '/auth/signin',
      '/auth/signup', 
      '/auth/error',
      '/api/audios/list',
      '/auth/test-login',
      '/test-streaming-platform'
    ];

    // Rutas de API que deben ser públicas
    const publicApiRoutes = [
      '/api/audios/download',
      '/api/auth/providers',
      '/api/auth/session',
      '/api/auth/login-direct',
      '/api/dashboard/stats-direct',
      '/api/radios-direct',
      '/api/audios/list',
      '/api/audios/stats',
      '/api/detecciones-direct',
      '/api/monitoring/detections-direct',
      '/api/monitoring/start-direct',
      '/api/monitoring/stop-direct',
      '/api/billing/invoices-direct',
      '/api/billing/profiles-direct',
      '/api/billing/subscriptions-direct',
      '/api/payment-methods-direct'
    ];

    // Verificar si la ruta actual es pública
    const isPublicRoute = publicRoutes.includes(pathname);
    const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));

    if (isPublicRoute || isPublicApiRoute) {
      return NextResponse.next();
    }

    // Si el usuario está autenticado y trata de acceder a rutas de auth, redirigir al dashboard
    if (token && ['/auth/signin', '/auth/signup'].includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Verificar permisos para rutas protegidas
    if (token) {
      const userRole = token.role as string;
      if (!hasPermission(userRole, pathname)) {
        console.log('Middleware - Permisos insuficientes', { 
          user: token.email, 
          role: userRole, 
          path: pathname 
        });
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Sin token - redirigir a login para rutas protegidas
    console.log('Middleware - Sin autenticación', { path: pathname });
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Rutas públicas que no requieren autenticación
        const publicRoutes = [
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/api/audios/list',
          '/auth/test-login',
          '/test-streaming-platform'
        ];

        const publicApiRoutes = [
          '/api/audios/download',
          '/api/auth/providers',
          '/api/auth/session',
          '/api/auth/login-direct',
          '/api/dashboard/stats-direct',
          '/api/radios-direct',
          '/api/audios/list',
          '/api/audios/stats',
          '/api/detecciones-direct',
          '/api/monitoring/detections-direct',
          '/api/monitoring/start-direct',
          '/api/monitoring/stop-direct',
          '/api/billing/invoices-direct',
          '/api/billing/profiles-direct',
          '/api/billing/subscriptions-direct',
          '/api/payment-methods-direct'
        ];

        // Permitir acceso a rutas públicas sin token
        if (publicRoutes.includes(pathname)) {
          return true;
        }

        // Permitir acceso a APIs públicas
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Requerir token para todo lo demás
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

// Configuración del matcher
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