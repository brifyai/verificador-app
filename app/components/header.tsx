
'use client';

import { Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { GlobalSearch } from '@/components/global-search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from "next/navigation";
interface HeaderProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const handleSignOut = () => {
    signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    });
  };
 const router = useRouter();
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Search bar */}
          <GlobalSearch />

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
 

            {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className='hover:bg-slate-800'>
              <Button
                variant="ghost"
                className="flex items-center space-x-3 text-slate-300 hover:text-white"
              >
                <span className="text-right">
                  <span className="block text-sm font-medium text-white">
                    {user?.name || "Usuario"}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {user?.role || "Usuario"}
                  </span>
                </span>
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 bg-slate-900 text-slate-200 border border-slate-700 shadow-lg"
            >
              <DropdownMenuLabel className="text-slate-400">Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              
              <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800" onClick={() => router.push("/perfil")}>
                <User className="mr-2 h-4 w-4 text-slate-400" />
                <span>Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-slate-700" />
              
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-500 hover:bg-slate-800 focus:bg-slate-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          </div>
        </div>
      </div>
    </header>
  );
}
