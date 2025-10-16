import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('👤 Creando usuario de prueba...');

    // Verificar si ya existe un usuario
    const existingUser = await prisma.user.findFirst();
    
    if (existingUser) {
      console.log(`✅ Usuario ya existe: ${existingUser.id}`);
      return NextResponse.json({
        success: true,
        message: 'Usuario ya existe',
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email
        }
      });
    }

    // Crear usuario de prueba
    const testUser = await prisma.user.create({
      data: {
        id: 'user123', // ID fijo para facilitar las pruebas
        name: 'Usuario de Prueba',
        email: 'test@ondaverificada.com',
        password: 'test123', // Password de prueba
        // Agregar otros campos requeridos según tu esquema
      }
    });

    console.log(`✅ Usuario creado: ${testUser.id}`);

    return NextResponse.json({
      success: true,
      message: 'Usuario de prueba creado exitosamente',
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email
      }
    });

  } catch (error: any) {
    console.error('❌ Error creando usuario:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo usuarios:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
