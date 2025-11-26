import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';

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
    const billingProfiles = await supabaseDirect.request(
      `billing_profiles?select=*&user_id=eq.${session.user.id}`
    );

    if (billingProfiles.length === 0) {
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

    const billingProfile = billingProfiles[0];

    // Construir query para invoices
    let query = `invoices?select=*&billing_profile_id=eq.${billingProfile.id}`;
    if (status) query += `&status=eq.${status}`;
    query += `&order=created_at.desc&limit=${limit}&offset=${(page - 1) * limit}`;

    const invoices = await supabaseDirect.request(query);

    // Obtener total de invoices
    const countQuery = `invoices?select=count&billing_profile_id=eq.${billingProfile.id}`;
    const countResult = await supabaseDirect.request(countQuery);
    const total = countResult[0]?.count || 0;

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

    // Generar número de factura único
    const countResult = await supabaseDirect.request('invoices?select=count');
    const invoiceCount = countResult[0]?.count || 0;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(3, '0')}`;

    // Crear invoice en Supabase
    const invoiceData = {
      billing_profile_id: billingProfile.id,
      invoice_number: invoiceNumber,
      issue_date: new Date(body.issueDate || Date.now()).toISOString(),
      due_date: new Date(body.dueDate).toISOString(),
      status: body.status || 'PENDING',
      subtotal: body.subtotal,
      tax: body.tax,
      total: body.total,
      currency: body.currency || 'CLP',
      notes: body.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newInvoices = await supabaseDirect.request('invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
      headers: { 'Prefer': 'return=representation' }
    });

    const invoice = newInvoices[0];

    // Crear line items si existen
    if (body.lineItems && body.lineItems.length > 0) {
      const lineItemsData = body.lineItems.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
        radio_id: item.radioId,
        session_id: item.sessionId,
        capture_id: item.captureId,
        detection_id: item.detectionId,
        created_at: new Date().toISOString()
      }));

      await supabaseDirect.request('invoice_line_items', {
        method: 'POST',
        body: JSON.stringify(lineItemsData),
        headers: { 'Prefer': 'return=representation' }
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creando factura:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}