import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseDirect } from '@/lib/supabase-direct';

/**
 * POST /api/auth/setup-admin
 * Endpoint especial para crear usuario admin (solo ejecutar una vez)
 * Este endpoint usa el flujo normal de autenticación para evitar problemas de RLS
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que no exista el usuario admin
    const existingUsers = await supabaseDirect.getUsers({ email: 'admin@verificador.com' });
    
    if (existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'El usuario admin@verificador.com ya existe',
        message: 'El usuario admin ya está creado. Puedes iniciar sesión con esas credenciales.'
      });
    }

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      id: 'admin-1',
      email: 'admin@verificador.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      active: true
    };

    // Usar request directo para crear el usuario
    const result = await supabaseDirect.request('users', {
      method: 'POST',
      body: JSON.stringify(adminUser),
      headers: { 'Prefer': 'return=representation' }
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      user: {
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role
      },
      credentials: {
        email: 'admin@verificador.com',
        password: 'admin123'
      }
    });

  } catch (error) {
    console.error('Error en setup admin:', error);
    return NextResponse.json({
      success: false,
      error: 'Error creando usuario admin',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/auth/setup-admin
 * Verifica si el usuario admin existe
 */
export async function GET() {
  try {
    const existingUsers = await supabaseDirect.getUsers({ email: 'admin@verificador.com' });
    
    if (existingUsers.length > 0) {
      return NextResponse.json({
        exists: true,
        message: 'Usuario admin ya existe',
        user: existingUsers[0]
      });
    }

    return NextResponse.json({
      exists: false,
      message: 'Usuario admin no existe. Usa POST para crearlo.'
    });

  } catch (error) {
    console.error('Error verificando admin:', error);
    return NextResponse.json({
      error: 'Error verificando usuario admin'
    }, { status: 500 });
  }
}