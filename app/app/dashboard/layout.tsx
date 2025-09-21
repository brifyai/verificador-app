import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { jwtVerify } from 'jose';

import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar autenticación
  const session = await getServerSession();
  
  // Verificar token personalizado
  const cookieStore = cookies();
  const token = cookieStore.get('session-token')?.value;
  
  let isAuthenticated = !!session;
  
  if (token) {
    try {
      // Verificar JWT (usando una clave secreta simple para este ejemplo)
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key'));
      isAuthenticated = true;
    } catch (error) {
      console.error('Error al verificar token:', error);
    }
  }
  
  // Redirigir si no está autenticado
  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}