'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verificar sesión al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  // Verificar sesión
  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth-token');
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return false;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setLoading(false);
          return true;
        }
      }

      // Si falla, limpiar token
      localStorage.removeItem('auth-token');
      setUser(null);
      setLoading(false);
      return false;
      
    } catch (error) {
      console.error('Error verificando auth:', error);
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  // Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.token) {
          localStorage.setItem('auth-token', data.token);
          setUser(data.user);
          return true;
        }
      }

      return false;
      
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('auth-token');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        localStorage.removeItem('auth-token');
        setUser(null);
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error('Error en logout:', error);
      localStorage.removeItem('auth-token');
      setUser(null);
      router.push('/auth/signin');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}