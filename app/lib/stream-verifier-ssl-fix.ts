import axios, { AxiosError } from 'axios';
import https from 'https';
import { URL } from 'url';

export interface SSLVerificationResult {
  isOnline: boolean;
  status: 'online' | 'offline' | 'error' | 'ssl_error';
  responseTime?: number;
  error?: string;
  sslError?: string;
  statusCode?: number;
  contentType?: string;
  icecastInfo?: {
    server: string;
    contentType: string;
    bitrate?: string;
  };
}

export class StreamVerifierSSLFix {
  private readonly timeout = 15000;
  private readonly userAgent = 'Mozilla/5.0 (compatible; RadioMonitor/1.0)';

  async verifyStream(url: string): Promise<SSLVerificationResult> {
    const startTime = Date.now();
    
    try {
      // Primero intentar con axios normal
      return await this.verifyWithAxios(url, startTime);
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Si es un error SSL, intentar con https.request con rejectUnauthorized: false
      if (this.isSSLError(axiosError)) {
        console.log(`[SSL-FIX] Detectado error SSL para ${url}, intentando con certificado deshabilitado...`);
        return await this.verifyWithSSLFix(url, startTime, axiosError);
      }
      
      // Para otros errores, retornar offline
      return {
        isOnline: false,
        status: 'offline',
        responseTime: Date.now() - startTime,
        error: axiosError.message || 'Error desconocido'
      };
    }
  }

  private async verifyWithAxios(url: string, startTime: number): Promise<SSLVerificationResult> {
    try {
      const response = await axios({
        method: 'HEAD',
        url,
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': '*/*',
          'Icy-MetaData': '1'
        },
        validateStatus: (status) => status < 500,
        maxRedirects: 5
      });

      return this.processResponse(response, startTime);
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Si es un error SSL, propagar para manejo especial
      if (this.isSSLError(axiosError)) {
        throw error;
      }
      
      // Si es timeout u otro error, intentar GET con rango
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return await this.verifyWithRangeRequest(url, startTime);
      }
      
      throw error;
    }
  }

  private async verifyWithRangeRequest(url: string, startTime: number): Promise<SSLVerificationResult> {
    try {
      const response = await axios({
        method: 'GET',
        url,
        headers: {
          'User-Agent': this.userAgent,
          'Range': 'bytes=0-1',
          'Accept': '*/*',
          'Icy-MetaData': '1'
        },
        timeout: this.timeout,
        validateStatus: (status) => status < 500,
        maxRedirects: 5
      });

      return this.processResponse(response, startTime);
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (this.isSSLError(axiosError)) {
        throw error;
      }
      
      throw error;
    }
  }

  private async verifyWithSSLFix(url: string, startTime: number, originalError: AxiosError): Promise<SSLVerificationResult> {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        timeout: this.timeout,
        rejectUnauthorized: false, // Deshabilitar verificación SSL
        headers: {
          'User-Agent': this.userAgent,
          'Accept': '*/*',
          'Icy-MetaData': '1'
        }
      };

      const req = https.request(options, (res: any) => {
        const responseTime = Date.now() - startTime;
        
        if (res.statusCode && res.statusCode < 500) {
          const isIcecast = this.detectIcecast(res.headers);
          
          resolve({
            isOnline: true,
            status: 'ssl_error', // Estado especial para indicar que hay problemas SSL pero el stream está online
            responseTime,
            statusCode: res.statusCode,
            contentType: res.headers['content-type'] as string,
            sslError: this.getSSLErrorMessage(originalError),
            icecastInfo: isIcecast ? {
              server: res.headers['server'] as string || 'Icecast',
              contentType: res.headers['content-type'] as string,
              bitrate: res.headers['icy-br'] as string
            } : undefined
          });
        } else {
          resolve({
            isOnline: false,
            status: 'offline',
            responseTime,
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}`
          });
        }
      });

      req.on('error', (error: any) => {
        const responseTime = Date.now() - startTime;
        
        resolve({
          isOnline: false,
          status: 'error',
          responseTime,
          error: error.message,
          sslError: this.getSSLErrorMessage(originalError)
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        
        resolve({
          isOnline: false,
          status: 'offline',
          responseTime,
          error: 'Timeout'
        });
      });

      req.end();
    });
  }

  private processResponse(response: any, startTime: number): SSLVerificationResult {
    const responseTime = Date.now() - startTime;
    const isIcecast = this.detectIcecast(response.headers);
    
    return {
      isOnline: true,
      status: 'online',
      responseTime,
      statusCode: response.status,
      contentType: response.headers['content-type'],
      icecastInfo: isIcecast ? {
        server: response.headers['server'] || 'Icecast',
        contentType: response.headers['content-type'],
        bitrate: response.headers['icy-br']
      } : undefined
    };
  }

  private isSSLError(error: AxiosError): boolean {
    if (!error.code) return false;
    
    const sslErrorCodes = [
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      'CERT_HAS_EXPIRED',
      'DEPTH_ZERO_SELF_SIGNED_CERT',
      'SELF_SIGNED_CERT_IN_CHAIN',
      'UNABLE_TO_GET_ISSUER_CERT',
      'UNABLE_TO_GET_CRL',
      'CERT_NOT_YET_VALID',
      'CERT_REVOKED',
      'INVALID_CERT',
      'TLS_HANDSHAKE_TIMEOUT'
    ];
    
    return sslErrorCodes.includes(error.code) || 
           error.message.includes('certificate') ||
           error.message.includes('SSL') ||
           error.message.includes('TLS');
  }

  private getSSLErrorMessage(error: AxiosError): string {
    if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      return 'Certificado SSL no válido o no verificable';
    }
    if (error.code === 'CERT_HAS_EXPIRED') {
      return 'Certificado SSL expirado';
    }
    if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
      return 'Certificado SSL auto-firmado';
    }
    if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
      return 'Certificado SSL auto-firmado en la cadena';
    }
    return error.message || 'Error SSL desconocido';
  }

  private detectIcecast(headers: any): boolean {
    const server = headers['server'] as string;
    const contentType = headers['content-type'] as string;
    const icecastHeaders = [
      'icecast',
      'shoutcast',
      'stream',
      'audio/mpeg',
      'audio/aac',
      'application/ogg'
    ];
    
    return (server && icecastHeaders.some(h => server.toLowerCase().includes(h))) ||
           (contentType && icecastHeaders.some(h => contentType.toLowerCase().includes(h))) ||
           headers['icy-name'] ||
           headers['icy-genre'] ||
           headers['icy-br'];
  }
}

// Función de compatibilidad para el sistema existente
export async function verifyStreamStatusWithSslFix(url: string): Promise<SSLVerificationResult> {
  const verifier = new StreamVerifierSSLFix();
  return verifier.verifyStream(url);
}