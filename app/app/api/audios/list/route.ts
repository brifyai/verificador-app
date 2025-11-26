import { NextRequest, NextResponse } from 'next/server';

// Esta ruta ya no se usa directamente, ya que estamos accediendo a la VPS
// Pero la mantenemos por compatibilidad
export async function GET(request: NextRequest) {
  // Redirigir a la VPS
  return NextResponse.json({
    success: true,
    message: "Esta API ya no se usa directamente. La aplicación ahora se conecta directamente a la VPS."
  });
}
