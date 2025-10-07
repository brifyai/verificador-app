import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Configuración de la VPS
const VPS_CONFIG = {
  host: process.env.VPS_HOST || 'tu-vps-ip',
  configPath: '/root/radio_config/radio_schedules.json'
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { radioId, schedules } = data;

    // Validar los datos
    if (!radioId || !schedules) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Obtener información de la radio
    const radio = await prisma.radio.findUnique({
      where: { id: radioId }
    });

    if (!radio) {
      return NextResponse.json({ error: 'Radio no encontrada' }, { status: 404 });
    }

    // Formatear los horarios para el archivo de configuración
    const radioConfig = {
      name: radio.name,
      url: radio.streamUrl,
      start_time: schedules.startTime,
      end_time: schedules.endTime,
      days: schedules.days,
      duration: schedules.duration || 3600
    };--

    // Enviar configuración a la VPS
    const response = await fetch(`http://${VPS_CONFIG.host}/api/update-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(radioConfig)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar configuración en VPS');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error al configurar horarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}