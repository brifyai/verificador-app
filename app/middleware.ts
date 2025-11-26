import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasPermission } from './lib/permissions';
import { supabaseDirect } from './lib/supabase-direct';

// Función para obtener token de la cookie auth-token
function getAuthTokenFromCookie(req: any) {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const match = cookieHeader.match(/auth-token=([^;]+)/);
  return match ? match[1] : null;
}

// Función para verificar sesión directa usando Supabase
async function verifyDirectSession(req: any) {
  try {
    const authToken = getAuthTokenFromCookie(req);
    if (!authToken) return null;

    // El token es el user_id (simple y directo)
    const userId = authToken;
    
    // Verificar que el usuario existe y está activo
    const users = await supabaseDirect.getUsers();
    const user = users.find((u: any) => u.id === userId && u.active);
    
    if (!user) return null;
    
    // Devolver objeto compatible con NextAuth token
    return {
      id: user.id,
      email: user.email,
      name: user.name || 'Usuario',
      role: user.role
    };
  } catch (error) {
    console.error('Error verificando sesión directa:', error);
    return null;
  }
}

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const nextAuthToken = req.nextauth?.token;

    // Rutas públicas que no requieren autenticación
    const publicRoutes = [
      '/auth/signin',
      '/auth/signup',
      '/auth/error',
      '/api/audios/list',
      '/auth/test-login'
    ];

    // Aceptar prefijos públicos
    if (pathname.startsWith('/api/audios/download')) {
      return NextResponse.next();
    }

    // Excluir rutas públicas exactas
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    // Intentar obtener sesión del sistema directo si no hay NextAuth token
    let directToken = null;
    if (!nextAuthToken) {
      directToken = await verifyDirectSession(req);
    }

    // Usar el token que esté disponible
    const token = nextAuthToken || directToken;

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
      authorized: async ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Rutas públicas que no requieren autenticación
        const publicRoutes = [
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/api/audios/list',
          '/auth/test-login'
        ];

        // Permitir acceso a rutas públicas sin token
        if (publicRoutes.includes(pathname) || pathname.startsWith('/api/audios/download')) {
          return true;
        }

        // Si hay token de NextAuth, usarlo
        if (token) {
          return true;
        }

        // Verificar si hay sesión directa
        const directSession = await verifyDirectSession(req);
        return !!directSession;
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
