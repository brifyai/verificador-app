import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';
import { supabaseDirect } from '@/lib/supabase-direct';
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
        logger.auth('AUTHORIZE - Iniciando autenticación', { 
          email: credentials?.email 
        });

        if (!credentials?.email || !credentials?.password) {
          logger.auth('AUTHORIZE - Credenciales faltantes');
          return null;
        }

        try {
          logger.auth('AUTHORIZE - Buscando usuario en Supabase...');
          
          // Buscar usuario directamente en Supabase
          const users = await supabaseDirect.getUsers();
          const user = users.find((u: any) => u.email === credentials.email);

          if (!user) {
            logger.auth('AUTHORIZE - Usuario no encontrado');
            return null;
          }

          if (!user.active) {
            logger.auth('AUTHORIZE - Usuario inactivo');
            return null;
          }

          // Verificar contraseña
          logger.auth('AUTHORIZE - Verificando contraseña...');
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!passwordMatch) {
            logger.auth('AUTHORIZE - Contraseña incorrecta');
            return null;
          }
          
          // Éxito - devolver datos del usuario
          const userData = {
            id: user.id,
            email: user.email,
            name: user.name || 'Usuario',
            role: user.role || 'user'
          };
          
          logger.auth('AUTHORIZE - Login exitoso', userData);
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
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
  
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 días
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
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string
        };
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Redirigir siempre al dashboard después de login
      if (url === baseUrl || url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      return `${baseUrl}/dashboard`;
    }
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  // Deshabilitar debug para evitar spam en logs
  debug: false,
};

// Exportar helper para verificar auth en APIs
export async function requireAuth(session: any) {
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }
  return session.user;
}

// Exportar helper para verificar roles
export function requireRole(session: any, allowedRoles: string[]) {
  const user = session?.user;
  if (!user?.id || !user?.role) {
    throw new Error('No autorizado');
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Permisos insuficientes');
  }
  
  return user;
}