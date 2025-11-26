import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener usuario de Supabase
    const users = await supabaseDirect.request(`users?select=id,name,email&id=eq.${session.user.id}`);
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Preparar perfil con datos reales de la base de datos
    const profile: UserProfile = {
      id: user.id,
      fullName: user.name || '',
      email: user.email
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar campos requeridos
    const requiredFields = ['fullName', 'email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe antes de intentar actualizarlo
    const existingUsers = await supabaseDirect.request(`users?select=id,email&id=eq.${session.user.id}`);
    
    if (existingUsers.length === 0) {
      console.error(`Usuario no encontrado con ID: ${session.user.id}`);
      return NextResponse.json(
        { error: 'Usuario no encontrado. Por favor, inicia sesión nuevamente.' },
        { status: 404 }
      );
    }

    const existingUser = existingUsers[0];

    // Verificar si el email ya está en uso por otro usuario
    if (body.email !== existingUser.email) {
      const emailUsers = await supabaseDirect.request(`users?select=id&email=eq.${body.email}`);
      
      if (emailUsers.length > 0 && emailUsers[0].id !== session.user.id) {
        return NextResponse.json(
          { error: 'El email ya está en uso por otro usuario' },
          { status: 400 }
        );
      }
    }

    // Actualizar información básica del usuario
    const updateData = {
      name: body.fullName,
      email: body.email,
      updated_at: new Date().toISOString()
    };

    const updatedUsers = await supabaseDirect.request(`users?id=eq.${session.user.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedUser = updatedUsers[0];

    // Preparar respuesta con el perfil actualizado
    const updatedProfile: UserProfile = {
      id: updatedUser.id,
      fullName: updatedUser.name || body.fullName,
      email: updatedUser.email
    };
    
    return NextResponse.json({ 
      message: 'Perfil actualizado exitosamente', 
      profile: updatedProfile 
    });
  } catch (error: any) {
    console.error('Error actualizando perfil:', error);
    
    // Manejar específicamente el error de registro no encontrado
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Usuario no encontrado. Por favor, inicia sesión nuevamente.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}