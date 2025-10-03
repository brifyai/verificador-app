
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformar los datos para que coincidan con la interfaz del frontend
    const formattedMethods = paymentMethods.map(method => ({
      id: method.id,
      type: method.type.toLowerCase().replace('_', '_') as 'credit_card' | 'bank_transfer' | 'mercado_pago',
      name: method.name,
      lastDigits: method.lastDigits,
      expiryDate: method.expiryDate,
      isDefault: method.isDefault,
      status: method.status.toLowerCase() as 'active' | 'expired' | 'pending'
    }));

    return NextResponse.json(formattedMethods);
  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    if (!body.type || !body.name) {
      return NextResponse.json(
        { error: 'Tipo y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Si es el método por defecto, desactivar los otros
    if (body.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Convertir el tipo al formato de la base de datos
    const dbType = body.type.toUpperCase().replace('_', '_');

    const newPaymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: session.user.id,
        type: dbType,
        name: body.name,
        lastDigits: body.lastDigits,
        expiryDate: body.expiryDate,
        isDefault: body.isDefault || false,
        status: 'ACTIVE'
      }
    });

    // Transformar la respuesta
    const formattedMethod = {
      id: newPaymentMethod.id,
      type: newPaymentMethod.type.toLowerCase().replace('_', '_') as 'credit_card' | 'bank_transfer' | 'mercado_pago',
      name: newPaymentMethod.name,
      lastDigits: newPaymentMethod.lastDigits,
      expiryDate: newPaymentMethod.expiryDate,
      isDefault: newPaymentMethod.isDefault,
      status: newPaymentMethod.status.toLowerCase() as 'active' | 'expired' | 'pending'
    };
    
    return NextResponse.json({ 
      message: 'Método de pago agregado exitosamente', 
      paymentMethod: formattedMethod 
    });
  } catch (error) {
    console.error('Error creando método de pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const methodId = searchParams.get('id');
    
    if (!methodId) {
      return NextResponse.json(
        { error: 'ID del método de pago es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el método pertenece al usuario
    const method = await prisma.paymentMethod.findFirst({
      where: {
        id: methodId,
        userId: session.user.id
      }
    });
    
    if (!method) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      );
    }

    // Contar métodos de pago del usuario
    const methodCount = await prisma.paymentMethod.count({
      where: {
        userId: session.user.id
      }
    });

    // No permitir eliminar el método por defecto si es el único
    if (method.isDefault && methodCount === 1) {
      return NextResponse.json(
        { error: 'No se puede eliminar el último método de pago' },
        { status: 400 }
      );
    }

    // Eliminar el método
    await prisma.paymentMethod.delete({
      where: {
        id: methodId
      }
    });

    // Si era el método por defecto, hacer que otro sea el por defecto
    if (method.isDefault && methodCount > 1) {
      const firstMethod = await prisma.paymentMethod.findFirst({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (firstMethod) {
        await prisma.paymentMethod.update({
          where: {
            id: firstMethod.id
          },
          data: {
            isDefault: true
          }
        });
      }
    }
    
    return NextResponse.json({ 
      message: 'Método de pago eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando método de pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
