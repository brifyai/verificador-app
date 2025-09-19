
import { NextRequest, NextResponse } from 'next/server';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'mercado_pago';
  name: string;
  lastDigits?: string;
  expiryDate?: string;
  isDefault: boolean;
  status: 'active' | 'expired' | 'pending';
}

// Mock data - en producción vendría de la base de datos
let mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'credit_card',
    name: 'Visa ****4532',
    lastDigits: '4532',
    expiryDate: '12/25',
    isDefault: true,
    status: 'active'
  },
  {
    id: '2',
    type: 'mercado_pago',
    name: 'Mercado Pago',
    isDefault: false,
    status: 'active'
  },
  {
    id: '3',
    type: 'bank_transfer',
    name: 'Transferencia Bancaria',
    isDefault: false,
    status: 'active'
  }
];

export async function GET() {
  try {
    return NextResponse.json(mockPaymentMethods);
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
    const body = await request.json();
    
    // Validar campos requeridos
    if (!body.type || !body.name) {
      return NextResponse.json(
        { error: 'Tipo y nombre son requeridos' },
        { status: 400 }
      );
    }

    const newPaymentMethod: PaymentMethod = {
      id: (mockPaymentMethods.length + 1).toString(),
      type: body.type,
      name: body.name,
      lastDigits: body.lastDigits,
      expiryDate: body.expiryDate,
      isDefault: body.isDefault || false,
      status: 'active'
    };

    // Si es el método por defecto, desactivar los otros
    if (newPaymentMethod.isDefault) {
      mockPaymentMethods = mockPaymentMethods.map(method => ({
        ...method,
        isDefault: false
      }));
    }

    mockPaymentMethods.push(newPaymentMethod);
    
    // Aquí iría la lógica para guardar en la base de datos
    // await createPaymentMethod(userId, newPaymentMethod);
    
    return NextResponse.json({ 
      message: 'Método de pago agregado exitosamente', 
      paymentMethod: newPaymentMethod 
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
    const { searchParams } = new URL(request.url);
    const methodId = searchParams.get('id');
    
    if (!methodId) {
      return NextResponse.json(
        { error: 'ID del método de pago es requerido' },
        { status: 400 }
      );
    }

    const methodIndex = mockPaymentMethods.findIndex(method => method.id === methodId);
    
    if (methodIndex === -1) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      );
    }

    // No permitir eliminar el método por defecto si es el único
    const method = mockPaymentMethods[methodIndex];
    if (method.isDefault && mockPaymentMethods.length === 1) {
      return NextResponse.json(
        { error: 'No se puede eliminar el último método de pago' },
        { status: 400 }
      );
    }

    mockPaymentMethods.splice(methodIndex, 1);
    
    // Si era el método por defecto, hacer que otro sea el por defecto
    if (method.isDefault && mockPaymentMethods.length > 0) {
      mockPaymentMethods[0].isDefault = true;
    }
    
    // Aquí iría la lógica para eliminar de la base de datos
    // await deletePaymentMethod(userId, methodId);
    
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
