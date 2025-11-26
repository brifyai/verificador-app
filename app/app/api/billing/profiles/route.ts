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

    // Obtener perfil de facturación de Supabase
    const billingProfiles = await supabaseDirect.request(
      `billing_profiles?select=*&user_id=eq.${session.user.id}`
    );

    // Si no existe perfil, devolver estructura vacía compatible con el frontend
    if (billingProfiles.length === 0) {
      return NextResponse.json([]);
    }

    const billingProfile = billingProfiles[0];

    // Obtener suscripción e invoices relacionadas
    const [subscriptions, invoices] = await Promise.all([
      supabaseDirect.request(`subscriptions?select=*&billing_profile_id=eq.${billingProfile.id}`),
      supabaseDirect.request(`invoices?select=*&billing_profile_id=eq.${billingProfile.id}&order=created_at.desc&limit=5`)
    ]);

    // Mapear campos de la base de datos a los esperados por el frontend
    const mappedProfile = {
      id: billingProfile.id,
      companyName: billingProfile.company_name,
      legalName: billingProfile.legal_name || billingProfile.company_name,
      taxId: billingProfile.tax_id,
      address: billingProfile.address,
      city: billingProfile.city,
      region: billingProfile.region,
      postalCode: billingProfile.postal_code || '',
      billingEmail: billingProfile.billing_email,
      subscription: subscriptions[0] || null,
      invoices: invoices
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
    const existingProfiles = await supabaseDirect.request(
      `billing_profiles?select=*&user_id=eq.${session.user.id}`
    );

    if (existingProfiles.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe un perfil de facturación para este usuario' },
        { status: 400 }
      );
    }

    // Crear perfil en Supabase
    const profileData = {
      user_id: session.user.id,
      company_name: body.companyName,
      legal_name: body.legalName || body.companyName,
      tax_id: body.taxId,
      billing_email: body.billingEmail,
      address: body.address,
      city: body.city,
      region: body.region,
      postal_code: body.postalCode || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newProfiles = await supabaseDirect.request('billing_profiles', {
      method: 'POST',
      body: JSON.stringify(profileData),
      headers: { 'Prefer': 'return=representation' }
    });

    const billingProfile = newProfiles[0];

    // Devolver el perfil mapeado para el frontend
    const mappedProfile = {
      id: billingProfile.id,
      companyName: billingProfile.company_name,
      legalName: billingProfile.legal_name,
      taxId: billingProfile.tax_id,
      address: billingProfile.address,
      city: billingProfile.city,
      region: billingProfile.region,
      postalCode: billingProfile.postal_code,
      billingEmail: billingProfile.billing_email
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
    const existingProfiles = await supabaseDirect.request(
      `billing_profiles?select=*&user_id=eq.${session.user.id}`
    );

    let billingProfile;

    const profileData = {
      company_name: body.companyName,
      legal_name: body.legalName || body.companyName,
      tax_id: body.taxId,
      billing_email: body.billingEmail,
      address: body.address,
      city: body.city,
      region: body.region,
      postal_code: body.postalCode || '',
      updated_at: new Date().toISOString()
    };

    if (existingProfiles.length > 0) {
      // Actualizar perfil existente
      const updatedProfiles = await supabaseDirect.request(
        `billing_profiles?user_id=eq.${session.user.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(profileData),
          headers: { 'Prefer': 'return=representation' }
        }
      );
      billingProfile = updatedProfiles[0];
    } else {
      // Crear nuevo perfil si no existe
      const newProfiles = await supabaseDirect.request('billing_profiles', {
        method: 'POST',
        body: JSON.stringify({
          ...profileData,
          user_id: session.user.id,
          created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
      });
      billingProfile = newProfiles[0];
    }

    // Devolver el perfil mapeado para el frontend
    const mappedProfile = {
      id: billingProfile.id,
      companyName: billingProfile.company_name,
      legalName: billingProfile.legal_name,
      taxId: billingProfile.tax_id,
      address: billingProfile.address,
      city: billingProfile.city,
      region: billingProfile.region,
      postalCode: billingProfile.postal_code,
      billingEmail: billingProfile.billing_email
    };

    return NextResponse.json(mappedProfile);
  } catch (error) {
    console.error('Error actualizando perfil de facturación:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}