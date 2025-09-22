
import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { NextAuthOptions } from 'next-auth';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 AUTHORIZE - Credenciales recibidas:', { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password 
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ AUTHORIZE - Credenciales faltantes');
          return null;
        }

        try {
          console.log('🔍 AUTHORIZE - Buscando usuario en BD...');
          // Buscar usuario en la base de datos
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          console.log('👤 AUTHORIZE - Usuario encontrado:', { 
            exists: !!user, 
            active: user?.active,
            email: user?.email,
            role: user?.role 
          });

          // Si no existe el usuario o no está activo
          if (!user || !user.active) {
            console.log('❌ AUTHORIZE - Usuario no existe o inactivo');
            return null;
          }

          console.log('🔒 AUTHORIZE - Verificando contraseña...');
          // Verificar contraseña
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          
          console.log('🔑 AUTHORIZE - Contraseña válida:', passwordMatch);
          
          if (!passwordMatch) {
            console.log('❌ AUTHORIZE - Contraseña incorrecta');
            return null;
          }
          
          // Devolver datos del usuario para la sesión
          const userData = {
            id: user.id,
            email: user.email,
            name: user.name || 'Usuario',
            role: user.role
          };
          
          console.log('✅ AUTHORIZE - Login exitoso, devolviendo:', userData);
          return userData;
        } catch (error) {
          console.error('💥 AUTHORIZE - Error en autenticación:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 // 7 días
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 // 10 minutos
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 // 1 hora
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Si es una URL relativa, convertirla a absoluta
      if (url.startsWith('/')) {
        url = `${baseUrl}${url}`;
      }

      // Verificar si la URL pertenece al mismo dominio
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        if (urlObj.origin !== baseUrlObj.origin) {
          return `${baseUrl}/dashboard`;
        }
      } catch {
        return `${baseUrl}/dashboard`;
      }

      // Si la URL es exactamente la página de signin, redirigir al dashboard
      const urlObj = new URL(url);
      if (urlObj.pathname === '/auth/signin') {
        return `${baseUrl}/dashboard`;
      }
      
      // Después del logout, redirigir al signin
      if (urlObj.pathname === '/auth/signout') {
        return `${baseUrl}/auth/signin`;
      }

      // Verificar si es una ruta protegida válida
      const protectedRoutes = ['/dashboard', '/profile', '/settings'];
      if (protectedRoutes.some(route => urlObj.pathname.startsWith(route))) {
        return url;
      }

      // Para cualquier otra URL, redirigir al dashboard por defecto
      return `${baseUrl}/dashboard`;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
