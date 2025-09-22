import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const publicPaths = ['/auth/signin', '/auth/signup', '/auth/error', '/auth/signout', '/login', '/dashboard', '/dashboard-directo', '/dashboard-libre', '/audios', '/configuracion', '/equipo', '/frases', '/inteligencia', '/monitoreo', '/perfil', '/radios', '/reportes', '/verificacion'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar recursos estáticos
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // TEMPORALMENTE: Permitir acceso libre a todas las rutas del dashboard
  // Comentar estas líneas cuando el login esté funcionando
  return NextResponse.next();

  /* CÓDIGO ORIGINAL - DESCOMENTAR CUANDO EL LOGIN FUNCIONE
  // Obtener token de sesión de NextAuth
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Si está logueado y quiere ir al login, mándalo al dashboard (pero no si ya está en dashboard)
  if (isAuthenticated && (pathname.startsWith('/login') || pathname.startsWith('/auth/'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si no está logueado y quiere ir a rutas privadas
  if (!isAuthenticated && !publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
  */
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
