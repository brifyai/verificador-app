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

      // 🆕 Enviar detecciones que necesitan verificación al backend
      if (detectionData.needsVerification && detectionData.matches) {
        await this.sendDetectionsToBackend(detectionData);
      }

      return notification;
    } catch (error) {
      console.error('❌ Error creando notificación:', error);
      return null;
    }
  }

  /**
   * Guardar detecciones directamente en la base de datos (solo las que necesitan verificación)
   */
  async sendDetectionsToBackend(detectionData) {
    try {
      const { Client } = require('pg');
      
      // Filtrar solo las coincidencias que necesitan verificación
      const matchesNeedingVerification = detectionData.matches.filter(
        match => match.needsHumanVerification
      );

      if (matchesNeedingVerification.length === 0) {
        console.log('   ℹ️ No hay coincidencias que requieran verificación');
        return;
      }

      console.log(`   📤 Guardando ${matchesNeedingVerification.length} detección(es) en la base de datos...`);

      // Conectar a la base de datos
      const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CuHOsyb3Xh7g@ep-sparkling-block-acyyvpq7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
      });
      
      await client.connect();

      // Guardar cada coincidencia que necesita verificación en la tabla detections
      for (const match of matchesNeedingVerification) {
        // 1. Buscar o crear la frase
        let phraseResult = await client.query(
          'SELECT id FROM phrases WHERE phrase = $1 LIMIT 1',
          [detectionData.phrase]
        );

        let phraseId;
        if (phraseResult.rows.length === 0) {
          // Crear la frase
          const newPhrase = await client.query(
            'INSERT INTO phrases (phrase, brand, campaign, category, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
            [
              detectionData.phrase, 
              detectionData.brand || 'No especificada', 
              detectionData.campaign || 'No especificada', 
              'PROMOTION'
            ]
          );
          phraseId = newPhrase.rows[0].id;
          console.log(`   ℹ️ Frase creada: "${detectionData.phrase}" (ID: ${phraseId})`);
        } else {
          phraseId = phraseResult.rows[0].id;
          console.log(`   ℹ️ Usando frase existente: "${detectionData.phrase}" (ID: ${phraseId})`);
        }

        // 2. Buscar o crear la radio
        const radioName = this.extractRadioName(detectionData.folderName);
        let radioResult = await client.query(
          'SELECT id FROM radios WHERE name = $1 LIMIT 1',
          [radioName]
        );

        let radioId;
        if (radioResult.rows.length === 0) {
          // Crear la radio
          const newRadio = await client.query(
            'INSERT INTO radios (name, "streamUrl", region, "userId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
            [radioName, '', 'No especificada', detectionData.userId]
          );
          radioId = newRadio.rows[0].id;
        } else {
          radioId = radioResult.rows[0].id;
        }

        // 3. Crear la detección
        const detectionResult = await client.query(
          `INSERT INTO detections (
            id, "phraseId", "radioId", "detectedText", "originalText",
            confidence, similarity, timestamp,
            verified, "falsePositive", cost, metadata
          ) VALUES (
            gen_random_uuid()::text, $1, $2, $3, $4, 
            $5, $6, $7,
            $8, $9, $10, $11
          ) RETURNING id`,
          [
            phraseId, 
            radioId, 
            match.matchedText, // detectedText
            detectionData.phrase, // originalText (la frase buscada)
            match.confidence, 
            match.confidence, // similarity
            new Date(detectionData.recordingDate),
            false, // verified (false = necesita verificación)
            false, // falsePositive
            0.0, // cost
            JSON.stringify({
              verifiedBy: match.verifiedBy,
              reason: match.aiReason,
              folderName: detectionData.folderName,
              context: match.context || match.matchedText,
              needsVerification: true
            })
          ]
        );
        console.log(`   ✅ Detección guardada con ID: ${detectionResult.rows[0].id}`);
      }

      await client.end();
      console.log('   ✅ Detecciones guardadas en la base de datos correctamente');
    } catch (error) {
      console.error('   ❌ Error guardando detecciones en la base de datos:', error.message);
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
