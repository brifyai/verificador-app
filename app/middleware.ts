import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Rutas que no requieren autenticación
const publicPaths = ['/auth/signin', '/auth/signup', '/auth/error', '/auth/signout'];

// Rutas de recursos estáticos y API que deben ser excluidas del middleware
const excludedPaths = ['/api/auth', '/_next', '/favicon.ico', '/public'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar si es una ruta excluida (API, recursos estáticos)
  if (excludedPaths.some(path => pathname.startsWith(path)) || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Verificar si hay una cookie de sesión personalizada
  const sessionToken = request.cookies.get('session-token')?.value;
  let isAuthenticated = false;
  
  if (sessionToken) {
    try {
      // Verificar el token JWT
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'tu-secreto-seguro-aqui');
      await jwtVerify(sessionToken, secret);
      isAuthenticated = true;
    } catch (error) {
      console.error('Error al verificar token JWT:', error);
      isAuthenticated = false;
    }
  }
  
  // Si no hay token personalizado, intentar con NextAuth
  if (!isAuthenticated) {
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    isAuthenticated = !!nextAuthToken;
  }

  // Caso 1: Usuario autenticado intentando acceder a rutas de auth
  if (isAuthenticated && publicPaths.some(path => pathname.startsWith(path))) {
    // Redirigir al dashboard si ya está autenticado
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Caso 2: Usuario no autenticado intentando acceder a rutas protegidas
  if (!isAuthenticated && !publicPaths.some(path => pathname.startsWith(path))) {
    // Redirigir al login sin añadir callbackUrl para evitar bucles
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

// Configurar las rutas que deben ser procesadas por el middleware
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|_next/scripts|favicon.ico).*)'],
};