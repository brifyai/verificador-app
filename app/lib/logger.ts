/**
 * Logger condicional para desarrollo
 * En producción, solo loguea errores críticos
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log general - Solo en desarrollo
   */
  log(...args: any[]) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * Info - Solo en desarrollo
   */
  info(...args: any[]) {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  /**
   * Debug - Solo en desarrollo
   */
  debug(...args: any[]) {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }

  /**
   * Warning - Solo en desarrollo
   */
  warn(...args: any[]) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  /**
   * Error - SIEMPRE loguea (incluso en producción)
   * Pero sanitiza datos sensibles
   */
  error(...args: any[]) {
    // En producción, sanitizar datos sensibles
    if (!this.isDevelopment) {
      const sanitized = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return this.sanitizeObject(arg);
        }
        return arg;
      });
      console.error(...sanitized);
    } else {
      console.error(...args);
    }
  }

  /**
   * Sanitiza objetos removiendo campos sensibles
   */
  private sanitizeObject(obj: any): any {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'accessToken',
      'refreshToken',
      'email', // En producción, no loguear emails
      'phone',
      'address',
      'creditCard',
      'ssn'
    ];

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = this.sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Log de autenticación - Sanitizado automáticamente
   */
  auth(message: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`🔐 [AUTH] ${message}`, data ? this.sanitizeObject(data) : '');
    }
  }

  /**
   * Log de API - Solo en desarrollo
   */
  api(method: string, endpoint: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`🌐 [API] ${method} ${endpoint}`, data || '');
    }
  }

  /**
   * Log de base de datos - Solo en desarrollo
   */
  db(operation: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`💾 [DB] ${operation}`, data || '');
    }
  }
}

// Exportar instancia única
export const logger = new Logger();

// Exportar también como default
export default logger;
