
import { NextRequest, NextResponse } from 'next/server';

interface PricingRule {
  id: string;
  name: string;
  pricePerDetection: number;
  effectiveDate: string;
  endDate?: string;
  description: string;
  radioIds: string[];
  createdAt: string;
  createdBy: string;
}

// Mock data - en producción vendría de la base de datos
let mockPricingRules: PricingRule[] = [
  {
    id: '1',
    name: 'Radios Premium Santiago',
    pricePerDetection: 1500,
    effectiveDate: '2025-09-01',
    description: 'Radios principales de Santiago con mayor audiencia',
    radioIds: ['1', '2', '3'],
    createdAt: '2025-09-01T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: '2', 
    name: 'Radios Regionales',
    pricePerDetection: 800,
    effectiveDate: '2025-09-01',
    description: 'Radios de regiones con audiencia menor',
    radioIds: ['4', '5', '6', '7', '8'],
    createdAt: '2025-09-01T10:00:00Z',
    createdBy: 'admin'
  }
];

// GET - Obtener reglas de precios
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      rules: mockPricingRules,
      total: mockPricingRules.length
    });
  } catch (error) {
    console.error('Error obteniendo reglas de precios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva regla de precios
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, pricePerDetection, effectiveDate, endDate, description, radioIds } = body;

    // Validación
    if (!name || !pricePerDetection || pricePerDetection <= 0 || !effectiveDate) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, pricePerDetection, effectiveDate' },
        { status: 400 }
      );
    }

    // Crear nueva regla
    const newRule: PricingRule = {
      id: Date.now().toString(),
      name,
      pricePerDetection,
      effectiveDate,
      endDate,
      description: description || '',
      radioIds: radioIds || [],
      createdAt: new Date().toISOString(),
      createdBy: 'admin' // En producción vendría del token de auth
    };

    mockPricingRules.push(newRule);

    console.log('📋 Nueva regla de precios creada:', newRule);

    return NextResponse.json({
      success: true,
      message: 'Regla de precios creada correctamente',
      rule: newRule
    });

  } catch (error) {
    console.error('Error creando regla de precios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar regla de precios
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('id');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la regla' },
        { status: 400 }
      );
    }

    const ruleIndex = mockPricingRules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex === -1) {
      return NextResponse.json(
        { error: 'Regla no encontrada' },
        { status: 404 }
      );
    }

    const deletedRule = mockPricingRules.splice(ruleIndex, 1)[0];

    console.log('🗑️ Regla de precios eliminada:', deletedRule);

    return NextResponse.json({
      success: true,
      message: 'Regla de precios eliminada correctamente',
      deletedRule
    });

  } catch (error) {
    console.error('Error eliminando regla de precios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
