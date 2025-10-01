import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // CORRECTO: Usar la instancia centralizada
import { authOptions } from '@/lib/auth'; // CORRECTO: Importar para la autenticación
import { getServerSession } from 'next-auth';
import { Platform, RadioStatus } from '@prisma/client';

// Función auxiliar (sin cambios, solo la movemos arriba por convención)
const mapPlatformToEnum = (platform: string): Platform => {
  if (!platform) return Platform.OTHER;
  const platformMap: Record<string, Platform> = {
    youtube: Platform.YOUTUBE,
    twitch: Platform.TWITCH,
    facebook: Platform.FACEBOOK,
    icecast: Platform.ICECAST,
    shoutcast: Platform.ICECAST,
    direct: Platform.HTTP_STREAM,
    http: Platform.HTTP_STREAM,
    rtmp: Platform.RTMP,
    centova: Platform.ICECAST,
    sonicpanel: Platform.ICECAST,
    azuracast: Platform.ICECAST,
  };
  return platformMap[platform.toLowerCase()] || Platform.OTHER;
};


// --- PUT: Actualizar una radio por ID (Versión Segura y Robusta) ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. AÑADIMOS LA VERIFICACIÓN DE SESIÓN (¡MUY IMPORTANTE!)
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // La validación de existencia es buena, la mantenemos.
    const existingRadio = await prisma.radio.findUnique({ where: { id } });
    if (!existingRadio) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }

    // 2. FORMA MÁS SEGURA Y LIMPIA DE MANEJAR LA ACTUALIZACIÓN DE DATOS
    const updatedRadio = await prisma.radio.update({
      where: { id },
      data: {
        // Actualizamos solo los campos que vienen en el body
        name: body.name,
        streamUrl: body.streamUrl,
        platform: body.streamPlatform ? mapPlatformToEnum(body.streamPlatform) : undefined,
        region: body.region,
        status: body.isActive !== undefined ? (body.isActive ? RadioStatus.ACTIVE : RadioStatus.INACTIVE) : undefined,
        description: body.genre,
        // Usamos 'update' para fusionar el JSON de forma segura
        metadata: {
          update: {
            city: body.city,
            frequency: body.frequency,
            programadora: body.programadora,
            streamPlatform: body.streamPlatform,
            website: body.website,
            lastMonitored: body.lastMonitored,
          }
        }
      },
    });

    // 3. DEVOLVEMOS EL OBJETO REAL DE LA BASE DE DATOS
    // Es más consistente y predecible. El frontend puede adaptarlo si es necesario.
    return NextResponse.json({ 
      success: true, 
      data: updatedRadio,
      message: 'Radio actualizada exitosamente' 
    });
  } catch (error) {
    console.error('Error actualizando radio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


// --- DELETE: Eliminar una radio por ID (Versión Segura) ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. AÑADIMOS LA VERIFICACIÓN DE SESIÓN
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Tu lógica de validación de existencia ya es correcta.
    const existingRadio = await prisma.radio.findUnique({ where: { id } });
    if (!existingRadio) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }

    // 2. ELIMINAMOS LA RADIO
    await prisma.radio.delete({ where: { id } });

    return NextResponse.json({ 
      success: true, 
      message: 'Radio eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando radio:', error);
    // Manejo de error por si la radio tiene relaciones que impiden borrarla
    if (error.code === 'P2003') {
        return NextResponse.json({ success: false, error: 'No se puede eliminar la radio porque tiene sesiones de monitoreo asociadas.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}