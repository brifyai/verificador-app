// En /api/verificacion/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseDirect } from "@/lib/supabase-direct";

// La función GET está bien, no necesita cambios.
// En /api/verificacion/route.ts

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Obtener detecciones pendientes de verificación
    const items = await supabaseDirect.request(
      'detections?select=*&verified=eq.false&false_positive=eq.false&order=timestamp.desc&limit=50'
    );

    // Obtener datos relacionados
    const phraseIds = [...new Set(items.map((item: any) => item.phrase_id).filter(Boolean))];
    const radioIds = [...new Set(items.map((item: any) => item.radio_id).filter(Boolean))];
    const captureIds = [...new Set(items.map((item: any) => item.capture_id).filter(Boolean))];

    const [phrases, radios, captures] = await Promise.all([
      phraseIds.length > 0 ? supabaseDirect.request(`phrases?select=*&id=in.(${phraseIds.join(',')})`) : [],
      radioIds.length > 0 ? supabaseDirect.request(`radios?select=*&id=in.(${radioIds.join(',')})`) : [],
      captureIds.length > 0 ? supabaseDirect.request(`captures?select=*&id=in.(${captureIds.join(',')})`) : []
    ]);

    // Enriquecer items con datos relacionados
    const enrichedItems = items.map((item: any) => ({
      ...item,
      phrase: phrases.find((p: any) => p.id === item.phrase_id),
      radio: radios.find((r: any) => r.id === item.radio_id),
      capture: captures.find((c: any) => c.id === item.capture_id)
    }));

    // --- FIX: TRANSFORMACIÓN DE DATOS ---
    // Mapeamos los resultados para convertir BigInt a String y formatear datos.
    const serializableItems = enrichedItems.map((item: any) => ({
      ...item,
      capture: item.capture ? {
        ...item.capture,
        // Si fileSize existe, lo convertimos a string. Si no, lo dejamos como está (null).
        fileSize: item.capture.file_size ? item.capture.file_size.toString() : null,
      } : null,
    }));
    // --- FIN DE LA TRANSFORMACIÓN ---

    // Enviamos los datos ya transformados y seguros para JSON.
    return NextResponse.json(serializableItems);

  } catch (error) {
    console.error("Error fetching verification items:", error);
    // Asegurémonos de que el error devuelto también sea un JSON válido
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// FIX: La función POST ha sido corregida para manejar 'falsePositive'
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) { // Asegurarse de que session.user exista
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // FIX: Leer 'falsePositive' en lugar de 'verified'
    const { id, falsePositive } = await req.json();

    if (!id) {
      return new NextResponse("ID es requerido", { status: 400 });
    }
    
    // FIX: Lógica de actualización simplificada y correcta
    // Si falsePositive es true, marcamos como falso positivo.
    // Si falsePositive es false, marcamos como verificado.
    
    // Primero obtener el metadata actual si existe
    const currentDetection = await supabaseDirect.request(`detections?select=metadata&id=eq.${id}`);
    const currentMetadata = currentDetection[0]?.metadata || {};
    
    // Actualizar detección
    await supabaseDirect.request(`detections?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        verified: !falsePositive, // Si no es un falso positivo, está verificado
        false_positive: falsePositive,
        metadata: {
          ...currentMetadata,
          verifiedBy: session.user.id,
          verifiedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      }),
      headers: { 'Prefer': 'return=representation' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating verification item:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}