
import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService, getDriveConfig } from '@/lib/google-drive';

// GET: Obtener configuración actual
export async function GET() {
  try {
    const config = getDriveConfig();
    
    return NextResponse.json({
      success: true,
      configured: !!(config.serviceAccountCredentials || config.apiKey),
      hasServiceAccount: !!config.serviceAccountCredentials,
      hasApiKey: !!config.apiKey,
      hasFolderId: !!config.folderId
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      configured: false,
      error: 'Error obteniendo configuración'
    }, { status: 500 });
  }
}

// POST: Probar conexión con Google Drive
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'test') {
      const driveConfig = getDriveConfig();
      const driveService = new GoogleDriveService(driveConfig);
      
      const isConnected = await driveService.testConnection();
      
      if (isConnected) {
        return NextResponse.json({
          success: true,
          message: 'Conexión exitosa con Google Drive'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'No se pudo conectar con Google Drive'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Acción no válida'
    }, { status: 400 });

  } catch (error) {
    console.error('Error en test de Google Drive:', error);
    return NextResponse.json({
      success: false,
      error: 'Error probando conexión'
    }, { status: 500 });
  }
}
