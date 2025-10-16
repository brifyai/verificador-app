import { NextRequest, NextResponse } from 'next/server';

// Esta ruta ya no se usa directamente, ya que estamos accediendo a la VPS
// Pero la mantenemos por compatibilidad
export async function GET(request: NextRequest) {
  // Datos reales basados en el ejemplo proporcionado
  const audiosReales = [
    {
      name: "stream_2025-09-24T16-38-04-942Z.wav",
      sizeMB: "18.31",
      createdAt: "2025-09-25T14:05:49.677Z",
      url: "/audio/stream_2025-09-24T16-38-04-942Z.wav",
      audioUrl: `/api/audios/download?id=${encodeURIComponent("stream_2025-09-24T16-38-04-942Z.wav")}`,
      downloadUrl: `/api/audios/download?id=${encodeURIComponent("stream_2025-09-24T16-38-04-942Z.wav")}`
    },
    {
      name: "stream_2025-09-25T14-21-54-237Z.wav",
      sizeMB: "18.31",
      createdAt: "2025-09-25T14:21:55.051Z",
      url: "/audio/stream_2025-09-25T14-21-54-237Z.wav",
      audioUrl: `/api/audios/download?id=${encodeURIComponent("stream_2025-09-25T14-21-54-237Z.wav")}`,
      downloadUrl: `/api/audios/download?id=${encodeURIComponent("stream_2025-09-25T14-21-54-237Z.wav")}`
    },
    {
      name: "stream_2025-09-25T14-31-39-271Z.wav",
      sizeMB: "18.31",
      createdAt: "2025-09-25T14:31:40.601Z",
      url: "/audio/stream_2025-09-25T14-31-39-271Z.wav",
      audioUrl: `/api/audios/download?id=${encodeURIComponent("stream_2025-09-25T14-31-39-271Z.wav")}`,
      downloadUrl: `/api/audios/download?id=${encodeURIComponent("stream_2025-09-25T14-31-39-271Z.wav")}`
    },
    {
      name: "stream_2025-09-25T14-41-25-758Z.wav",
      sizeMB: "18.31",
      createdAt: "2025-09-25T14:41:27.650Z",
      url: "/audio/stream_2025-09-25T14-41-25-758Z.wav",
      audioUrl: `/api/audios/download?id=${encodeURIComponent("stream_2025-09-25T14-41-25-758Z.wav")}`,
      downloadUrl: `/api/audios/download?id=${encodeURIComponent("stream_2025-09-25T14-41-25-758Z.wav")}`
    }
  ];

  // Devolver directamente los datos reales
  return NextResponse.json({
    success: true,
    audios: audiosReales,
    total: audiosReales.length
  });
}
