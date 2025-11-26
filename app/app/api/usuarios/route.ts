import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';
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

    // Construir query para Supabase
    let query = 'users?select=*';
    if (search) {
      query += `&or=(name.ilike.*${search}*,email.ilike.*${search}*)`;
    }
    if (role) query += `&role=eq.${role}`;
    if (active !== null && active !== undefined) {
      query += `&active=eq.${active === 'true'}`;
    }
    query += `&order=created_at.desc&limit=${limit}&offset=${skip}`;

    // Obtener usuarios de Supabase
    const users = await supabaseDirect.request(query);

    // Obtener total de usuarios (query separada para count)
    let countQuery = 'users?select=count';
    if (search) {
      countQuery += `&or=(name.ilike.*${search}*,email.ilike.*${search}*)`;
    }
    if (role) countQuery += `&role=eq.${role}`;
    if (active !== null && active !== undefined) {
      countQuery += `&active=eq.${active === 'true'}`;
    }
    
    const countResult = await supabaseDirect.request(countQuery);
    const totalUsers = countResult[0]?.count || 0;

    // Transformar los datos (mapear created_at → createdAt)
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      totalSessions: 0 // TODO: Implementar conteo de sesiones si es necesario
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
    const existingUsers = await supabaseDirect.request(`users?select=*&email=eq.${body.email}`);
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Crear el usuario en Supabase
    const userData = {
      email: body.email,
      name: body.name,
      password: hashedPassword,
      role: body.role || 'USER',
      active: body.active !== undefined ? body.active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newUsers = await supabaseDirect.request('users', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Prefer': 'return=representation' }
    });

    const newUser = newUsers[0];
    
    // Transformar respuesta
    const transformedUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      active: newUser.active,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at
    };

    return NextResponse.json({
      success: true,
      data: transformedUser
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
    const existingUsers = await supabaseDirect.request(`users?select=*&id=eq.${body.id}`);
    
    if (existingUsers.length === 0) {
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
      const emailExists = await supabaseDirect.request(
        `users?select=*&email=eq.${body.email}&id=neq.${body.id}`
      );

      if (emailExists.length > 0) {
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

    updateData.updated_at = new Date().toISOString();

    // Actualizar usuario en Supabase
    const updatedUsers = await supabaseDirect.request(`users?id=eq.${body.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedUser = updatedUsers[0];
    
    // Transformar respuesta
    const transformedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      active: updatedUser.active,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };

    return NextResponse.json({
      success: true,
      data: transformedUser
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
    const existingUsers = await supabaseDirect.request(`users?select=*&id=eq.${id}`);
    
    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // En lugar de eliminar, desactivar el usuario para mantener integridad referencial
    await supabaseDirect.request(`users?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        active: false,
        updated_at: new Date().toISOString()
      }),
      headers: { 'Prefer': 'return=representation' }
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