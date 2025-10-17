import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Reconstruir la ruta del archivo
    const filePath = params.path.join('/');
    
    // Definir rutas posibles donde buscar el archivo
    const possiblePaths = [
      // Ruta en public/captures (archivos estáticos de Next.js)
      path.join(process.cwd(), 'public', 'captures', filePath),
      // Ruta en app/captures
      path.join(process.cwd(), 'app', 'captures', filePath),
      // Ruta en captures directamente
      path.join(process.cwd(), 'captures', filePath),
    ];

    let audioFilePath: string | null = null;
    let fileExists = false;

    // Buscar el archivo en las rutas posibles
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        audioFilePath = possiblePath;
        fileExists = true;
        break;
      }
    }

    if (!fileExists || !audioFilePath) {
      // Si el archivo no existe localmente, intentar obtenerlo desde la VPS
      const vpsUrl = process.env.VPS_AUDIO_URL;
      if (vpsUrl) {
        try {
          const vpsResponse = await fetch(`${vpsUrl}/recordings/${filePath}`);
          if (vpsResponse.ok) {
            const audioBuffer = await vpsResponse.arrayBuffer();
            const contentType = vpsResponse.headers.get('content-type') || 'audio/mpeg';
            
            return new NextResponse(audioBuffer, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
                'Accept-Ranges': 'bytes',
              },
            });
          }
        } catch (vpsError) {
          console.error('Error fetching from VPS:', vpsError);
        }
      }

      return new NextResponse("Audio file not found", { status: 404 });
    }

    // Leer el archivo
    const fileBuffer = fs.readFileSync(audioFilePath);
    const stat = fs.statSync(audioFilePath);
    
    // Determinar el tipo de contenido basado en la extensión
    const ext = path.extname(audioFilePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
    };
    const contentType = contentTypeMap[ext] || 'audio/mpeg';

    // Manejar solicitudes de rango (para streaming de audio)
    const range = request.headers.get('range');
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(audioFilePath, { start, end });
      
      return new NextResponse(fileStream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // Respuesta completa del archivo
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('Error serving audio file:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
