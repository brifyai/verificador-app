import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseDirect } from "@/lib/supabase-direct";

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

    const todayISO = today.toISOString();
    const tomorrowISO = tomorrow.toISOString();

    // Contar verificaciones de hoy usando Supabase Direct
    const verifiedTodayResult = await supabaseDirect.request(
      `detections?verified=eq.true&false_positive=eq.false&timestamp=gte.${todayISO}&timestamp=lt.${tomorrowISO}&select=id`
    );
    const verifiedToday = verifiedTodayResult ? verifiedTodayResult.length : 0;

    // Contar falsos positivos de hoy
    const falsePositivesTodayResult = await supabaseDirect.request(
      `detections?false_positive=eq.true&timestamp=gte.${todayISO}&timestamp=lt.${tomorrowISO}&select=id`
    );
    const falsePositivesToday = falsePositivesTodayResult ? falsePositivesTodayResult.length : 0;

    return NextResponse.json({
      verifiedToday,
      falsePositivesToday,
    });
  } catch (error) {
    console.error("Error fetching verification stats:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}