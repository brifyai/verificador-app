
import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';

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
          return null;
        }

        // Simular verificación de credenciales
        if (credentials.email === 'admin@aintelligence.cl' && credentials.password === 'admin123') {
          return {
            id: '1',
            email: 'admin@aintelligence.cl',
            name: 'Administrador del Sistema',
            role: 'admin'
          };
        }

        if (credentials.email === 'john@doe.com' && credentials.password === 'johndoe123') {
          return {
            id: '2',
            email: 'john@doe.com',
            name: 'John Doe',
            role: 'admin'
          };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    }
  }
};
