import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Proxy para streams de audio
 * Resuelve problemas de CORS y permite reproducir cualquier stream
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('URL parameter required', { status: 400 });
  }

  try {
    logger.log(`🔗 Proxying stream: ${url}`);
    
    // Hacer fetch al stream con headers apropiados
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'audio/*, video/*, */*',
        'Icy-MetaData': '1', // Para metadata de Icecast/Shoutcast
        'Connection': 'keep-alive',
      },
      // @ts-ignore - Next.js soporta esto
      duplex: 'half'
    });

    if (!response.ok) {
      logger.error(`Stream returned ${response.status} for ${url}`);
      return new NextResponse(`Stream error: ${response.status}`, { status: response.status });
    }

    // Obtener Content-Type del stream
    const contentType = response.headers.get('Content-Type') || 'audio/mpeg';
    
    logger.log(`✅ Stream proxy successful: ${url} (${contentType})`);

    // Devolver el stream con CORS habilitado
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Accept, User-Agent',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
        // Pasar metadata de Icecast si existe
        ...(response.headers.get('icy-name') && {
          'icy-name': response.headers.get('icy-name') || '',
          'icy-genre': response.headers.get('icy-genre') || '',
          'icy-br': response.headers.get('icy-br') || '',
        })
      }
    });
  } catch (error) {
    logger.error('Error proxying stream:', error);
    return new NextResponse(
      `Error proxying stream: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      { status: 500 }
    );
  }
}

/**
 * OPTIONS para preflight CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Accept, User-Agent',
    }
  });
}
