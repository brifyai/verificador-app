
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  MessageSquare, 
  CheckCircle, 
  Brain, 
  Users, 
  Menu,
  X,
  Radio,
  Activity,
  Settings,
  FileAudio,
  User
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getFilteredNavigation, getRoleDescription, NavigationItem, UserRole } from '@/lib/permissions';

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3, roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Reportes', href: '/reportes', icon: BarChart3, roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Mis Frases', href: '/frases', icon: MessageSquare, roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Radios', href: '/radios', icon: Radio, roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Audios', href: '/audios', icon: FileAudio, roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Monitoreo', href: '/monitoreo', icon: Activity, roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Verificación', href: '/verificacion', icon: CheckCircle, roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Inteligencia', href: '/inteligencia', icon: Brain, roles: ['MODERATOR', 'ADMIN'] },
  { name: 'Equipo', href: '/equipo', icon: Users, roles: ['MODERATOR', 'ADMIN'] },
  { name: 'Configuración', href: '/configuracion', icon: Settings, roles: ['ADMIN'] },
  { name: 'Mi Perfil', href: '/perfil', icon: User, roles: ['USER', 'MODERATOR', 'ADMIN'] },
];

interface SidebarProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Filtrar navegación según el rol del usuario
  const filteredNavigation = useMemo(() => {
    return getFilteredNavigation(user?.role, navigation);
  }, [user?.role]);

  const userRoleDescription = getRoleDescription(user?.role);

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-slate-800 text-white rounded-lg"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">OndaVerificada</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-slate-700">
            <div className="space-y-3">
              {/* System Status */}
              <div className="flex items-center justify-center">
                <div className="flex items-center px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-600/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-300">Sistema activo</span>
                </div>
              </div>
              
              {/* User Information */}
              {user && (
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {userRoleDescription}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
