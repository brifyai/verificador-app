import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';
import { verifyStreamStatus } from '@/lib/stream-verifier-enhanced';
import jwt from 'jsonwebtoken';

// Secreto JWT - usar el mismo que el middleware
const JWT_SECRET = 'supersecret-key-for-nextauth-jwt-2024-verificador-app-secure';

// Función para verificar autenticación JWT
async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tokenCookie = request.cookies.get('auth-token');
    
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenCookie) {
      token = tokenCookie.value;
    }
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verificar que el usuario exista y esté activo
    const users = await supabaseDirect.getUsers();
    const user = users.find((u: any) => u.id === decoded.id && u.email === decoded.email);
    
    if (!user || !user.active) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name || 'Usuario',
      role: user.role || 'user'
    };
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return null;
  }
}

/**
 * POST /api/radios-direct/verify-bulk
 * Verifica el estado de todas las radios activas
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación con nuestro sistema JWT
    const user = await verifyAuth(request);
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Obtener todas las radios activas
    const radios = await supabaseDirect.request(
      'radios?select=id_radio,name,stream_url,region&status=eq.ACTIVE&order=name.asc'
    );

    if (radios.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay radios activas para verificar',
        data: {
          total: 0,
          online: 0,
          offline: 0,
          results: [],
        },
      });
    }

    logger.info(`Iniciando verificación masiva de ${radios.length} radios`);

    // Verificar todas las radios en paralelo con límite de concurrencia
    const BATCH_SIZE = 10; // Procesar de a 10 para no sobrecargar
    const results = [];
    let onlineCount = 0;
    let offlineCount = 0;

    for (let i = 0; i < radios.length; i += BATCH_SIZE) {
      const batch = radios.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (radio: any) => {
          try {
            const verification = await verifyStreamStatus(radio.stream_url);
            
            // Actualizar en la base de datos
            await supabaseDirect.request(
              `radios?id_radio=eq.${radio.id_radio}`,
              {
                method: 'PATCH',
                body: JSON.stringify({
                  last_verification_status: verification.status,
                  last_verified_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
              }
            );

            // Contar resultados
            if (verification.status === 'ONLINE') {
              onlineCount++;
            } else {
              offlineCount++;
            }

            return {
              radioId: radio.id_radio,
              radioName: radio.name,
              region: radio.region,
              status: verification.status,
              details: verification.details,
            };
          } catch (error: any) {
            logger.error(`Error verificando radio ${radio.name}:`, error);
            offlineCount++;
            return {
              radioId: radio.id_radio,
              radioName: radio.name,
              region: radio.region,
              status: 'OFFLINE' as const,
              details: `Error: ${error.message}`,
            };
          }
        })
      );

      results.push(...batchResults);

      // Pequeña pausa entre batches para no sobrecargar
      if (i + BATCH_SIZE < radios.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    logger.info(
      `Verificación masiva completada: ${onlineCount} online, ${offlineCount} offline`
    );

    return NextResponse.json({
      success: true,
      message: `Verificación completada: ${onlineCount} online, ${offlineCount} offline`,
      data: {
        total: radios.length,
        online: onlineCount,
        offline: offlineCount,
        results,
      },
    });
  } catch (error: any) {
    logger.error('Error en verificación masiva:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}