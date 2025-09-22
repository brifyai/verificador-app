import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { jwtVerify } from 'jose';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEMPORALMENTE: Deshabilitar toda la autenticación en el layout del dashboard
  // Comentar estas líneas cuando el login esté funcionando
  
  /* CÓDIGO ORIGINAL - DESCOMENTAR CUANDO EL LOGIN FUNCIONE
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
  */

  // Ahora el sidebar y header están en el layout principal, solo devolvemos el contenido
  return <>{children}</>;
}