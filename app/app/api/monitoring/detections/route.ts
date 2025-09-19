
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Datos mock para las detecciones
    const mockDetections = [
      {
        id: 'det_001',
        radioId: 'radio_001',
        radioName: 'Radio Cooperativa',
        timestamp: new Date().toISOString(),
        transcription: 'Promoción especial en Falabella...',
        confidence: 0.95,
        advertisementType: 'product',
        detectedPhrases: ['Falabella', 'descuento', 'promoción'],
        brandMentions: ['Falabella'],
        summary: 'Anuncio publicitario de tienda departamental'
      }
    ];

    return NextResponse.json({
      detections: mockDetections,
      total: mockDetections.length,
      page: 1,
      limit: 50
    });
  } catch (error) {
    console.error('Error getting detections:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
