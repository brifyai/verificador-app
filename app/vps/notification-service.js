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
   * Guardar TODAS las detecciones directamente en la base de datos
   */
  async sendDetectionsToBackend(detectionData) {
    try {
      const { Client } = require('pg');
      
      // 🆕 GUARDAR TODAS LAS DETECCIONES (no filtrar)
      const allMatches = detectionData.matches || [];

      if (allMatches.length === 0) {
        console.log('   ℹ️ No hay detecciones para guardar');
        return;
      }

      console.log(`   📤 Guardando ${allMatches.length} detección(es) en la base de datos...`);

      // Conectar a la base de datos
      const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CuHOsyb3Xh7g@ep-sparkling-block-acyyvpq7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
      });
      
      await client.connect();

      // 🆕 Buscar o crear sesión de monitoreo
      const sessionId = await this.findOrCreateSession(client, detectionData);
      
      // 🆕 Crear captura de audio
      const captureId = await this.createCapture(client, detectionData, sessionId);
      
      // Guardar TODAS las coincidencias en la tabla detections
      for (const match of allMatches) {
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

        // 2. Obtener radioId de la sesión (ya existe porque se creó en findOrCreateSession)
        const sessionInfo = await client.query(
          'SELECT "radioId" FROM monitoring_sessions WHERE id = $1',
          [sessionId]
        );
        
        const radioId = sessionInfo.rows[0]?.radioId || sessionId; // Fallback si no existe

        // 3. 🆕 Determinar si necesita verificación humana (umbral: 65%)
        const needsVerification = match.confidence < 0.65;
        
        // 4. Crear la detección con sessionId y captureId
        const detectionResult = await client.query(
          `INSERT INTO detections (
            id, "phraseId", "radioId", "sessionId", "captureId",
            "detectedText", "originalText",
            confidence, similarity, timestamp,
            verified, "falsePositive", cost, metadata
          ) VALUES (
            gen_random_uuid()::text, $1, $2, $3, $4, 
            $5, $6, 
            $7, $8, $9,
            $10, $11, $12, $13
          ) RETURNING id`,
          [
            phraseId, 
            radioId,
            sessionId, // 🆕 Agregar sessionId
            captureId, // 🆕 Agregar captureId
            match.matchedText, // detectedText
            detectionData.phrase, // originalText (la frase buscada)
            match.confidence, 
            match.confidence, // similarity
            new Date(detectionData.recordingDate),
            !needsVerification, // 🆕 verified = true si confianza >= 65%
            false, // falsePositive
            0.0, // cost
            JSON.stringify({
              verifiedBy: match.verifiedBy,
              reason: match.aiReason,
              folderName: detectionData.folderName,
              context: match.context || match.matchedText,
              needsVerification: needsVerification,
              confidenceLevel: match.confidence >= 0.85 ? 'Alta' : 
                               match.confidence >= 0.65 ? 'Media' : 'Baja'
            })
          ]
        );
        
        const status = needsVerification ? '⚠️ Requiere verificación' : '✅ Verificada automáticamente';
        console.log(`   ${status} - ID: ${detectionResult.rows[0].id} (${(match.confidence * 100).toFixed(0)}%)`);
      }

      await client.end();
      console.log('   ✅ Todas las detecciones guardadas en la base de datos correctamente');
    } catch (error) {
      console.error('   ❌ Error guardando detecciones en la base de datos:', error.message);
      console.error('   📋 Stack:', error.stack);
    }
  }

  /**
   * 🆕 Buscar o crear sesión de monitoreo
   */
  async findOrCreateSession(client, detectionData) {
    try {
      // Extraer información de la carpeta
      const radioName = this.extractRadioName(detectionData.folderName);
      const userId = detectionData.userId || 'system';
      
      // 🆕 PRIMERO: Buscar o crear la radio
      let radioResult = await client.query(
        'SELECT id FROM radios WHERE name = $1 LIMIT 1',
        [radioName]
      );

      let radioId;
      if (radioResult.rows.length === 0) {
        // Crear la radio
        const newRadio = await client.query(
          `INSERT INTO radios (
            id, name, "streamUrl", platform, region, status, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text, $1, '', 'HTTP_STREAM', 'No especificada', 'ACTIVE', NOW(), NOW()
          ) RETURNING id`,
          [radioName]
        );
        radioId = newRadio.rows[0].id;
        console.log(`   ℹ️ Radio creada: "${radioName}" (ID: ${radioId})`);
      } else {
        radioId = radioResult.rows[0].id;
      }
      
      // Buscar sesión existente para este usuario y radio
      const sessionResult = await client.query(
        `SELECT id FROM monitoring_sessions 
         WHERE "userId" = $1 
         AND "radioId" = $2
         AND status = 'ACTIVE' 
         ORDER BY "startTime" DESC 
         LIMIT 1`,
        [userId, radioId]
      );
      
      if (sessionResult.rows.length > 0) {
        return sessionResult.rows[0].id;
      }
      
      // Crear nueva sesión con radioId válido
      const newSession = await client.query(
        `INSERT INTO monitoring_sessions (
          id, "userId", "radioId", status, "startTime"
        ) VALUES (
          gen_random_uuid()::text, $1, $2, 'ACTIVE', NOW()
        ) RETURNING id`,
        [userId, radioId]
      );
      
      console.log(`   ℹ️ Sesión creada: ${newSession.rows[0].id}`);
      return newSession.rows[0].id;
      
    } catch (error) {
      console.error('   ⚠️ Error creando sesión:', error.message);
      console.error('   📋 Stack:', error.stack);
      throw error; // Re-lanzar el error para manejarlo arriba
    }
  }

  /**
   * 🆕 Crear captura de audio
   */
  async createCapture(client, detectionData, sessionId) {
    try {
      // Construir ruta del audio
      const audioPath = `recordings/${detectionData.folderName}/${detectionData.folderName}.mp3`;
      
      // Crear captura
      const captureResult = await client.query(
        `INSERT INTO captures (
          id, "sessionId", "audioPath", "duration", 
          "capturedAt"
        ) VALUES (
          gen_random_uuid()::text, $1, $2, 60,
          $3
        ) RETURNING id`,
        [
          sessionId,
          audioPath,
          new Date(detectionData.recordingDate)
        ]
      );
      
      console.log(`   ℹ️ Captura creada: ${captureResult.rows[0].id}`);
      return captureResult.rows[0].id;
      
    } catch (error) {
      console.error('   ⚠️ Error creando captura:', error.message);
      // Retornar un ID genérico si falla
      return 'system-capture';
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
