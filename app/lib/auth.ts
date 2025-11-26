
import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';
import { supabaseDirect } from '@/lib/supabase-direct'; // ✅ Usar cliente directo de Supabase
import { logger } from '@/lib/logger';

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
        logger.auth('AUTHORIZE - Credenciales recibidas', { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password 
        });

        if (!credentials?.email || !credentials?.password) {
          logger.auth('AUTHORIZE - Credenciales faltantes');
          return null;
        }

        try {
          logger.auth('AUTHORIZE - Buscando usuario en BD...');
          // Buscar usuario en la base de datos usando Supabase Direct
          const users = await supabaseDirect.getUsers();
          const user = users.find(u => u.email === credentials.email);

          logger.auth('AUTHORIZE - Usuario encontrado', {
            exists: !!user,
            active: user?.active,
            email: user?.email,
            role: user?.role
          });

          // Si no existe el usuario o no está activo
          if (!user || !user.active) {
            logger.auth('AUTHORIZE - Usuario no existe o inactivo');
            return null;
          }

          logger.auth('AUTHORIZE - Verificando contraseña...');
          // Verificar contraseña
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          
          logger.auth('AUTHORIZE - Contraseña válida', { passwordMatch });
          
          if (!passwordMatch) {
            logger.auth('AUTHORIZE - Contraseña incorrecta');
            return null;
          }
          
          // Devolver datos del usuario para la sesión
          const userData = {
            id: user.id,
            email: user.email,
            name: user.name || 'Usuario',
            role: user.role
          };
          
          logger.auth('AUTHORIZE - Login exitoso, devolviendo', userData);
          return userData;
        } catch (error) {
          logger.error('AUTHORIZE - Error en autenticación', error);
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
      // Siempre redirigir al dashboard después de login exitoso
      if (url === baseUrl || url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      
      // Si es una URL relativa, convertirla a absoluta
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // Por defecto, redirigir al dashboard
      return `${baseUrl}/dashboard`;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false, // Deshabilitar debug para evitar warnings en logs
};
