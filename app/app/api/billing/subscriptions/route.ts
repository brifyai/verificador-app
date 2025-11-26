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

    // Obtener el perfil de facturación del usuario
    const billingProfiles = await supabaseDirect.request(
      `billing_profiles?select=*&user_id=eq.${session.user.id}`
    );

    if (billingProfiles.length === 0) {
      // Devolver null en lugar de 404 para compatibilidad con el frontend
      return NextResponse.json(null);
    }

    const billingProfile = billingProfiles[0];

    // Obtener suscripción
    const subscriptions = await supabaseDirect.request(
      `subscriptions?select=*&billing_profile_id=eq.${billingProfile.id}`
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

    // Obtener el perfil de facturación del usuario
    const billingProfiles = await supabaseDirect.request(
      `billing_profiles?select=*&user_id=eq.${session.user.id}`
    );

    if (billingProfiles.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró perfil de facturación' },
        { status: 404 }
      );
    }

    const billingProfile = billingProfiles[0];

    // Verificar si ya existe una suscripción activa
    const existingSubscriptions = await supabaseDirect.request(
      `subscriptions?select=*&billing_profile_id=eq.${billingProfile.id}&status=eq.ACTIVE`
    );

    if (existingSubscriptions.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una suscripción activa' },
        { status: 400 }
      );
    }

    // Crear suscripción en Supabase
    const subscriptionData = {
      billing_profile_id: billingProfile.id,
      plan_name: body.planName,
      plan_description: body.planDescription,
      monthly_price: body.monthlyPrice,
      currency: body.currency || 'CLP',
      status: body.status || 'ACTIVE',
      start_date: new Date(body.startDate || Date.now()).toISOString(),
      next_billing_date: new Date(body.nextBillingDate).toISOString(),
      features: body.features || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newSubscriptions = await supabaseDirect.request('subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
      headers: { 'Prefer': 'return=representation' }
    });

    const subscription = newSubscriptions[0];

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
    const billingProfiles = await supabaseDirect.request(
      `billing_profiles?select=*&user_id=eq.${session.user.id}`
    );

    if (billingProfiles.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró perfil de facturación' },
        { status: 404 }
      );
    }

    const billingProfile = billingProfiles[0];

    // Obtener suscripción existente
    const subscriptions = await supabaseDirect.request(
      `subscriptions?select=*&billing_profile_id=eq.${billingProfile.id}`
    );

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró suscripción' },
        { status: 404 }
      );
    }

    const subscriptionId = subscriptions[0].id;

    // Actualizar suscripción en Supabase
    const updateData = {
      plan_name: body.planName,
      plan_description: body.planDescription,
      monthly_price: body.monthlyPrice,
      currency: body.currency,
      status: body.status,
      next_billing_date: body.nextBillingDate ? new Date(body.nextBillingDate).toISOString() : undefined,
      features: body.features,
      updated_at: new Date().toISOString()
    };

    const updatedSubscriptions = await supabaseDirect.request(
      `subscriptions?id=eq.${subscriptionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'Prefer': 'return=representation' }
      }
    );

    const subscription = updatedSubscriptions[0];

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error actualizando suscripción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}