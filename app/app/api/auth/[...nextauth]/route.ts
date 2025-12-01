
// DESACTIVADO: NextAuth.js causa conflictos con Edge Runtime
// import NextAuth from 'next-auth';
// import { authOptions } from '@/lib/auth';

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

// Retornar error 404 para deshabilitar NextAuth
export async function GET() {
  return new Response('NextAuth deshabilitado', { status: 404 });
}

export async function POST() {
  return new Response('NextAuth deshabilitado', { status: 404 });
}
