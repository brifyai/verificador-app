import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Platform, RadioStatus, Prisma } from '@prisma/client';
import { RadioImportSchema } from '@/lib/schemas/radio.schema';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// --- Tipo de dato para una radio que viene del archivo de importación ---
type RadioImportData = {
  name: string;
  region: string;
  city?: string;
  streamUrl?: string;
  URL?: string; // Campo alternativo para la URL
  frequency?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
};

// --- GET: Obtener estadísticas (Corregido y Tipado) ---
// Esta función ya estaba bien, pero la mejoramos un poco.
export async function GET() {
  try {
    const totalRadios = await prisma.radio.count();
    const activeRadios = await prisma.radio.count({ where: { status: 'ACTIVE' } });
    
    const regionsResult = await prisma.radio.findMany({
      select: { region: true },
      distinct: ['region'],
    });

    const stats = {
      total: totalRadios,
      active: activeRadios,
      inactive: totalRadios - activeRadios,
      regions: regionsResult.map(r => r.region).filter(Boolean) as string[],
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


// --- POST: Importación Masiva (con límite de 500) ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar con Zod
    const validationResult = RadioImportSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false,
        error: 'Datos de importación inválidos', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }
    
    const radios = validationResult.data.radios;
    logger.log(`📥 Importando ${radios.length} radios...`);

    const mapPlatform = (url: string | null): Platform => {
      if (!url) return Platform.OTHER;
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('youtube')) return Platform.YOUTUBE;
      if (lowerUrl.includes('facebook')) return Platform.FACEBOOK;
      if (lowerUrl.includes('twitch')) return Platform.TWITCH;
      if (lowerUrl.includes('icecast') || lowerUrl.includes('shoutcast')) return Platform.ICECAST;
      if (lowerUrl.includes('rtmp')) return Platform.RTMP;
      return Platform.HTTP_STREAM;
    };

    const operations = radios.map(radio => {
      const streamUrl = radio.streamUrl?.trim() || radio.URL?.trim() || '';
      const name = radio.name?.trim() || 'Nombre Desconocido';
      const region = radio.region?.trim() || 'Región Desconocida';

      const dataForDb = {
        name,
        region,
        streamUrl,
        platform: mapPlatform(streamUrl),
        status: streamUrl ? RadioStatus.ACTIVE : RadioStatus.INACTIVE,
        metadata: {
          set: {
            city: radio.city?.trim() || '',
            frequency: radio.frequency || '',
            website: radio.website || '',
            logo: radio.logo || '',
            description: radio.description || `Radio ${name} de ${region}`,
          }
        }
      };

      return prisma.radio.upsert({
        where: {
          name_region: {
            name: name,
            region: region,
          }
        },
        update: dataForDb,
        create: dataForDb,
      });
    });

    const results = await prisma.$transaction(operations);

    logger.log(`Importación exitosa: ${results.length} radios procesadas.`);
    return NextResponse.json({
      success: true,
      message: `Se procesaron ${results.length} radios.`,
      count: results.length
    });

  } catch (error) {
    logger.error('Error en importación masiva:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Error de datos duplicados durante la transacción.', details: error.meta }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error de base de datos', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}