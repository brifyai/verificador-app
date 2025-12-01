import { useCallback } from 'react';

/**
 * Hook mejorado para hacer fetch con autenticación
 * Utiliza cookies en lugar de localStorage para mayor seguridad
 * y consistencia con el backend
 */
export function useAuthenticatedFetch() {
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    // Obtener el token de las cookies en lugar de localStorage
    const token = getCookie('auth-token');
    
    const headers = {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Importante: incluir cookies en las peticiones
    });
  }, []);

  return fetchWithAuth;
}

/**
 * Función auxiliar para obtener el valor de una cookie
 * @param name Nombre de la cookie
 * @returns Valor de la cookie o null si no existe
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null; // En el servidor, no hay acceso a document
  }

  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

/**
 * Hook alternativo que intenta localStorage primero y luego cookies
 * Para compatibilidad hacia atrás durante la transición
 */
export function useAuthenticatedFetchCompatible() {
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    // Intentar localStorage primero (compatibilidad hacia atrás)
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth-token') || getCookie('auth-token');
    }
    
    const headers = {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  }, []);

  return fetchWithAuth;
}