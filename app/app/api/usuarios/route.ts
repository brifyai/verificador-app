import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Solo administradores pueden ver todos los usuarios
    if (session.user.role !== 'ADMIN') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const active = searchParams.get('active');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) where.role = role;
    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    // Obtener el total de usuarios
    const totalUsers = await prisma.user.count({ where });

    // Obtener los usuarios (sin incluir passwords)
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Transformar los datos
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      totalSessions: user._count.sessions
    }));

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Solo administradores pueden crear usuarios
    if (session.user.role !== 'ADMIN') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();

    // Validar campos requeridos
    if (!body.email || !body.name || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: email, name, password' },
        { status: 400 }
      );
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
        role: body.role || 'USER',
        active: body.active !== undefined ? body.active : true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: newUser 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Falta el campo obligatorio: id' },
        { status: 400 }
      );
    }

    // Los usuarios solo pueden actualizar su propio perfil, los admins pueden actualizar cualquiera
    if (session.user.role !== 'ADMIN' && session.user.id !== body.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: body.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (body.name) updateData.name = body.name;
    if (body.email) {
      // Verificar que el nuevo email no esté en uso
      const emailExists = await prisma.user.findFirst({
        where: { 
          email: body.email,
          id: { not: body.id }
        }
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'El email ya está en uso' },
          { status: 400 }
        );
      }

      updateData.email = body.email;
    }

    // Solo admins pueden cambiar rol y estado activo
    if (session.user.role === 'ADMIN') {
      if (body.role) updateData.role = body.role;
      if (body.active !== undefined) updateData.active = body.active;
    }

    // Si se proporciona nueva contraseña
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 12);
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: body.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedUser 
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Solo administradores pueden eliminar usuarios
    if (session.user.role !== 'ADMIN') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Falta el parámetro: id' },
        { status: 400 }
      );
    }

    // No permitir que el admin se elimine a sí mismo
    if (session.user.id === id) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // En lugar de eliminar, desactivar el usuario para mantener integridad referencial
    await prisma.user.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario desactivado correctamente' 
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}