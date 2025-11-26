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
      `billing_profiles?user_id=eq.${session.user.id}&select=*`
    );

    // Si no existe perfil, devolver array vacío
    if (!profiles || profiles.length === 0) {
      return NextResponse.json([]);
    }

    const profile = profiles[0];

    // Obtener suscripción e invoices relacionadas
    const [subscriptions, invoices] = await Promise.all([
      supabaseDirect.request(`subscriptions?billing_profile_id=eq.${profile.id}&select=*`),
      supabaseDirect.request(
        `invoices?billing_profile_id=eq.${profile.id}&select=*&order=created_at.desc&limit=5`
      )
    ]);

    // Mapear campos para el frontend
    const mappedProfile = {
      id: profile.id,
      companyName: profile.company_name,
      legalName: profile.legal_name || profile.company_name,
      taxId: profile.tax_id,
      address: profile.address,
      city: profile.city,
      region: profile.region,
      postalCode: profile.postal_code || '',
      billingEmail: profile.billing_email,
      subscription: subscriptions[0] || null,
      invoices: invoices || []
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
    
    // Validar campos requeridos
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
      `billing_profiles?user_id=eq.${session.user.id}&select=id`
    );

    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe un perfil de facturación para este usuario' },
        { status: 400 }
      );
    }

    // Crear perfil usando Supabase Direct
    const profileData = {
      user_id: session.user.id,
      company_name: body.companyName,
      legal_name: body.legalName || body.companyName,
      tax_id: body.taxId,
      billing_email: body.billingEmail,
      address: body.address,
      city: body.city,
      region: body.region,
      postal_code: body.postalCode || ''
    };

    const profile = await supabaseDirect.request('billing_profiles', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });

    // Devolver el perfil mapeado para el frontend
    const mappedProfile = {
      id: profile.id,
      companyName: profile.company_name,
      legalName: profile.legal_name,
      taxId: profile.tax_id,
      address: profile.address,
      city: profile.city,
      region: profile.region,
      postalCode: profile.postal_code,
      billingEmail: profile.billing_email
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
      `billing_profiles?user_id=eq.${session.user.id}&select=id`
    );

    let profile;

    if (existingProfiles && existingProfiles.length > 0) {
      const profileId = existingProfiles[0].id;
      
      // Actualizar perfil existente
      const updateData = {
        company_name: body.companyName,
        legal_name: body.legalName || body.companyName,
        tax_id: body.taxId,
        billing_email: body.billingEmail,
        address: body.address,
        city: body.city,
        region: body.region,
        postal_code: body.postalCode || ''
      };

      profile = await supabaseDirect.request(
        `billing_profiles?id=eq.${profileId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData)
        }
      );
    } else {
      // Crear nuevo perfil si no existe
      const profileData = {
        user_id: session.user.id,
        company_name: body.companyName,
        legal_name: body.legalName || body.companyName,
        tax_id: body.taxId,
        billing_email: body.billingEmail,
        address: body.address,
        city: body.city,
        region: body.region,
        postal_code: body.postalCode || ''
      };

      profile = await supabaseDirect.request('billing_profiles', {
        method: 'POST',
        body: JSON.stringify(profileData)
      });
    }

    // Devolver el perfil mapeado para el frontend
    const mappedProfile = {
      id: profile.id,
      companyName: profile.company_name,
      legalName: profile.legal_name,
      taxId: profile.tax_id,
      address: profile.address,
      city: profile.city,
      region: profile.region,
      postalCode: profile.postal_code,
      billingEmail: profile.billing_email
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