
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

    // Validación básica
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // En una aplicación real, aquí guardarías en base de datos
    // Por ahora, simulamos una respuesta exitosa
    const user = {
      id: Date.now().toString(),
      email,
      name: fullName,
      role: role || 'user',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Error en signup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
