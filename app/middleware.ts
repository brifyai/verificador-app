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

export const config = {
  matcher: [
    '/((?!api/auth|api/radios|api/audios/list|api/audios/download|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
