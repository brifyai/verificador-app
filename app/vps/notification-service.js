/**
 * Servicio de notificaciones para alertas de detección de frases
 */

const fs = require('fs');
const path = require('path');

class NotificationService {
  constructor() {
    this.notificationsFile = './notifications.json';
    this.ensureNotificationsFile();
  }

  /**
   * Asegurar que existe el archivo de notificaciones
   */
  ensureNotificationsFile() {
    if (!fs.existsSync(this.notificationsFile)) {
      fs.writeFileSync(this.notificationsFile, JSON.stringify({ notifications: [] }, null, 2));
    }
  }

  /**
   * Crear notificación cuando se detecta una frase
   */
  async createPhraseDetectionAlert(detectionData) {
    try {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'PHRASE_DETECTED',
        priority: 'HIGH',
        timestamp: new Date().toISOString(),
        read: false,
        data: {
          folderName: detectionData.folderName,
          phrase: detectionData.phrase,
          brand: detectionData.brand,
          campaign: detectionData.campaign,
          totalMatches: detectionData.totalMatches,
          recordingDate: detectionData.recordingDate,
          radioName: this.extractRadioName(detectionData.folderName),
        },
        message: `¡Frase detectada! "${detectionData.phrase}" encontrada ${detectionData.totalMatches} vez/veces en ${this.extractRadioName(detectionData.folderName)}`,
      };

      // Guardar en archivo
      this.saveNotification(notification);

      // Log en consola
      console.log('\n🔔 ═══════════════════════════════════════════════════════');
      console.log('🔔 ¡ALERTA! FRASE DETECTADA');
      console.log('🔔 ═══════════════════════════════════════════════════════');
      console.log(`📻 Radio: ${notification.data.radioName}`);
      console.log(`💬 Frase: "${notification.data.phrase}"`);
      console.log(`🏢 Marca: ${notification.data.brand}`);
      if (notification.data.campaign) {
        console.log(`📢 Campaña: ${notification.data.campaign}`);
      }
      console.log(`🎯 Coincidencias: ${notification.data.totalMatches}`);
      console.log(`📅 Fecha: ${new Date(notification.data.recordingDate).toLocaleString('es-CL')}`);
      console.log(`📁 Grabación: ${notification.data.folderName}`);
      console.log('🔔 ═══════════════════════════════════════════════════════\n');

      return notification;
    } catch (error) {
      console.error('❌ Error creando notificación:', error);
      return null;
    }
  }

  /**
   * Guardar notificación en archivo
   */
  saveNotification(notification) {
    try {
      const data = JSON.parse(fs.readFileSync(this.notificationsFile, 'utf8'));
      
      // Agregar al inicio (más recientes primero)
      data.notifications.unshift(notification);

      // Mantener solo las últimas 100 notificaciones
      if (data.notifications.length > 100) {
        data.notifications = data.notifications.slice(0, 100);
      }

      fs.writeFileSync(this.notificationsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error guardando notificación:', error);
    }
  }

  /**
   * Obtener todas las notificaciones
   */
  getNotifications(limit = 50, unreadOnly = false) {
    try {
      const data = JSON.parse(fs.readFileSync(this.notificationsFile, 'utf8'));
      let notifications = data.notifications || [];

      if (unreadOnly) {
        notifications = notifications.filter(n => !n.read);
      }

      return notifications.slice(0, limit);
    } catch (error) {
      console.error('❌ Error obteniendo notificaciones:', error);
      return [];
    }
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(notificationId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.notificationsFile, 'utf8'));
      const notification = data.notifications.find(n => n.id === notificationId);

      if (notification) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        fs.writeFileSync(this.notificationsFile, JSON.stringify(data, null, 2));
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error marcando notificación:', error);
      return false;
    }
  }

  /**
   * Marcar todas como leídas
   */
  markAllAsRead() {
    try {
      const data = JSON.parse(fs.readFileSync(this.notificationsFile, 'utf8'));
      const now = new Date().toISOString();

      data.notifications.forEach(n => {
        if (!n.read) {
          n.read = true;
          n.readAt = now;
        }
      });

      fs.writeFileSync(this.notificationsFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Error marcando todas las notificaciones:', error);
      return false;
    }
  }

  /**
   * Obtener contador de no leídas
   */
  getUnreadCount() {
    try {
      const data = JSON.parse(fs.readFileSync(this.notificationsFile, 'utf8'));
      return data.notifications.filter(n => !n.read).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Extraer nombre de radio del nombre de carpeta
   */
  extractRadioName(folderName) {
    // Formato: Radio_Name_2024-10-13_14-30-00
    const parts = folderName.split('_');
    
    if (parts.length >= 3) {
      // Unir todas las partes excepto las últimas dos (fecha y hora)
      return parts.slice(0, -2).join(' ');
    }

    return folderName;
  }

  /**
   * Limpiar notificaciones antiguas (más de 30 días)
   */
  cleanOldNotifications(daysToKeep = 30) {
    try {
      const data = JSON.parse(fs.readFileSync(this.notificationsFile, 'utf8'));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const initialCount = data.notifications.length;
      data.notifications = data.notifications.filter(n => {
        const notifDate = new Date(n.timestamp);
        return notifDate >= cutoffDate;
      });

      const removed = initialCount - data.notifications.length;

      if (removed > 0) {
        fs.writeFileSync(this.notificationsFile, JSON.stringify(data, null, 2));
        console.log(`🧹 Limpiadas ${removed} notificaciones antiguas`);
      }

      return removed;
    } catch (error) {
      console.error('❌ Error limpiando notificaciones:', error);
      return 0;
    }
  }
}

module.exports = NotificationService;
