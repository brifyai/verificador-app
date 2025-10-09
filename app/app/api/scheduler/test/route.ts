import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Endpoint para probar programaciones localmente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🧪 Probando programación:', JSON.stringify(body, null, 2));

    const { userId, radioIds, phraseId, days, startTime, endTime, aiModel } = body;

    // Validaciones básicas
    if (!userId || !radioIds || !phraseId || !days || !startTime || !endTime) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos',
        required: ['userId', 'radioIds', 'phraseId', 'days', 'startTime', 'endTime']
      }, { status: 400 });
    }

    // Simular procesamiento
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    let durationMinutes = endMinutes - startMinutes;
    
    // Manejar horarios que cruzan medianoche
    if (durationMinutes <= 0) {
      durationMinutes = (24 * 60) + durationMinutes;
    }

    // Calcular próxima ejecución
    const now = new Date();
    const nextExecution = calculateNextExecution(days, startTime);
    
    // Generar cronPattern para cada día
    const cronPatterns = days.map((day: number) => {
      return `${startMin} ${startHour} * * ${day}`;
    });

    // Simular respuesta exitosa
    const testResult = {
      success: true,
      message: 'Programación validada correctamente',
      validation: {
        userId: userId,
        radiosCount: Array.isArray(radioIds) ? radioIds.length : 0,
        phraseId: phraseId,
        daysCount: Array.isArray(days) ? days.length : 0,
        schedule: {
          startTime,
          endTime,
          duration: `${durationMinutes} minutos`,
          durationSeconds: durationMinutes * 60
        },
        aiModel: aiModel || 'estandar',
        nextExecution: nextExecution.toISOString(),
        cronPatterns: cronPatterns
      },
      estimatedCost: calculateEstimatedCost(radioIds.length, durationMinutes, aiModel || 'estandar'),
      recommendations: generateRecommendations(durationMinutes, radioIds.length, days.length),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(testResult);

  } catch (error: any) {
    console.error('❌ Error en prueba de programación:', error);
    return NextResponse.json({
      success: false,
      error: 'Error procesando programación de prueba',
      details: error.message
    }, { status: 500 });
  }
}

function calculateNextExecution(days: number[], startTime: string): Date {
  const [hour, minute] = startTime.split(':').map(Number);
  const now = new Date();
  
  // Buscar el próximo día que coincida con los días programados
  for (let i = 0; i < 7; i++) {
    const testDate = new Date(now);
    testDate.setDate(now.getDate() + i);
    testDate.setHours(hour, minute, 0, 0);
    
    if (days.includes(testDate.getDay()) && testDate > now) {
      return testDate;
    }
  }
  
  // Si no encuentra en esta semana, buscar en la siguiente
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  nextWeek.setHours(hour, minute, 0, 0);
  return nextWeek;
}

function calculateEstimatedCost(radioCount: number, minutes: number, model: string): number {
  const modelPrices = { estandar: 10, premium: 25, empresarial: 50 };
  const basePrice = modelPrices[model as keyof typeof modelPrices] || 10;
  return radioCount * Math.ceil(minutes / 60) * basePrice;
}

function generateRecommendations(duration: number, radioCount: number, daysCount: number): string[] {
  const recommendations = [];
  
  if (duration > 480) { // Más de 8 horas
    recommendations.push('⚠️ Duración muy larga (>8h). Considera dividir en múltiples sesiones.');
  }
  
  if (duration < 5) { // Menos de 5 minutos
    recommendations.push('⚠️ Duración muy corta (<5min). Puede no ser suficiente para detección.');
  }
  
  if (radioCount > 10) {
    recommendations.push('💰 Muchas radios seleccionadas. Verifica el costo estimado.');
  }
  
  if (daysCount === 7) {
    recommendations.push('📅 Programación diaria. Considera si realmente necesitas todos los días.');
  }
  
  if (radioCount === 1 && daysCount === 1) {
    recommendations.push('💡 Programación simple. Considera usar grabación manual para pruebas.');
  }
  
  recommendations.push('✅ Programación válida y lista para enviar a VPS.');
  
  return recommendations;
}
