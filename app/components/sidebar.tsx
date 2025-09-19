
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
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Mis Frases', href: '/frases', icon: MessageSquare },
  { name: 'Radios', href: '/radios', icon: Radio },
  { name: 'Audios', href: '/audios', icon: FileAudio },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
  { name: 'Monitoreo', href: '/monitoreo', icon: Activity },
  { name: 'Verificación', href: '/verificacion', icon: CheckCircle },
  { name: 'Inteligencia', href: '/inteligencia', icon: Brain },
  { name: 'Equipo', href: '/equipo', icon: Users },
  { name: 'Mi Perfil', href: '/perfil', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
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
            {navigation.map((item) => {
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
            <div className="flex items-center text-sm text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Sistema activo
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
