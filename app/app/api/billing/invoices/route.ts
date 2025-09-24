import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Obtener el perfil de facturación del usuario
    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!billingProfile) {
      // Devolver array vacío en lugar de 404 para compatibilidad con el frontend
      return NextResponse.json({
        invoices: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    const where = {
      billingProfileId: billingProfile.id,
      ...(status && { status: status as any })
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          lineItems: {
            include: {
              radio: true,
              session: true,
              capture: true,
              detection: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.invoice.count({ where })
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo facturas:', error);
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

    // Obtener el perfil de facturación del usuario
    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!billingProfile) {
      return NextResponse.json(
        { error: 'No se encontró perfil de facturación' },
        { status: 404 }
      );
    }

    // Generar número de factura único
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(3, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        billingProfileId: billingProfile.id,
        invoiceNumber,
        issueDate: new Date(body.issueDate || Date.now()),
        dueDate: new Date(body.dueDate),
        status: body.status || 'PENDING',
        subtotal: body.subtotal,
        tax: body.tax,
        total: body.total,
        currency: body.currency || 'CLP',
        notes: body.notes,
        lineItems: {
          create: body.lineItems?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            radioId: item.radioId,
            sessionId: item.sessionId,
            captureId: item.captureId,
            detectionId: item.detectionId
          })) || []
        }
      },
      include: {
        lineItems: {
          include: {
            radio: true,
            session: true,
            capture: true,
            detection: true
          }
        }
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creando factura:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}