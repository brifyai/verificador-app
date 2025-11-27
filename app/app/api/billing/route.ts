
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';

interface BillingInfo {
  businessName: string;
  taxId: string;
  address: string;
  city: string;
  region: string;
  zipCode: string;
  billingEmail: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener información de facturación de Supabase
    const billingProfiles = await supabaseDirect.request(
      `billing_profiles?select=*&user_id=eq.${session.user.id}`
    );

    if (billingProfiles.length === 0) {
      // Si no hay perfil, devolver valores vacíos
      return NextResponse.json({
        businessName: '',
        taxId: '',
        address: '',
        city: '',
        region: '',
        zipCode: '',
        billingEmail: session.user.email || ''
      });
    }

    const profile = billingProfiles[0];
    
    return NextResponse.json({
      businessName: profile.business_name || '',
      taxId: profile.tax_id || '',
      address: profile.address || '',
      city: profile.city || '',
      region: profile.region || '',
      zipCode: profile.zip_code || '',
      billingEmail: profile.billing_email || session.user.email || ''
    });
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

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

    // Verificar si ya existe un perfil de facturación
    const existingProfiles = await supabaseDirect.request(
      `billing_profiles?select=*&user_id=eq.${session.user.id}`
    );

    let updatedProfile;
    
    if (existingProfiles.length > 0) {
      // Actualizar perfil existente
      const billingData = {
        user_id: session.user.id,
        business_name: body.businessName,
        tax_id: body.taxId,
        address: body.address,
        city: body.city,
        region: body.region,
        zip_code: body.zipCode,
        billing_email: body.billingEmail,
        updated_at: new Date().toISOString()
      };

      const updatedProfiles = await supabaseDirect.request(
        `billing_profiles?id=eq.${existingProfiles[0].id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(billingData),
          headers: { 'Prefer': 'return=representation' }
        }
      );
      updatedProfile = updatedProfiles[0];
    } else {
      // Crear nuevo perfil
      const billingData = {
        user_id: session.user.id,
        business_name: body.businessName,
        tax_id: body.taxId,
        address: body.address,
        city: body.city,
        region: body.region,
        zip_code: body.zipCode,
        billing_email: body.billingEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const newProfiles = await supabaseDirect.request('billing_profiles', {
        method: 'POST',
        body: JSON.stringify(billingData),
        headers: { 'Prefer': 'return=representation' }
      });
      updatedProfile = newProfiles[0];
    }
    
    return NextResponse.json({
      message: 'Información de facturación actualizada exitosamente',
      billingInfo: {
        businessName: updatedProfile.business_name,
        taxId: updatedProfile.tax_id,
        address: updatedProfile.address,
        city: updatedProfile.city,
        region: updatedProfile.region,
        zipCode: updatedProfile.zip_code,
        billingEmail: updatedProfile.billing_email
      }
    });
  } catch (error) {
    console.error('Error actualizando información de facturación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
