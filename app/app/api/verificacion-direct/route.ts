import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseDirect } from "@/lib/supabase-direct";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Obtener detecciones pendientes de verificación desde Supabase Direct
    const detections = await supabaseDirect.request(
      'detections?verified=eq.false&false_positive=eq.false&select=*&order=timestamp.desc&limit=50'
    );

    // Obtener datos relacionados (phrase, radio, capture)
    const phraseIds = [...new Set(detections.map((d: any) => d.phrase_id).filter(Boolean))];
    const radioIds = [...new Set(detections.map((d: any) => d.radio_id).filter(Boolean))];
    const captureIds = [...new Set(detections.map((d: any) => d.capture_id).filter(Boolean))];

    const [phrases, radios, captures] = await Promise.all([
      phraseIds.length > 0 ? supabaseDirect.request(`phrases?id=in.(${phraseIds.join(',')})&select=*`) : [],
      radioIds.length > 0 ? supabaseDirect.request(`radios?id=in.(${radioIds.join(',')})&select=*`) : [],
      captureIds.length > 0 ? supabaseDirect.request(`captures?id=in.(${captureIds.join(',')})&select=*`) : []
    ]);

    // Combinar datos
    const items = detections.map((detection: any) => ({
      ...detection,
      phrase: phrases.find((p: any) => p.id === detection.phrase_id),
      radio: radios.find((r: any) => r.id === detection.radio_id),
      capture: captures.find((c: any) => c.id === detection.capture_id)
    }));

    // Mapear y convertir BigInt a String para serialización JSON
    const serializableItems = items.map((item: any) => ({
      ...item,
      capture: item.capture ? {
        ...item.capture,
        fileSize: item.capture.file_size ? item.capture.file_size.toString() : null,
      } : null,
    }));

    return NextResponse.json(serializableItems);

  } catch (error) {
    console.error("Error fetching verification items:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, falsePositive } = await req.json();

    if (!id) {
      return new NextResponse("ID es requerido", { status: 400 });
    }
    
    // Actualizar detección usando Supabase Direct
    const updateData = {
      verified: !falsePositive,
      false_positive: falsePositive,
      metadata: {
        verifiedBy: session.user.id,
        verifiedAt: new Date().toISOString()
      }
    };

    await supabaseDirect.request(
      `detections?id=eq.${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating verification item:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}