
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    // Obtener usuario de la base de datos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

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
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true }
    });

    if (!existingUser) {
      console.error(`Usuario no encontrado con ID: ${session.user.id}`);
      return NextResponse.json(
        { error: 'Usuario no encontrado. Por favor, inicia sesión nuevamente.' },
        { status: 404 }
      );
    }

    // Verificar si el email ya está en uso por otro usuario
    if (body.email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: body.email },
        select: { id: true }
      });

      if (emailInUse && emailInUse.id !== session.user.id) {
        return NextResponse.json(
          { error: 'El email ya está en uso por otro usuario' },
          { status: 400 }
        );
      }
    }

    // Actualizar información básica del usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: body.fullName,
        email: body.email
      }
    });

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
    
    // Manejar específicamente el error P2025 de Prisma
    if (error.code === 'P2025') {
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
