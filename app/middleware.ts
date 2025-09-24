import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasPermission } from './lib/permissions';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error'];
    
    // Si el usuario está autenticado y trata de acceder a rutas de auth, redirigir al dashboard
    if (token && publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Verificar permisos para rutas protegidas
    if (token && !publicRoutes.includes(pathname)) {
      const userRole = token.role as string;
      
      // Verificar si el usuario tiene permisos para acceder a esta página
      if (!hasPermission(userRole, pathname)) {
        // Redirigir al dashboard si no tiene permisos
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Permitir acceso normal a todas las demás rutas
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Rutas públicas que no requieren autenticación
        const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error'];

        // Permitir acceso a rutas públicas sin token
        if (publicRoutes.includes(pathname)) {
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
