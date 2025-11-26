import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la sesión existe y pertenece al usuario
    const sessions = await supabaseDirect.request(
      `monitoring_sessions?id=eq.${sessionId}&user_id=eq.${session.user.id}&select=*`
    );

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: 'Sesión no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    const monitoringSession = sessions[0];

    // Actualizar estado de la sesión a STOPPED
    await supabaseDirect.request(
      `monitoring_sessions?id=eq.${sessionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'STOPPED',
          end_time: new Date().toISOString()
        })
      }
    );

    // Cancelar jobs pendientes de esta sesión
    await supabaseDirect.request(
      `jobs?session_id=eq.${sessionId}&status=eq.PENDING`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' })
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        status: 'STOPPED',
        message: 'Monitoreo detenido correctamente'
      }
    });

  } catch (error) {
    console.error('Error deteniendo monitoreo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}