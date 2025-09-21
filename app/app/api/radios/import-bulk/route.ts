
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    // Guardar en archivo JSON para respaldo/desarrollo
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, 'radios_imported.json');
    
    let existingRadios = [];
    if (!replaceAll && fs.existsSync(filePath)) {
      try {
        const existingData = fs.readFileSync(filePath, 'utf8');
        existingRadios = JSON.parse(existingData);
      } catch (error) {
        console.log('No se pudo leer archivo existente, creando nuevo');
      }
    }

    const finalRadios = replaceAll ? processedRadios : [...existingRadios, ...processedRadios];
    
    // Eliminar duplicados por nombre y región
    const uniqueRadios = finalRadios.reduce((acc: any[], current: any) => {
      const existing = acc.find(radio => 
        radio.name.toLowerCase() === current.name.toLowerCase() && 
        radio.region.toLowerCase() === current.region.toLowerCase()
      );
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Guardar en archivo como respaldo
    fs.writeFileSync(filePath, JSON.stringify(uniqueRadios, null, 2));

    // Importar a la base de datos usando Prisma
    try {
      const { PrismaClient, Platform, RadioStatus } = require('@prisma/client');
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
                  ...(existingRadio.metadata || {}),
                  frequency: radio.frequency || existingRadio.metadata?.frequency,
                  city: radio.city || existingRadio.metadata?.city,
                  website: radio.website || existingRadio.metadata?.website,
                  phone: radio.phone || existingRadio.metadata?.phone,
                  email: radio.email || existingRadio.metadata?.email,
                  address: radio.address || existingRadio.metadata?.address,
                  logo: radio.logo || existingRadio.metadata?.logo,
                  description: radio.description || existingRadio.metadata?.description
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
        savedTo: 'Base de datos y archivo de respaldo'
      });
    } catch (dbError) {
      console.error('Error al guardar en la base de datos:', dbError);
      
      console.log(`✅ Importación exitosa (solo archivo): ${stats.total} radios procesadas`);
      console.log(`📊 Estadísticas: ${stats.active} activas, ${stats.inactive} inactivas, ${stats.regions} regiones`);
      
      // Si falla la BD, al menos devolvemos los datos del archivo
      return NextResponse.json({
        success: true,
        message: `Importación exitosa: ${stats.total} radios (solo archivo)`,
        error: dbError.message,
        stats,
        preview: processedRadios.slice(0, 5),
        savedTo: replaceAll ? 'Reemplazados todos los registros en archivo' : 'Agregados a registros existentes en archivo'
      });
    }

  } catch (error) {
    console.error('Error en importación masiva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para obtener estadísticas de importación
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'radios_imported.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        exists: false,
        message: 'No hay radios importadas'
      });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const stats = {
      total: data.length,
      active: data.filter((r: any) => r.status === 'active').length,
      inactive: data.filter((r: any) => r.status === 'inactive').length,
      withUrl: data.filter((r: any) => r.streamUrl).length,
      withoutUrl: data.filter((r: any) => !r.streamUrl).length,
      regions: [...new Set(data.map((r: any) => r.region))],
      lastImported: data.length > 0 ? data[0].created_at : null
    };

    return NextResponse.json({
      exists: true,
      stats,
      preview: data.slice(0, 10)
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
