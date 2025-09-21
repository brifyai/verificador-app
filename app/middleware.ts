import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const publicPaths = ['/auth/signin', '/auth/signup', '/auth/error', '/auth/signout', '/login'];

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

  // Obtener token de sesión de NextAuth
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Si está logueado y quiere ir al login, mándalo al dashboard
  if (isAuthenticated && publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si no está logueado y quiere ir a rutas privadas
  if (!isAuthenticated && !publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
