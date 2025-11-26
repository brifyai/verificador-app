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

    // Obtener todos los usuarios de Supabase
    let query = 'users?select=id,email,name,role,active,created_at,updated_at';
    
    // Aplicar filtros
    const filters: string[] = [];
    if (search) {
      // Para búsqueda de texto, necesitamos obtener todos y filtrar en memoria
      // ya que Supabase no soporta OR con ilike directamente en la query
    }
    if (role) filters.push(`role=eq.${role}`);
    if (active !== null && active !== undefined) {
      filters.push(`active=eq.${active === 'true'}`);
    }

    if (filters.length > 0) {
      query += '&' + filters.join('&');
    }

    query += `&order=created_at.desc&limit=${limit}&offset=${skip}`;

    const users = await supabaseDirect.request(query);
    
    // Si hay búsqueda de texto, filtrar en memoria
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter((user: any) => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Obtener el total de usuarios (sin paginación para el count)
    const countQuery = 'users?select=id' + (filters.length > 0 ? '&' + filters.join('&') : '');
    const allMatchingUsers = await supabaseDirect.request(countQuery);
    const totalUsers = allMatchingUsers.length;

    // Transformar los datos y obtener conteos de sesiones
    const transformedUsers = await Promise.all(
      filteredUsers.map(async (user: any) => {
        // Obtener conteo de sesiones para cada usuario
        const sessions = await supabaseDirect.request(`sessions?select=id&user_id=eq.${user.id}`);
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          active: user.active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          totalSessions: sessions.length
        };
      })
    );

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
    const existingUsers = await supabaseDirect.request(`users?select=id&email=eq.${body.email}`);
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Crear el usuario
    const newUserData = {
      email: body.email,
      name: body.name,
      password: hashedPassword,
      role: body.role || 'USER',
      active: body.active !== undefined ? body.active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newUser = await supabaseDirect.request('users', {
      method: 'POST',
      body: JSON.stringify(newUserData),
      headers: { 'Prefer': 'return=representation' }
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
        role: newUser[0].role,
        active: newUser[0].active,
        createdAt: newUser[0].created_at,
        updatedAt: newUser[0].updated_at
      }
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
    const existingUsers = await supabaseDirect.request(`users?select=id&id=eq.${body.id}`);
    
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
      const emailUsers = await supabaseDirect.request(`users?select=id&email=eq.${body.email}`);
      const emailInUse = emailUsers.find((user: any) => user.id !== body.id);
      
      if (emailInUse) {
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

    // Actualizar usuario
    const updatedUser = await supabaseDirect.request(`users?id=eq.${body.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        role: updatedUser[0].role,
        active: updatedUser[0].active,
        createdAt: updatedUser[0].created_at,
        updatedAt: updatedUser[0].updated_at
      }
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
    const existingUsers = await supabaseDirect.request(`users?select=id&id=eq.${id}`);
    
    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // En lugar de eliminar, desactivar el usuario para mantener integridad referencial
    await supabaseDirect.request(`users?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: false, updated_at: new Date().toISOString() })
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