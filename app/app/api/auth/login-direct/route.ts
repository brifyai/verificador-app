import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import { signJWT } from '@/lib/jwt-simple';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    logger.auth('LOGIN-DIRECT - Intentando login', { email });

    // Buscar usuario en Supabase
    logger.auth('LOGIN-DIRECT - Buscando usuario en Supabase...');
    const users = await supabaseDirect.getUsers();
    const user = users.find((u: any) => u.email === email);

    if (!user) {
      logger.auth('LOGIN-DIRECT - Usuario no encontrado', { email });
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!user.active) {
      logger.auth('LOGIN-DIRECT - Usuario inactivo', { email });
      return NextResponse.json(
        { success: false, error: 'Usuario inactivo' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    logger.auth('LOGIN-DIRECT - Verificando contraseña...');
    
    // TEMPORAL: Para pruebas, aceptar contraseña "admin" sin verificar hash
    if (password === 'admin') {
      logger.auth('LOGIN-DIRECT - Contraseña aceptada (modo prueba)', { email });
    } else {
      // Verificación normal con bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        logger.auth('LOGIN-DIRECT - Contraseña incorrecta', { email });
        return NextResponse.json(
          { success: false, error: 'Credenciales inválidas' },
          { status: 401 }
        );
      }
    }

    // Login exitoso - devolver datos del usuario
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name || 'Usuario',
      role: user.role || 'user'
    };
    
    // Generar token JWT - usar el mismo secreto que el middleware
    const JWT_SECRET = 'supersecret-key-for-nextauth-jwt-2024-verificador-app-secure';
    if (!JWT_SECRET) {
      logger.error('LOGIN-DIRECT - JWT_SECRET no configurado');
      return NextResponse.json(
        { success: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    logger.auth('LOGIN-DIRECT - Generando token con secreto', { secretPreview: JWT_SECRET.substring(0, 10) + '...' });
    
    // Generate JWT token using Edge Runtime compatible implementation
    const token = await signJWT({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role
    });
    
    logger.auth('LOGIN-DIRECT - Login exitoso', userData);
    
    // Crear respuesta con el token
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: userData,
      token: token
    });
    
    // Establecer cookie HTTP con el token - debe ser accesible desde JavaScript
    response.cookies.set('auth-token', token, {
      httpOnly: false, // Debe ser accesible desde JavaScript para el frontend
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });
    
    // IMPORTANTE: También enviar el token en el cuerpo de la respuesta
    // para que el frontend pueda guardarlo en localStorage
    // Esto resuelve el problema de que el hook useAuthenticatedFetch busca en localStorage
    
    return response;
    
  } catch (error) {
    logger.error('LOGIN-DIRECT - Error en login', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}