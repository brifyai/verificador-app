'use client';

import { toast as reactToastifyToast } from 'react-toastify';
import { toast as shadcnToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface EnhancedToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

class EnhancedToastManager {
  private loadingToasts = new Map<string, any>();

  success(message: string, options?: EnhancedToastOptions) {
    const { title = '✅ Éxito', duration = 3000, ...rest } = options || {};
    
    // Usar react-toastify para mejor UX
    reactToastifyToast.success(message, {
      position: "top-right",
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: "bg-green-50 text-green-800 border border-green-200",
      progressClassName: "bg-green-500",
    });

    // También usar shadcn toast como respaldo
    shadcnToast({
      title,
      description: message,
      variant: 'default',
    });
  }

  error(message: string, options?: EnhancedToastOptions) {
    const { title = '❌ Error', duration = 5000, ...rest } = options || {};
    
    reactToastifyToast.error(message, {
      position: "top-right",
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: "bg-red-50 text-red-800 border border-red-200",
      progressClassName: "bg-red-500",
    });

    shadcnToast({
      title,
      description: message,
      variant: 'destructive',
    });
  }

  warning(message: string, options?: EnhancedToastOptions) {
    const { title = '⚠️ Advertencia', duration = 4000, ...rest } = options || {};
    
    reactToastifyToast.warn(message, {
      position: "top-right",
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: "bg-yellow-50 text-yellow-800 border border-yellow-200",
      progressClassName: "bg-yellow-500",
    });

    shadcnToast({
      title,
      description: message,
      variant: 'default',
    });
  }

  info(message: string, options?: EnhancedToastOptions) {
    const { title = 'ℹ️ Información', duration = 3000, ...rest } = options || {};
    
    reactToastifyToast.info(message, {
      position: "top-right",
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: "bg-blue-50 text-blue-800 border border-blue-200",
      progressClassName: "bg-blue-500",
    });

    shadcnToast({
      title,
      description: message,
      variant: 'default',
    });
  }

  loading(message: string, options?: EnhancedToastOptions & { id?: string }) {
    const { title = '⏳ Cargando...', id = 'loading', ...rest } = options || {};
    
    const toastId = reactToastifyToast.loading(message, {
      position: "top-right",
      closeOnClick: false,
      closeButton: false,
      className: "bg-blue-50 text-blue-800 border border-blue-200",
    });

    if (id) {
      this.loadingToasts.set(id, toastId);
    }

    return toastId;
  }

  updateLoading(id: string, type: 'success' | 'error', message: string, options?: EnhancedToastOptions) {
    const toastId = this.loadingToasts.get(id);
    if (toastId) {
      if (type === 'success') {
        reactToastifyToast.update(toastId, {
          render: message,
          type: 'success',
          isLoading: false,
          autoClose: 3000,
          closeOnClick: true,
          className: "bg-green-50 text-green-800 border border-green-200",
          progressClassName: "bg-green-500",
        });
      } else {
        reactToastifyToast.update(toastId, {
          render: message,
          type: 'error',
          isLoading: false,
          autoClose: 5000,
          closeOnClick: true,
          className: "bg-red-50 text-red-800 border border-red-200",
          progressClassName: "bg-red-500",
        });
      }
      this.loadingToasts.delete(id);
    }
  }

  dismiss(id?: string) {
    if (id && this.loadingToasts.has(id)) {
      const toastId = this.loadingToasts.get(id);
      reactToastifyToast.dismiss(toastId);
      this.loadingToasts.delete(id);
    } else {
      reactToastifyToast.dismiss();
    }
  }

  // Métodos especializados para operaciones CRUD
  createSuccess(message: string, options?: EnhancedToastOptions) {
    this.success(message, { title: '✅ Creado', ...options });
  }

  createError(message: string, options?: EnhancedToastOptions) {
    this.error(message, { title: '❌ Error al Crear', ...options });
  }

  updateSuccess(message: string, options?: EnhancedToastOptions) {
    this.success(message, { title: '✅ Actualizado', ...options });
  }

  updateError(message: string, options?: EnhancedToastOptions) {
    this.error(message, { title: '❌ Error al Actualizar', ...options });
  }

  deleteSuccess(message: string, options?: EnhancedToastOptions) {
    this.success(message, { title: '✅ Eliminado', ...options });
  }

  deleteError(message: string, options?: EnhancedToastOptions) {
    this.error(message, { title: '❌ Error al Eliminar', ...options });
  }

  // Métodos especializados para audio
  audioSuccess(message: string, options?: EnhancedToastOptions) {
    this.success(message, { title: '🎵 Audio', ...options });
  }

  audioError(message: string, options?: EnhancedToastOptions) {
    this.error(message, { title: '🎵 Error de Audio', ...options });
  }

  // Método para mostrar notificaciones de audio específicas
  audioNotification(type: 'play' | 'stop' | 'error' | 'loading', radioName: string, message?: string) {
    switch (type) {
      case 'play':
        this.success(`🎵 Reproduciendo: ${radioName}`, {
          title: 'Audio Iniciado',
          duration: 2000,
        });
        break;
      case 'stop':
        this.info(`⏹️ Detenido: ${radioName}`, {
          title: 'Audio Detenido',
          duration: 2000,
        });
        break;
      case 'error':
        this.error(message || `❌ Error reproduciendo: ${radioName}`, {
          title: 'Error de Audio',
          duration: 4000,
        });
        break;
      case 'loading':
        return this.loading(`⏳ Cargando: ${radioName}`, {
          title: 'Conectando...',
          id: `audio-${radioName}`,
        });
    }
  }

  // Método para notificaciones de operaciones CRUD
  crudNotification(operation: 'create' | 'update' | 'delete', entity: string, success: boolean, message?: string) {
    const operations = {
      create: { success: 'creado', error: 'crear' },
      update: { success: 'actualizado', error: 'actualizar' },
      delete: { success: 'eliminado', error: 'eliminar' },
    };

    if (success) {
      this.success(message || `${entity} ${operations[operation].success} exitosamente`, {
        title: 'Operación Exitosa',
        duration: 3000,
      });
    } else {
      this.error(message || `Error al ${operations[operation].error} ${entity}`, {
        title: 'Error en Operación',
        duration: 4000,
      });
    }
  }
}

// Instancia singleton
const enhancedToast = new EnhancedToastManager();

// Hook para usar el sistema de notificaciones mejorado
export function useEnhancedToast() {
  return enhancedToast;
}

// Exportar también como default para facilidad de uso
export default enhancedToast;