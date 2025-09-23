
import { NextRequest, NextResponse } from 'next/server';
import { Platform, RadioStatus } from '@prisma/client';

interface RadioData {
  id: number;
  name: string;
  region: string;
  city: string;
  streamUrl: string;
  status: 'active' | 'inactive';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { radios, replaceAll = false } = body;

    // Validar que radios sea un array
    if (!Array.isArray(radios)) {
      return NextResponse.json(
        { error: 'Se requiere un array de radios' },
        { status: 400 }
      );
    }

    // Validar estructura de cada radio
    const requiredFields = ['name', 'region', 'city'];
    const invalidRadios = radios.filter((radio, index) => {
      return !requiredFields.every(field => radio[field]);
    });

    if (invalidRadios.length > 0) {
      return NextResponse.json(
        { 
          error: `Radios con campos faltantes: ${invalidRadios.length}`,
          details: 'Cada radio debe tener name, region y city'
        },
        { status: 400 }
      );
    }

    // Procesar las radios
    const processedRadios = radios.map((radio: any, index: number) => ({
      id: index + 1,
      name: radio.name?.trim() || `Radio ${index + 1}`,
      region: radio.region?.trim() || 'Sin Región',
      city: radio.city?.trim() || 'Sin Ciudad', 
      streamUrl: radio.streamUrl?.trim() || radio.URL?.trim() || '',
      status: (radio.streamUrl || radio.URL) ? 'active' : 'inactive',
      frequency: radio.frequency || '',
      description: radio.description || '',
      website: radio.website || '',
      phone: radio.phone || '',
      email: radio.email || '',
      address: radio.address || '',
      logo: radio.logo || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Estadísticas
    const stats = {
      total: processedRadios.length,
      active: processedRadios.filter(r => r.status === 'active').length,
      inactive: processedRadios.filter(r => r.status === 'inactive').length,
      withUrl: processedRadios.filter(r => r.streamUrl).length,
      withoutUrl: processedRadios.filter(r => !r.streamUrl).length,
      regions: [...new Set(processedRadios.map(r => r.region))].length
    };

    // Eliminar duplicados por nombre y región
    const uniqueRadios = processedRadios.reduce((acc: any[], current: any) => {
      const existing = acc.find(radio => 
        radio.name.toLowerCase() === current.name.toLowerCase() && 
        radio.region.toLowerCase() === current.region.toLowerCase()
      );
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Importar a la base de datos usando Prisma
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Función para mapear plataforma
      const mapPlatform = (url: string): Platform => {
        if (!url) return Platform.OTHER;
        url = url.toLowerCase();
        if (url.includes('youtube')) return Platform.YOUTUBE;
        if (url.includes('facebook')) return Platform.FACEBOOK;
        if (url.includes('twitch')) return Platform.TWITCH;
        if (url.includes('icecast') || url.includes('shoutcast')) return Platform.ICECAST;
        if (url.includes('rtmp')) return Platform.RTMP;
        return Platform.HTTP_STREAM;
      };
      
      // Crear las radios en la base de datos
      const createdRadios = await Promise.all(
        uniqueRadios.map(async (radio: any) => {
          // Verificar si la radio ya existe
          const existingRadio = await prisma.radio.findFirst({
            where: {
              name: { equals: radio.name, mode: 'insensitive' },
              region: { equals: radio.region, mode: 'insensitive' }
            }
          });
          
          if (existingRadio) {
            // Actualizar radio existente
            return prisma.radio.update({
              where: { id: existingRadio.id },
              data: {
                streamUrl: radio.streamUrl || existingRadio.streamUrl,
                platform: mapPlatform(radio.streamUrl),
                status: radio.status === 'active' ? RadioStatus.ACTIVE : RadioStatus.INACTIVE,
                metadata: {
                  ...(existingRadio.metadata as Record<string, any> || {}),
                  frequency: radio.frequency || (existingRadio.metadata as Record<string, any>)?.frequency,
                  city: radio.city || (existingRadio.metadata as Record<string, any>)?.city,
                  website: radio.website || (existingRadio.metadata as Record<string, any>)?.website,
                  phone: radio.phone || (existingRadio.metadata as Record<string, any>)?.phone,
                  email: radio.email || (existingRadio.metadata as Record<string, any>)?.email,
                  address: radio.address || (existingRadio.metadata as Record<string, any>)?.address,
                  logo: radio.logo || (existingRadio.metadata as Record<string, any>)?.logo,
                  description: radio.description || (existingRadio.metadata as Record<string, any>)?.description
                }
              }
            });
          } else {
            // Crear nueva radio
            return prisma.radio.create({
              data: {
                name: radio.name,
                region: radio.region,
                streamUrl: radio.streamUrl || '',
                platform: mapPlatform(radio.streamUrl),
                status: radio.status === 'active' ? RadioStatus.ACTIVE : RadioStatus.INACTIVE,
                metadata: {
                  city: radio.city || '',
                  frequency: radio.frequency || '',
                  website: radio.website || '',
                  phone: radio.phone || '',
                  email: radio.email || '',
                  address: radio.address || '',
                  logo: radio.logo || '',
                  description: radio.description || `Radio ${radio.name} de ${radio.city || radio.region}`
                }
              }
            });
          }
        })
      );

      console.log(`✅ Importación exitosa: ${stats.total} radios procesadas`);
      console.log(`📊 Estadísticas: ${stats.active} activas, ${stats.inactive} inactivas, ${stats.regions} regiones`);

      // Devolver respuesta
      return NextResponse.json({
        success: true,
        message: `Importación exitosa: ${stats.total} radios`,
        stats,
        preview: processedRadios.slice(0, 5), // Mostrar primeras 5 como vista previa
        savedTo: 'Base de datos'
      });
    } catch (dbError) {
      console.error('Error al guardar en la base de datos:', dbError);
      
      // Si falla la BD, devolvemos error
        return NextResponse.json({
          success: false,
          message: 'Error al guardar en la base de datos',
          error: (dbError as Error).message
        }, { status: 500 });
    }

  } catch (error) {
    console.error('Error en importación masiva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para obtener estadísticas de importación desde la base de datos
export async function GET() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Obtener estadísticas desde la base de datos
    const totalRadios = await prisma.radio.count();
    const activeRadios = await prisma.radio.count({
      where: { status: 'ACTIVE' }
    });
    const inactiveRadios = await prisma.radio.count({
      where: { status: 'INACTIVE' }
    });
    const radiosWithUrl = await prisma.radio.count({
      where: { 
        streamUrl: {
          not: ''
        }
      }
    });
    const radiosWithoutUrl = totalRadios - radiosWithUrl;
    
    // Obtener regiones únicas
    const regions = await prisma.radio.findMany({
      select: { region: true },
      distinct: ['region']
    });
    
    // Obtener las últimas radios como preview
    const preview = await prisma.radio.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        region: true,
        streamUrl: true,
        status: true,
        createdAt: true
      }
    });

    const stats = {
      total: totalRadios,
      active: activeRadios,
      inactive: inactiveRadios,
      withUrl: radiosWithUrl,
      withoutUrl: radiosWithoutUrl,
      regions: regions.map((r: any) => r.region),
      lastImported: preview.length > 0 ? preview[0].createdAt : null
    };

    return NextResponse.json({
      exists: totalRadios > 0,
      stats,
      preview
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
