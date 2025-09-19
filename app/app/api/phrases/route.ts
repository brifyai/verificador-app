
import { NextRequest, NextResponse } from 'next/server';

// Simulamos una base de datos en memoria (en producción sería una DB real)
let phrases: any[] = [
  {
    id: 'phrase_1',
    phrase: 'Descuentos especiales en Falabella hasta 50% de descuento',
    marca: 'Falabella',
    campaña: 'Cyber Monday',
    categoria: 'promocion',
    descripcion: 'Promoción de descuentos en tienda departamental',
    uploaded: '2025-09-06',
    active: true
  },
  {
    id: 'phrase_2', 
    phrase: 'Nuevo iPhone 15 disponible en WOM con planes desde $19.990',
    marca: 'WOM',
    campaña: 'Lanzamiento iPhone 15',
    categoria: 'producto',
    descripcion: 'Lanzamiento de nuevo modelo de iPhone',
    uploaded: '2025-09-05',
    active: true
  },
  {
    id: 'phrase_3',
    phrase: 'Ripley te espera con las mejores ofertas en electrohogar',
    marca: 'Ripley',
    campaña: 'Ofertas Electrohogar',
    categoria: 'promocion',
    descripcion: 'Promoción de productos para el hogar',
    uploaded: '2025-09-04',
    active: false
  }
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      phrases,
      total: phrases.length
    });
  } catch (error) {
    console.error('Error getting phrases:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phrase, marca, campaña, categoria, descripcion } = body;

    // Validación básica
    if (!phrase?.trim() || !marca?.trim()) {
      return NextResponse.json(
        { error: 'Frase y marca son requeridos' },
        { status: 400 }
      );
    }

    // Crear nueva frase
    const newPhrase = {
      id: `phrase_${Date.now()}`,
      phrase: phrase.trim(),
      marca: marca.trim(),
      campaña: campaña?.trim() || 'Sin campaña',
      categoria: categoria || 'producto',
      descripcion: descripcion?.trim() || '',
      uploaded: new Date().toLocaleDateString('es-CL'),
      active: true
    };

    // Agregar a la "base de datos"
    phrases.push(newPhrase);

    console.log(`📝 Nueva frase agregada: "${newPhrase.phrase}" - Marca: ${newPhrase.marca}`);

    return NextResponse.json({
      success: true,
      message: 'Frase agregada exitosamente',
      phrase: newPhrase
    });
  } catch (error) {
    console.error('Error adding phrase:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de frase es requerido' },
        { status: 400 }
      );
    }

    // Buscar y actualizar la frase
    const phraseIndex = phrases.findIndex(p => p.id === id);
    if (phraseIndex === -1) {
      return NextResponse.json(
        { error: 'Frase no encontrada' },
        { status: 404 }
      );
    }

    phrases[phraseIndex].active = active;
    
    console.log(`🔄 Frase ${active ? 'activada' : 'desactivada'}: "${phrases[phraseIndex].phrase}"`);

    return NextResponse.json({
      success: true,
      message: `Frase ${active ? 'activada' : 'desactivada'} exitosamente`,
      phrase: phrases[phraseIndex]
    });
  } catch (error) {
    console.error('Error updating phrase:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
