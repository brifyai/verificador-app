
import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService, getDriveConfig, AudioUploadData } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extraer datos del FormData
    const audioFile = formData.get('audio') as File;
    const radioId = formData.get('radioId') as string;
    const radioName = formData.get('radioName') as string;
    const detectionId = formData.get('detectionId') as string;
    const phrase = formData.get('phrase') as string;
    const timestamp = new Date(formData.get('timestamp') as string);
    const duration = parseFloat(formData.get('duration') as string);
    const transcription = formData.get('transcription') as string;

    if (!audioFile || !radioId || !radioName || !detectionId || !phrase) {
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos'
      }, { status: 400 });
    }

    // Convertir archivo a buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Configurar servicio de Google Drive
    const driveConfig = getDriveConfig();
    const driveService = new GoogleDriveService(driveConfig);

    // Datos para el upload
    const uploadData: AudioUploadData = {
      radioId,
      radioName,
      detectionId,
      phrase,
      timestamp,
      audioBuffer,
      duration,
      transcription
    };

    // Subir archivo a Google Drive
    const uploadResult = await driveService.uploadAudio(uploadData);

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      file: uploadResult,
      message: 'Audio subido exitosamente a Google Drive'
    });

  } catch (error) {
    console.error('Error subiendo audio:', error);
    return NextResponse.json({
      success: false,
      error: 'Error subiendo archivo'
    }, { status: 500 });
  }
}
