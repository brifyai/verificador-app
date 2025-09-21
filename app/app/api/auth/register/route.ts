import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validaciones básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el correo ya está registrado
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'El correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER', // Rol por defecto
        active: true, // Activo por defecto
      },
    });

    // Eliminar la contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'Usuario registrado correctamente',
        user: userWithoutPassword
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return NextResponse.json(
      { message: 'Error al registrar usuario' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}