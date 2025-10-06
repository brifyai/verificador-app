import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/api-configurations
 * Obtiene las configuraciones de API de transcripción
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const enabledOnly = searchParams.get('enabled') === 'true';

    const configurations = await prisma.apiConfiguration.findMany({
      where: enabledOnly ? { enabled: true } : undefined,
      orderBy: { priority: 'asc' },
      select: {
        id: true,
        provider: true,
        model: true,
        enabled: true,
        priority: true,
        costPerUnit: true,
        rateLimit: true,
        metadata: true,
      },
    });

    logger.info(`Fetched ${configurations.length} API configurations`);

    return NextResponse.json({
      success: true,
      data: configurations,
    });
  } catch (error: any) {
    logger.error('Error fetching API configurations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener configuraciones de API' },
      { status: 500 }
    );
  }
}
