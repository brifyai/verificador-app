import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Obtener elementos de verificación pendientes
    const items = await prisma.detection.findMany({
      where: {
        verified: false,
        falsePositive: false,
      },
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

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching verification items:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, verified } = await req.json();

    if (!id) {
      return new NextResponse("ID es requerido", { status: 400 });
    }

    // Actualizar el estado en la base de datos
    // Si verified es true, marcamos como verificado
    // Si verified es false, marcamos como falso positivo
    await prisma.detection.update({
      where: { id },
      data: { 
        verified: verified === true ? true : false,
        falsePositive: verified === false ? true : false,
        // No usamos updatedAt porque no existe en el modelo
        // Podemos usar metadata para guardar información adicional
        metadata: {
          verifiedBy: session.user.id,
          verifiedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating verification item:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}