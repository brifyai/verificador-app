import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener perfil de facturación desde Supabase Direct
    const profiles = await supabaseDirect.request(
      `billing_profiles?user_id=eq.${session.user.id}&select=id`
    );

    if (!profiles || profiles.length === 0) {
      // Devolver null en lugar de 404 para compatibilidad con el frontend
      return NextResponse.json(null);
    }

    const billingProfileId = profiles[0].id;

    // Obtener suscripción
    const subscriptions = await supabaseDirect.request(
      `subscriptions?billing_profile_id=eq.${billingProfileId}&select=*`
    );

    return NextResponse.json(subscriptions[0] || null);
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

    // Obtener perfil de facturación
    const profiles = await supabaseDirect.request(
      `billing_profiles?user_id=eq.${session.user.id}&select=id,subscription:subscriptions(*)`
    );

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró perfil de facturación' },
        { status: 404 }
      );
    }

    const billingProfile = profiles[0];

    // Verificar si ya existe una suscripción activa
    if (billingProfile.subscription && billingProfile.subscription.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Ya existe una suscripción activa' },
        { status: 400 }
      );
    }

    // Crear suscripción usando Supabase Direct
    const subscriptionData = {
      billing_profile_id: billingProfile.id,
      plan_name: body.planName,
      plan_description: body.planDescription,
      monthly_price: body.monthlyPrice,
      currency: body.currency || 'CLP',
      status: body.status || 'ACTIVE',
      start_date: new Date(body.startDate || Date.now()).toISOString(),
      next_billing_date: new Date(body.nextBillingDate).toISOString(),
      features: body.features || {}
    };

    const subscription = await supabaseDirect.request('subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
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

    // Obtener perfil de facturación con suscripción
    const profiles = await supabaseDirect.request(
      `billing_profiles?user_id=eq.${session.user.id}&select=id,subscription:subscriptions(*)`
    );

    if (!profiles || profiles.length === 0 || !profiles[0].subscription) {
      return NextResponse.json(
        { error: 'No se encontró suscripción' },
        { status: 404 }
      );
    }

    const subscriptionId = profiles[0].subscription.id;

    // Actualizar suscripción
    const updateData = {
      plan_name: body.planName,
      plan_description: body.planDescription,
      monthly_price: body.monthlyPrice,
      currency: body.currency,
      status: body.status,
      next_billing_date: body.nextBillingDate ? new Date(body.nextBillingDate).toISOString() : undefined,
      features: body.features
    };

    const subscription = await supabaseDirect.request(
      `subscriptions?id=eq.${subscriptionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      }
    );

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error actualizando suscripción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}