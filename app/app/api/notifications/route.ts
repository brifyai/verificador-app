import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const NOTIFICATIONS_FILE = path.join(process.cwd(), '../vps/notifications.json');

interface Notification {
  id: string;
  type: string;
  priority: string;
  timestamp: string;
  read: boolean;
  readAt?: string;
  data: {
    folderName: string;
    phrase: string;
    brand: string;
    campaign?: string;
    totalMatches: number;
    recordingDate: string;
    radioName: string;
  };
  message: string;
}

/**
 * GET /api/notifications
 * Obtiene las notificaciones de detección de frases
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Verificar si existe el archivo
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      return NextResponse.json({
        success: true,
        data: {
          notifications: [],
          total: 0,
          unreadCount: 0,
        },
      });
    }

    const fileContent = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    let notifications: Notification[] = data.notifications || [];

    // Filtrar solo no leídas si se solicita
    if (unreadOnly) {
      notifications = notifications.filter((n: Notification) => !n.read);
    }

    // Aplicar límite
    const limitedNotifications = notifications.slice(0, limit);

    // Contar no leídas
    const unreadCount = data.notifications.filter((n: Notification) => !n.read).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications: limitedNotifications,
        total: notifications.length,
        unreadCount: unreadCount,
      },
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo notificaciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener notificaciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Marca notificaciones como leídas
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      return NextResponse.json({
        success: false,
        error: 'Archivo de notificaciones no encontrado',
      }, { status: 404 });
    }

    const fileContent = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    const now = new Date().toISOString();

    if (markAllAsRead) {
      // Marcar todas como leídas
      data.notifications.forEach((n: Notification) => {
        if (!n.read) {
          n.read = true;
          n.readAt = now;
        }
      });

      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));

      return NextResponse.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas',
      });
    } else if (notificationId) {
      // Marcar una específica como leída
      const notification = data.notifications.find((n: Notification) => n.id === notificationId);

      if (notification) {
        notification.read = true;
        notification.readAt = now;

        fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));

        return NextResponse.json({
          success: true,
          message: 'Notificación marcada como leída',
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Notificación no encontrada',
        }, { status: 404 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Se requiere notificationId o markAllAsRead',
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Error actualizando notificaciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar notificaciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Elimina notificaciones antiguas
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '30');

    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      return NextResponse.json({
        success: true,
        message: 'No hay notificaciones para eliminar',
        deleted: 0,
      });
    }

    const fileContent = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const initialCount = data.notifications.length;
    data.notifications = data.notifications.filter((n: Notification) => {
      const notifDate = new Date(n.timestamp);
      return notifDate >= cutoffDate;
    });

    const deleted = initialCount - data.notifications.length;

    if (deleted > 0) {
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: `${deleted} notificaciones antiguas eliminadas`,
      deleted: deleted,
    });

  } catch (error: any) {
    console.error('❌ Error eliminando notificaciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar notificaciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
