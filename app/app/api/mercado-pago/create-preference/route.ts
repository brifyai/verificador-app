
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Configuración de Mercado Pago
    const preference = {
      items: [
        {
          title: body.title || 'Suscripción OndaVerificada',
          quantity: 1,
          unit_price: body.amount || 850000,
          currency_id: 'CLP'
        }
      ],
      payer: {
        email: body.email
      },
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/perfil?payment=success`,
        failure: `${process.env.NEXTAUTH_URL}/perfil?payment=failure`,
        pending: `${process.env.NEXTAUTH_URL}/perfil?payment=pending`
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12
      },
      notification_url: `${process.env.NEXTAUTH_URL}/api/mercado-pago/webhook`
    };

    // En producción, aquí usarías el SDK de Mercado Pago
    // const mercadopago = require('mercadopago');
    // mercadopago.configure({
    //   access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
    // });
    // const response = await mercadopago.preferences.create(preference);
    
    // Mock response para desarrollo
    const mockResponse = {
      id: 'mock-preference-id-' + Date.now(),
      init_point: 'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=mock-preference-id',
      sandbox_init_point: 'https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=mock-preference-id'
    };
    
    return NextResponse.json({
      preferenceId: mockResponse.id,
      initPoint: process.env.NODE_ENV === 'production' 
        ? mockResponse.init_point 
        : mockResponse.sandbox_init_point
    });
  } catch (error) {
    console.error('Error creando preferencia de Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Error procesando el pago' },
      { status: 500 }
    );
  }
}
