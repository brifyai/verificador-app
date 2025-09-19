
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const providers = [
      {
        name: 'Abacus AI',
        id: 'abacusai',
        enabled: true,
        status: 'available'
      },
      {
        name: 'Groq',
        id: 'groq',
        enabled: false,
        status: 'not_configured'
      },
      {
        name: 'Deepgram',
        id: 'deepgram',
        enabled: false,
        status: 'not_configured'
      }
    ];

    return NextResponse.json({
      providers,
      total: providers.length
    });
  } catch (error) {
    console.error('Error getting providers:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
