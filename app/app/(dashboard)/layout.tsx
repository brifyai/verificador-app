import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar sesión del usuario (NextAuth o token personalizado)
  const session = await getServerSession(authOptions);
  const sessionToken = cookies().get('session-token')?.value;
  
  let isAuthenticated = !!session;
  
  // Si no hay sesión de NextAuth, verificar token personalizado
  if (!isAuthenticated && sessionToken) {
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'tu-secreto-seguro-aqui');
      await jwtVerify(sessionToken, secret);
      isAuthenticated = true;
    } catch (error) {
      console.error('Error al verificar token JWT:', error);
      isAuthenticated = false;
    }
  }
  
  // Si no hay sesión, redirigir al login
  if (!isAuthenticated) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}