import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Obtener la fecha de hoy (inicio y fin)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Contar verificaciones de hoy
    const verifiedToday = await prisma.detection.count({
      where: {
        verified: true,
        falsePositive: false,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Contar falsos positivos de hoy
    const falsePositivesToday = await prisma.detection.count({
      where: {
        falsePositive: true,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return NextResponse.json({
      verifiedToday,
      falsePositivesToday,
    });
  } catch (error) {
    console.error("Error fetching verification stats:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}