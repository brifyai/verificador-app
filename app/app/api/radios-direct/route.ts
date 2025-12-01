import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';
import { verifyStreamStatus } from '@/lib/stream-verifier';
import { RadioCreateSchema } from '@/lib/schemas/radio.schema';
import { mapPlatformToDbSmart } from '@/lib/platform-mapping-smart';
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

// GET: Obtener radios
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación con nuestro sistema JWT
    const user = await verifyAuth(request);
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    logger.info(`[RADIOS-DIRECT] Usuario autenticado: ${user.email}`);

    const searchParams = request.nextUrl.searchParams;
    const context = searchParams.get('context');

    // CASO 1: Para la página "Configurar Nuevo Análisis"
    if (context === 'setup') {
      const radios = await supabaseDirect.request(
        'radios?select=id,name,region&status=eq.ACTIVE&order=name.asc'
      );
      return NextResponse.json({ success: true, data: radios });
    }

    // CASO 2: Para cualquier otra página
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Obtener total de radios
    const allRadios = await supabaseDirect.request('radios?select=id');
    const totalRadios = allRadios.length;

    // Obtener radios paginadas
    const radios = await supabaseDirect.request(
      `radios?order=region.asc,name.asc&limit=${limit}&offset=${(page - 1) * limit}`
    );

    const transformedRadios = radios.map((radio: any) => {
      const metadata = radio.metadata || {};
      return {
        id: radio.id,
        name: radio.name,
        programadora: metadata.programadora || '',
        frequency: metadata.frequency || '',
        streamUrl: radio.stream_url,
        streamPlatform: metadata.stream_platform || radio.platform.toLowerCase(),
        region: radio.region,
        city: metadata.city || '',
        website: metadata.website || '',
        isActive: radio.status === 'ACTIVE',
        genre: radio.description || 'Música',
        priority: radio.priority || 1,
        costPerHour: radio.cost_per_hour || 0.0,
        lastMonitored: metadata.last_monitored || 'Nunca',
        lastVerificationStatus: radio.last_verification_status || null,
        lastVerifiedAt: radio.last_verified_at || null,
        createdAt: radio.created_at,
        updatedAt: radio.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedRadios,
      pagination: { total: totalRadios, page, limit, pages: Math.ceil(totalRadios / limit) }
    });

  } catch (error) {
    console.error('Error obteniendo radios:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Crear una nueva radio
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación con nuestro sistema JWT
    const user = await verifyAuth(request);
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    logger.info(`[RADIOS-DIRECT] Usuario creando radio: ${user.email}`);

    const body = await request.json();

    // Validar con Zod
    const validationResult = RadioCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos inválidos', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }
    
    const validated = validationResult.data;

    // Verificar el stream antes de crear la radio
    const verification = await verifyStreamStatus(validated.streamUrl);
    logger.info(`Stream verification for ${validated.name}: ${verification.status} (${verification.streamType}) - ${verification.details}`);

    // Crear metadata
    const metadata = {
      programadora: validated.programadora || validated.name,
      frequency: validated.frequency || '',
      city: validated.city || validated.region,
      website: validated.website || '',
      streamPlatform: validated.streamPlatform || 'direct',
      verification: {
        status: verification.status,
        streamType: verification.streamType,
        httpStatus: verification.httpStatus ?? null,
        contentType: verification.contentType ?? null,
        usedProxy: verification.usedProxy,
        method: verification.method,
        details: verification.details,
      }
    };

    const platformMapping = validated.streamPlatform ? mapPlatformToDbSmart(validated.streamPlatform) : { platform: 'OTHER' };
    const newRadioData = {
      name: validated.name,
      stream_url: validated.streamUrl,
      platform: platformMapping.platform,
      region: validated.region,
      status: validated.isActive ? 'ACTIVE' : 'INACTIVE',
      description: validated.genre || 'Música',
      priority: (validated as any).priority || 1,
      cost_per_hour: (validated as any).costPerHour || 0.0,
      last_verification_status: verification.status === 'EXTERNAL' ? 'ONLINE' : verification.status,
      last_verified_at: new Date().toISOString(),
      metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newRadio = await supabaseDirect.request('radios', {
      method: 'POST',
      body: JSON.stringify(newRadioData),
      headers: { 'Prefer': 'return=representation' }
    });

    // Transformar datos antes de devolver
    const transformedRadio = {
      id: newRadio[0].id,
      name: newRadio[0].name,
      programadora: metadata.programadora,
      frequency: metadata.frequency,
      streamUrl: newRadio[0].stream_url,
      streamPlatform: metadata.streamPlatform,
      region: newRadio[0].region,
      city: metadata.city,
      website: metadata.website,
      isActive: newRadio[0].status === 'ACTIVE',
      genre: newRadio[0].description,
      priority: newRadio[0].priority,
      costPerHour: newRadio[0].cost_per_hour,
      lastMonitored: (metadata as any).lastMonitored || 'Nunca',
      lastVerificationStatus: newRadio[0].last_verification_status,
      lastVerifiedAt: newRadio[0].last_verified_at,
    };

    logger.info(`[RADIOS-DIRECT] Radio creada exitosamente: ${transformedRadio.name}`);
    return NextResponse.json({ success: true, data: transformedRadio }, { status: 201 });
    
  } catch (error: any) {
    logger.error('Error creando radio:', error);
    if (error?.code === '23505') { // Unique violation en PostgreSQL
        return NextResponse.json({ success: false, error: 'Ya existe una radio con ese nombre y región.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}