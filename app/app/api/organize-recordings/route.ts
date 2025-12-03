import { NextRequest, NextResponse } from 'next/server';
import { recordingOrganizationService } from '@/lib/recording-organization-service';

export async function POST(request: NextRequest) {
  try {
    console.log('📁 API: Iniciando organización de grabaciones...');
    
    const body = await request.json().catch(() => ({}));
    const { autoOrganize = true, syncToDatabase = true } = body;

    // Actualizar configuración del servicio
    recordingOrganizationService.updateConfig({
      autoOrganize,
      syncToDatabase
    });

    // Ejecutar organización
    const result = await recordingOrganizationService.organizeExistingRecordings();

    return NextResponse.json({
      status: result.success ? 'success' : 'error',
      message: result.success ? 'Organización completada' : 'Error en la organización',
      data: {
        stats: result.stats,
        organized: result.organized,
        errors: result.errors
      }
    });

  } catch (error) {
    console.error('❌ Error en API /api/organize-recordings:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido',
        data: {
          stats: { total: 0, organized: 0, errors: 1, skipped: 0 },
          organized: [],
          errors: [error instanceof Error ? error.message : 'Error desconocido']
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 API: Consultando estado del servicio de organización...');
    
    const status = recordingOrganizationService.getStatus();

    return NextResponse.json({
      status: 'success',
      data: status
    });

  } catch (error) {
    console.error('❌ Error consultando estado:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}