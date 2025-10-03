import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el perfil de facturación del usuario
    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        subscription: true
      }
    });

    if (!billingProfile) {
      // Devolver null en lugar de 404 para compatibilidad con el frontend
      return NextResponse.json(null);
    }

    return NextResponse.json(billingProfile.subscription);
  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
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
      where: { userId: session.user.id },
      include: {
        subscription: true
      }
    });

    if (!billingProfile) {
      return NextResponse.json(
        { error: 'No se encontró perfil de facturación' },
        { status: 404 }
      );
    }

    // Verificar si ya existe una suscripción activa
    if (billingProfile.subscription && billingProfile.subscription.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Ya existe una suscripción activa' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.create({
      data: {
        billingProfileId: billingProfile.id,
        planName: body.planName,
        planDescription: body.planDescription,
        monthlyPrice: body.monthlyPrice,
        currency: body.currency || 'CLP',
        status: body.status || 'ACTIVE',
        startDate: new Date(body.startDate || Date.now()),
        nextBillingDate: new Date(body.nextBillingDate),
        features: body.features || {}
      }
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creando suscripción:', error);
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

    // Obtener el perfil de facturación del usuario
    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        subscription: true
      }
    });

    if (!billingProfile?.subscription) {
      return NextResponse.json(
        { error: 'No se encontró suscripción' },
        { status: 404 }
      );
    }

    const subscription = await prisma.subscription.update({
      where: { id: billingProfile.subscription.id },
      data: {
        planName: body.planName,
        planDescription: body.planDescription,
        monthlyPrice: body.monthlyPrice,
        currency: body.currency,
        status: body.status,
        nextBillingDate: body.nextBillingDate ? new Date(body.nextBillingDate) : undefined,
        features: body.features
      }
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error actualizando suscripción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}