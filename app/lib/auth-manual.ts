// Sistema de autenticación manual independiente de NextAuth
// Para uso con Supabase directamente

import { supabaseDirect } from '@/lib/supabase-direct';
import bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

// Almacenamiento de sesiones en memoria (para desarrollo)
// En producción, usar Redis o similar
const sessions = new Map<string, AuthSession>();

export class AuthManual {
  // Login con email y password
  async login(email: string, password: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    try {
      // Buscar usuario en Supabase
      const users = await supabaseDirect.getUsers({ email });
      
      if (users.length === 0) {
        return { success: false, error: 'Usuario no encontrado' };
      }
      
      const user = users[0];
      
      // Verificar contraseña
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return { success: false, error: 'Contraseña incorrecta' };
      }
      
      if (!user.active) {
        return { success: false, error: 'Usuario inactivo' };
      }
      
      // Crear sesión
      const session: AuthSession = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || 'Usuario',
          role: user.role
        },
        token: this.generateToken(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 días
      };
      
      // Guardar sesión
      sessions.set(session.token, session);
      
      return { success: true, session };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Generar token de sesión
  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  // Verificar sesión
  async verifySession(token: string): Promise<AuthSession | null> {
    const session = sessions.get(token);
    
    if (!session) {
      return null;
    }
    
    // Verificar expiración
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return null;
    }
    
    return session;
  }
  
  // Cerrar sesión
  async logout(token: string): Promise<void> {
    sessions.delete(token);
  }
  
  // Obtener todas las sesiones (para debug)
  getAllSessions(): Map<string, AuthSession> {
    return sessions;
  }
}

export const authManual = new AuthManual();