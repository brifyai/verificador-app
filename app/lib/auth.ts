
import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Credenciales incompletas');
          return null;
        }

        try {
          // Buscar usuario en la base de datos
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          // Si no existe el usuario o no está activo
          if (!user || !user.active) {
            console.log('Usuario no encontrado o inactivo:', credentials.email);
            return null;
          }

          // Verificar contraseña
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!passwordMatch) {
            console.log('Contraseña incorrecta para:', credentials.email);
            return null;
          }

          console.log('Login exitoso para:', credentials.email);
          
          // Devolver datos del usuario para la sesión
          return {
            id: user.id,
            email: user.email,
            name: user.name || 'Usuario',
            role: user.role
          };
        } catch (error) {
          console.error('Error en autenticación:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'tu-secreto-seguro-aqui',
  debug: process.env.NODE_ENV === 'development',
};
