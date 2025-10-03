// Configuración de permisos por rol
export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: UserRole[]; // Roles que pueden acceder a esta página
}

// Definición de permisos por página
export const ROLE_PERMISSIONS = {
  // Páginas básicas - todos los usuarios autenticados
  '/dashboard': ['USER', 'MODERATOR', 'ADMIN'] as UserRole[],
  '/perfil': ['USER', 'MODERATOR', 'ADMIN'] as UserRole[],
  
  // Páginas para usuario verificador
  '/verificacion': ['USER', 'ADMIN'] as UserRole[],
  '/frases': ['USER', 'ADMIN'] as UserRole[],
  '/reportes': ['USER', 'MODERATOR', 'ADMIN'] as UserRole[],
  '/audios': ['USER', 'ADMIN'] as UserRole[],
  
  // Páginas para analista (moderador)
  '/inteligencia': ['MODERATOR', 'ADMIN'] as UserRole[],
  '/reportes': ['USER', 'MODERATOR', 'ADMIN'] as UserRole[],
  
  // Páginas solo para administrador
  '/radios': ['ADMIN'] as UserRole[],
  '/monitoreo': ['ADMIN'] as UserRole[],
  '/equipo': ['ADMIN'] as UserRole[],
  '/configuracion': ['ADMIN'] as UserRole[],
};

/**
 * Verifica si un usuario tiene permisos para acceder a una página específica
 */
export function hasPermission(userRole: string | null | undefined, path: string): boolean {
  if (!userRole) return false;
  
  const allowedRoles = ROLE_PERMISSIONS[path as keyof typeof ROLE_PERMISSIONS];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(userRole as UserRole);
}

/**
 * Filtra las páginas de navegación según el rol del usuario
 */
export function getFilteredNavigation(userRole: string | null | undefined, navigation: NavigationItem[]): NavigationItem[] {
  if (!userRole) return [];
  
  return navigation.filter(item => hasPermission(userRole, item.href));
}

/**
 * Obtiene la descripción del rol para mostrar en la UI
 */
export function getRoleDescription(role: string | null | undefined): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'MODERATOR':
      return 'Moderador';
    case 'USER':
      return 'Usuario';
    default:
      return 'Sin rol';
  }
}

/**
 * Verifica si el usuario es administrador
 */
export function isAdmin(userRole: string | null | undefined): boolean {
  return userRole === 'ADMIN';
}

/**
 * Verifica si el usuario es moderador o administrador
 */
export function isModerator(userRole: string | null | undefined): boolean {
  return userRole === 'MODERATOR' || userRole === 'ADMIN';
}