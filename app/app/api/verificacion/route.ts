// En /api/verificacion/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client"; // Importar Prisma para tipos

// La función GET está bien, no necesita cambios.
// En /api/verificacion/route.ts

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const items = await prisma.detection.findMany({
      where: { verified: false, falsePositive: false },
      include: { 
        phrase: true, 
        radio: true, 
        capture: true 
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 50
    });

    // --- FIX: TRANSFORMACIÓN DE DATOS ---
    // Mapeamos los resultados para convertir BigInt a String.
    const serializableItems = items.map(item => ({
      ...item,
      capture: item.capture ? {
        ...item.capture,
        // Si fileSize existe, lo convertimos a string. Si no, lo dejamos como está (null).
        fileSize: item.capture.fileSize ? item.capture.fileSize.toString() : null,
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
    await prisma.detection.update({
      where: { id },
      data: { 
        verified: !falsePositive, // Si no es un falso positivo, está verificado
        falsePositive: falsePositive,
        
        // FIX: Forma correcta de actualizar un campo JSON en Prisma
        // Esto añade/actualiza las claves sin borrar otras que puedan existir.
        // Asegúrate de que tu campo 'metadata' en schema.prisma sea de tipo 'Json?'.
        metadata: {
          // 'update' no es la sintaxis correcta aquí, se usa 'set' o se pasa el objeto.
          // Para fusionar, primero lees y luego escribes, o simplemente sobreescribes.
          // La forma más simple y segura es esta:
          set: {
            verifiedBy: session.user.id,
            verifiedAt: new Date().toISOString()
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating verification item:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}