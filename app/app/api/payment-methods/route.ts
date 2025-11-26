
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

    // Obtener métodos de pago de Supabase
    const paymentMethods = await supabaseDirect.request(
      `payment_methods?select=*&user_id=eq.${session.user.id}&order=created_at.desc`
    );

    // Transformar los datos para que coincidan con la interfaz del frontend
    const formattedMethods = paymentMethods.map(method => ({
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
      await supabaseDirect.request(`payment_methods?user_id=eq.${session.user.id}&is_default=eq.true`, {
        method: 'PATCH',
        body: JSON.stringify({ is_default: false }),
        headers: { 'Prefer': 'return=representation' }
      });
    }

    // Convertir el tipo al formato de la base de datos
    const dbType = body.type.toUpperCase().replace('_', '_');

    // Crear método de pago en Supabase
    const paymentMethodData = {
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

    const newPaymentMethods = await supabaseDirect.request('payment_methods', {
      method: 'POST',
      body: JSON.stringify(paymentMethodData),
      headers: { 'Prefer': 'return=representation' }
    });

    const newPaymentMethod = newPaymentMethods[0];

    // Transformar la respuesta
    const formattedMethod = {
      id: newPaymentMethod.id,
      type: newPaymentMethod.type.toLowerCase().replace('_', '_') as 'credit_card' | 'bank_transfer' | 'mercado_pago',
      name: newPaymentMethod.name,
      lastDigits: newPaymentMethod.last_digits,
      expiryDate: newPaymentMethod.expiry_date,
      isDefault: newPaymentMethod.is_default,
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
    const methods = await supabaseDirect.request(
      `payment_methods?select=*&id=eq.${methodId}&user_id=eq.${session.user.id}`
    );
    
    if (methods.length === 0) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      );
    }

    const method = methods[0];

    // Contar métodos de pago del usuario
    const countResult = await supabaseDirect.request(
      `payment_methods?select=count&user_id=eq.${session.user.id}`
    );
    const methodCount = countResult[0]?.count || 0;

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
      const firstMethods = await supabaseDirect.request(
        `payment_methods?select=*&user_id=eq.${session.user.id}&order=created_at.asc&limit=1`
      );

      if (firstMethods.length > 0) {
        const firstMethod = firstMethods[0];
        await supabaseDirect.request(`payment_methods?id=eq.${firstMethod.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_default: true }),
          headers: { 'Prefer': 'return=representation' }
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
