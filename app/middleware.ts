import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasPermission } from './lib/permissions';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;

    // Rutas públicas que no requieren autenticación (incluye endpoints públicos de API)
    const publicRoutes = [
      '/auth/signin',
      '/auth/signup',
      '/auth/error',
      '/api/audios/list'
    ];

    // Aceptar también prefijos públicos (ej: /api/audios/download?id=...)
    if (pathname.startsWith('/api/audios/download')) {
      return NextResponse.next();
    }

    // Excluir rutas públicas exactas
    if (publicRoutes.includes(pathname)) {
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
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Por defecto (sin token) redirigir a signIn para rutas protegidas
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
          '/api/audios/list'
        ];

        // Permitir acceso a rutas públicas sin token
        if (publicRoutes.includes(pathname) || pathname.startsWith('/api/audios/download')) {
          return true;
        }

        // Para todas las demás rutas, requerir token
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

// Configuración del matcher para el middleware
// Excluye rutas específicas del middleware de autenticación
export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas EXCEPTO:
     * - Rutas de API (todas las rutas /api/*)
     * - Archivos estáticos de Next.js (_next/static, _next/image)
     * - Favicon
     * - Archivos de imagen (png, jpg, jpeg, gif, svg, ico, webp)
     * 
     * Patrón recomendado por Next.js usando negative lookahead
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)',
  ],
};
