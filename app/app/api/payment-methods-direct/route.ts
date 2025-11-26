import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
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

    const paymentMethods = await supabaseDirect.request(
      `payment_methods?select=*&user_id=eq.${session.user.id}&order=created_at.desc`
    );

    // Transformar los datos para que coincidan con la interfaz del frontend
    const formattedMethods = paymentMethods.map((method: any) => ({
      id: method.id,
      type: method.type.toLowerCase().replace('_', '_') as 'credit_card' | 'bank_transfer' | 'mercado_pago',
      name: method.name,
      lastDigits: method.last_digits,
      expiryDate: method.expiry_date,
      isDefault: method.is_default,
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
      await supabaseDirect.request(
        `payment_methods?user_id=eq.${session.user.id}&is_default=eq.true`,
        {
          method: 'PATCH',
          body: JSON.stringify({ is_default: false, updated_at: new Date().toISOString() })
        }
      );
    }

    // Convertir el tipo al formato de la base de datos
    const dbType = body.type.toUpperCase().replace('_', '_');

    const newPaymentMethodData = {
      user_id: session.user.id,
      type: dbType,
      name: body.name,
      last_digits: body.lastDigits,
      expiry_date: body.expiryDate,
      is_default: body.isDefault || false,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newPaymentMethod = await supabaseDirect.request('payment_methods', {
      method: 'POST',
      body: JSON.stringify(newPaymentMethodData),
      headers: { 'Prefer': 'return=representation' }
    });

    // Transformar la respuesta
    const formattedMethod = {
      id: newPaymentMethod[0].id,
      type: newPaymentMethod[0].type.toLowerCase().replace('_', '_') as 'credit_card' | 'bank_transfer' | 'mercado_pago',
      name: newPaymentMethod[0].name,
      lastDigits: newPaymentMethod[0].last_digits,
      expiryDate: newPaymentMethod[0].expiry_date,
      isDefault: newPaymentMethod[0].is_default,
      status: newPaymentMethod[0].status.toLowerCase() as 'active' | 'expired' | 'pending'
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
    const methods = await supabaseDirect.request(
      `payment_methods?select=id,is_default&user_id=eq.${session.user.id}&id=eq.${methodId}`
    );
    
    if (methods.length === 0) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      );
    }

    const method = methods[0];

    // Contar métodos de pago del usuario
    const allMethods = await supabaseDirect.request(
      `payment_methods?select=id&user_id=eq.${session.user.id}`
    );
    const methodCount = allMethods.length;

    // No permitir eliminar el método por defecto si es el único
    if (method.is_default && methodCount === 1) {
      return NextResponse.json(
        { error: 'No se puede eliminar el último método de pago' },
        { status: 400 }
      );
    }

    // Eliminar el método
    await supabaseDirect.request(`payment_methods?id=eq.${methodId}`, {
      method: 'DELETE'
    });

    // Si era el método por defecto, hacer que otro sea el por defecto
    if (method.is_default && methodCount > 1) {
      const firstMethod = await supabaseDirect.request(
        `payment_methods?select=id&user_id=eq.${session.user.id}&order=created_at.asc&limit=1`
      );

      if (firstMethod.length > 0) {
        await supabaseDirect.request(
          `payment_methods?id=eq.${firstMethod[0].id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ 
              is_default: true, 
              updated_at: new Date().toISOString() 
            })
          }
        );
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