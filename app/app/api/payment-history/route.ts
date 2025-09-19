
import { NextRequest, NextResponse } from 'next/server';

interface PaymentHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  invoiceUrl?: string;
}

// Mock data - en producción vendría de la base de datos
const mockPaymentHistory: PaymentHistory[] = [
  {
    id: '1',
    date: '2025-09-01',
    description: 'Suscripción Mensual OndaVerificada Pro',
    amount: 850000,
    status: 'paid',
    paymentMethod: 'Visa ****4532',
    invoiceUrl: '#'
  },
  {
    id: '2',
    date: '2025-08-01',
    description: 'Suscripción Mensual OndaVerificada Pro',
    amount: 850000,
    status: 'paid',
    paymentMethod: 'Mercado Pago',
    invoiceUrl: '#'
  },
  {
    id: '3',
    date: '2025-07-01',
    description: 'Suscripción Mensual OndaVerificada Pro',
    amount: 850000,
    status: 'paid',
    paymentMethod: 'Transferencia Bancaria',
    invoiceUrl: '#'
  },
  {
    id: '4',
    date: '2025-06-01',
    description: 'Suscripción Mensual OndaVerificada Pro',
    amount: 850000,
    status: 'failed',
    paymentMethod: 'Visa ****4532'
  },
  {
    id: '5',
    date: '2025-05-01',
    description: 'Suscripción Mensual OndaVerificada Pro',
    amount: 850000,
    status: 'paid',
    paymentMethod: 'Mercado Pago',
    invoiceUrl: '#'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    let filteredHistory = mockPaymentHistory;
    
    // Filtrar por estado si se especifica
    if (status) {
      filteredHistory = mockPaymentHistory.filter(payment => payment.status === status);
    }
    
    // Ordenar por fecha más reciente
    filteredHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex);
    
    return NextResponse.json({
      payments: paginatedHistory,
      pagination: {
        page,
        limit,
        total: filteredHistory.length,
        totalPages: Math.ceil(filteredHistory.length / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
