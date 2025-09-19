
import { NextRequest, NextResponse } from 'next/server';

interface BillingInfo {
  businessName: string;
  taxId: string;
  address: string;
  city: string;
  region: string;
  zipCode: string;
  billingEmail: string;
}

// Mock data - en producción vendría de la base de datos
let mockBillingInfo: BillingInfo = {
  businessName: 'Medios Digitales Chile SpA',
  taxId: '76.123.456-7',
  address: 'Av. Providencia 1234, Oficina 567',
  city: 'Santiago',
  region: 'Metropolitana',
  zipCode: '7500000',
  billingEmail: 'facturacion@ondaverificada.cl'
};

export async function GET() {
  try {
    return NextResponse.json(mockBillingInfo);
  } catch (error) {
    console.error('Error obteniendo información de facturación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos requeridos
    const requiredFields = ['businessName', 'taxId', 'address', 'city', 'region', 'billingEmail'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    // Validar formato RUT chileno básico
    if (!body.taxId.match(/^\d{2}\.\d{3}\.\d{3}-[\dkK]$/)) {
      return NextResponse.json(
        { error: 'Formato de RUT inválido' },
        { status: 400 }
      );
    }

    // Validar formato de email
    if (!body.billingEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Actualizar información de facturación
    mockBillingInfo = { ...mockBillingInfo, ...body };
    
    // Aquí iría la lógica para actualizar en la base de datos
    // await updateBillingInfo(userId, body);
    
    return NextResponse.json({ 
      message: 'Información de facturación actualizada exitosamente', 
      billingInfo: mockBillingInfo 
    });
  } catch (error) {
    console.error('Error actualizando información de facturación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
