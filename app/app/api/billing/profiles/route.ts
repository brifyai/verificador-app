import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        subscription: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    // Si no existe perfil, devolver estructura vacía compatible con el frontend
    if (!billingProfile) {
      return NextResponse.json([]);
    }

    // Mapear campos de la base de datos a los esperados por el frontend
    const mappedProfile = {
      id: billingProfile.id,
      companyName: billingProfile.companyName,
      legalName: billingProfile.legalName || billingProfile.companyName,
      taxId: billingProfile.taxId,
      address: billingProfile.address,
      city: billingProfile.city,
      region: billingProfile.region,
      postalCode: billingProfile.postalCode || '',
      billingEmail: billingProfile.billingEmail,
      subscription: billingProfile.subscription,
      invoices: billingProfile.invoices
    };

    return NextResponse.json([mappedProfile]);
  } catch (error) {
    console.error('Error obteniendo perfil de facturación:', error);
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
    
    // Validar campos requeridos con los nombres correctos del frontend
    const requiredFields = ['companyName', 'taxId', 'address', 'city', 'billingEmail'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    // Verificar si ya existe un perfil de facturación
    const existingProfile = await prisma.billingProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Ya existe un perfil de facturación para este usuario' },
        { status: 400 }
      );
    }

    const billingProfile = await prisma.billingProfile.create({
      data: {
        userId: session.user.id,
        companyName: body.companyName,
        legalName: body.legalName || body.companyName,
        taxId: body.taxId,
        billingEmail: body.billingEmail,
        address: body.address,
        city: body.city,
        region: body.region,
        postalCode: body.postalCode || ''
      }
    });

    // Devolver el perfil mapeado para el frontend
    const mappedProfile = {
      id: billingProfile.id,
      companyName: billingProfile.companyName,
      legalName: billingProfile.legalName,
      taxId: billingProfile.taxId,
      address: billingProfile.address,
      city: billingProfile.city,
      region: billingProfile.region,
      postalCode: billingProfile.postalCode,
      billingEmail: billingProfile.billingEmail
    };

    return NextResponse.json(mappedProfile, { status: 201 });
  } catch (error) {
    console.error('Error creando perfil de facturación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Verificar si el perfil de facturación existe
    const existingProfile = await prisma.billingProfile.findUnique({
      where: { userId: session.user.id }
    });

    let billingProfile;

    if (existingProfile) {
      // Actualizar perfil existente usando solo campos que existen en el esquema
      billingProfile = await prisma.billingProfile.update({
        where: { userId: session.user.id },
        data: {
          companyName: body.companyName,
          legalName: body.legalName || body.companyName,
          taxId: body.taxId,
          billingEmail: body.billingEmail,
          address: body.address,
          city: body.city,
          region: body.region,
          postalCode: body.postalCode || ''
        }
      });
    } else {
      // Crear nuevo perfil si no existe
      billingProfile = await prisma.billingProfile.create({
        data: {
          userId: session.user.id,
          companyName: body.companyName,
          legalName: body.legalName || body.companyName,
          taxId: body.taxId,
          billingEmail: body.billingEmail,
          address: body.address,
          city: body.city,
          region: body.region,
          postalCode: body.postalCode || ''
        }
      });
    }

    // Devolver el perfil mapeado para el frontend
    const mappedProfile = {
      id: billingProfile.id,
      companyName: billingProfile.companyName,
      legalName: billingProfile.legalName,
      taxId: billingProfile.taxId,
      address: billingProfile.address,
      city: billingProfile.city,
      region: billingProfile.region,
      postalCode: billingProfile.postalCode,
      billingEmail: billingProfile.billingEmail
    };

    return NextResponse.json(mappedProfile);
  } catch (error) {
    console.error('Error actualizando perfil de facturación:', error);
    
    // Manejar específicamente el error P2025 (registro no encontrado)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Perfil de facturación no encontrado. Se creará uno nuevo.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}