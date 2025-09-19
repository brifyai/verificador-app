
import { NextRequest, NextResponse } from 'next/server';

interface PriceUpdateRequest {
  radioId: string;
  newPrice: number;
  effectiveDate: string;
  reason: string;
  applyRetroactively?: boolean;
  retroactiveFromDate?: string;
  pricingRuleId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PriceUpdateRequest = await request.json();
    
    const { 
      radioId, 
      newPrice, 
      effectiveDate, 
      reason, 
      applyRetroactively, 
      retroactiveFromDate,
      pricingRuleId 
    } = body;

    // Validación
    if (!radioId || !newPrice || newPrice <= 0 || !effectiveDate || !reason) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: radioId, newPrice, effectiveDate, reason' },
        { status: 400 }
      );
    }

    if (applyRetroactively && !retroactiveFromDate) {
      return NextResponse.json(
        { error: 'Se requiere retroactiveFromDate cuando applyRetroactively es true' },
        { status: 400 }
      );
    }

    // Simular actualización de precio - En producción sería base de datos
    const priceUpdate = {
      id: `ph_${crypto.randomUUID().slice(0, 8)}`,
      radioId,
      pricePerDetection: newPrice,
      effectiveDate,
      pricingRuleId,
      appliedRetroactively: applyRetroactively || false,
      retroactiveFromDate,
      createdAt: new Date().toISOString(),
      createdBy: 'admin', // En producción vendría del token de auth
      reason
    };

    // Log para desarrollo
    console.log('💰 Precio actualizado:', {
      radioId,
      oldPrice: 'N/A', // En producción obtendríamos el precio anterior
      newPrice,
      effectiveDate,
      retroactive: applyRetroactively
    });

    // Si es retroactivo, simular recalculo de valoraciones existentes
    if (applyRetroactively && retroactiveFromDate) {
      console.log(`🔄 Recalculando valoraciones desde ${retroactiveFromDate} para radio ${radioId}`);
      
      // En producción aquí:
      // 1. Obtener todas las detecciones desde retroactiveFromDate
      // 2. Recalcular valores con el nuevo precio
      // 3. Actualizar registros en la base de datos
      // 4. Generar reporte de cambios
    }

    return NextResponse.json({
      success: true,
      message: `Precio actualizado correctamente${applyRetroactively ? ' (aplicado retroactivamente)' : ''}`,
      priceUpdate,
      affectedDetections: applyRetroactively ? Math.floor(Math.random() * 50) + 10 : 0 // Mock data
    });

  } catch (error) {
    console.error('Error actualizando precio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
