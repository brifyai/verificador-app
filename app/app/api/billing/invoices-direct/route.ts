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

    // Obtener perfil de facturación
    const profiles = await supabaseDirect.request(
      `billing_profiles?user_id=eq.${session.user.id}&select=id`
    );

    if (!profiles || profiles.length === 0) {
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

    const billingProfileId = profiles[0].id;

    // Construir filtros
    let query = `invoices?billing_profile_id=eq.${billingProfileId}&select=*&order=created_at.desc`;
    
    if (status) {
      query += `&status=eq.${status}`;
    }

    // Aplicar paginación
    const skip = (page - 1) * limit;
    query += `&limit=${limit}&offset=${skip}`;

    // Obtener invoices
    const invoices = await supabaseDirect.request(query);

    // Obtener total para paginación
    const countResult = await supabaseDirect.request(
      `invoices?billing_profile_id=eq.${billingProfileId}${status ? `&status=eq.${status}` : ''}&select=id`
    );
    const total = countResult ? countResult.length : 0;

    // Obtener lineItems para cada invoice
    const invoiceIds = invoices.map((inv: any) => inv.id);
    let lineItems = [];
    
    if (invoiceIds.length > 0) {
      lineItems = await supabaseDirect.request(
        `invoice_line_items?invoice_id=in.(${invoiceIds.join(',')})&select=*`
      );
    }

    // Combinar datos
    const invoicesWithLineItems = invoices.map((invoice: any) => ({
      ...invoice,
      lineItems: lineItems.filter((item: any) => item.invoice_id === invoice.id)
    }));

    return NextResponse.json({
      invoices: invoicesWithLineItems,
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

    // Obtener perfil de facturación
    const profiles = await supabaseDirect.request(
      `billing_profiles?user_id=eq.${session.user.id}&select=id`
    );

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró perfil de facturación' },
        { status: 404 }
      );
    }

    const billingProfileId = profiles[0].id;

    // Generar número de factura único
    const countResult = await supabaseDirect.request('invoices?select=id');
    const invoiceCount = countResult ? countResult.length : 0;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(3, '0')}`;

    // Crear invoice
    const invoiceData = {
      billing_profile_id: billingProfileId,
      invoice_number: invoiceNumber,
      issue_date: new Date(body.issueDate || Date.now()).toISOString(),
      due_date: new Date(body.dueDate).toISOString(),
      status: body.status || 'PENDING',
      subtotal: body.subtotal,
      tax: body.tax,
      total: body.total,
      currency: body.currency || 'CLP',
      notes: body.notes
    };

    const invoice = await supabaseDirect.request('invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });

    // Crear lineItems si existen
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
        detection_id: item.detectionId
      }));

      await supabaseDirect.request('invoice_line_items', {
        method: 'POST',
        body: JSON.stringify(lineItemsData)
      });
    }

    // Obtener invoice completo con lineItems
    const invoiceWithLineItems = await supabaseDirect.request(
      `invoices?id=eq.${invoice.id}&select=*`
    );

    const lineItems = await supabaseDirect.request(
      `invoice_line_items?invoice_id=eq.${invoice.id}&select=*`
    );

    const fullInvoice = {
      ...invoiceWithLineItems[0],
      lineItems: lineItems || []
    };

    return NextResponse.json(fullInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creando factura:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}