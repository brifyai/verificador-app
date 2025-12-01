'use client';

import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState({
    localStorageToken: null as string | null,
    cookies: {} as Record<string, string>,
    authHeader: null as string | null,
    userAgent: '',
    timestamp: ''
  });

  useEffect(() => {
    // Obtener token de localStorage
    const localStorageToken = localStorage.getItem('auth-token');
    
    // Obtener cookies
    const cookies: Record<string, string> = {};
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      });
    }
    
    // Obtener auth header de una petición de prueba
    const checkAuthHeader = async () => {
      try {
        const response = await fetch('/api/radios-direct?limit=1', {
          method: 'GET',
          credentials: 'include'
        });
        
        setDebugInfo(prev => ({
          ...prev,
          authHeader: response.headers.get('Authorization') || 'No auth header in response',
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        setDebugInfo(prev => ({
          ...prev,
          authHeader: `Error: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    };

    setDebugInfo({
      localStorageToken,
      cookies,
      authHeader: 'Checking...',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      timestamp: new Date().toISOString()
    });

    checkAuthHeader();
  }, []);

  const testAuthEndpoints = async () => {
    const results = {
      login: { status: 'pending' as string | number, data: null as any },
      radios: { status: 'pending' as string | number, data: null as any },
      recordings: { status: 'pending' as string | number, data: null as any }
    };

    // Test login endpoint
    try {
      const loginResponse = await fetch('/api/auth/login-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin'
        })
      });
      
      results.login.status = loginResponse.status;
      results.login.data = await loginResponse.json();
      
      // Guardar token en localStorage si existe
      if (results.login.data.token) {
        localStorage.setItem('auth-token', results.login.data.token);
      }
    } catch (error) {
      results.login.status = 'error';
      results.login.data = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test radios endpoint
    try {
      const radiosResponse = await fetch('/api/radios-direct?limit=1', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
        }
      });
      
      results.radios.status = radiosResponse.status;
      if (radiosResponse.ok) {
        results.radios.data = await radiosResponse.json();
      } else {
        results.radios.data = { error: `HTTP ${radiosResponse.status}` };
      }
    } catch (error) {
      results.radios.status = 'error';
      results.radios.data = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test recordings endpoint (should work without auth)
    try {
      const recordingsResponse = await fetch('/api/recordings', {
        method: 'GET',
        credentials: 'include'
      });
      
      results.recordings.status = recordingsResponse.status;
      if (recordingsResponse.ok) {
        results.recordings.data = await recordingsResponse.json();
      } else {
        results.recordings.data = { error: `HTTP ${recordingsResponse.status}` };
      }
    } catch (error) {
      results.recordings.status = 'error';
      results.recordings.data = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return results;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug de Autenticación</h1>
        
        <div className="space-y-6">
          {/* Información actual */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
            <div className="space-y-2 font-mono text-sm">
              <div><strong>localStorage token:</strong> {debugInfo.localStorageToken ? '✅ Presente' : '❌ No encontrado'}</div>
              <div><strong>Cookies:</strong> {Object.keys(debugInfo.cookies).length > 0 ? JSON.stringify(debugInfo.cookies, null, 2) : '❌ No cookies'}</div>
              <div><strong>Auth Header Response:</strong> {debugInfo.authHeader}</div>
              <div><strong>User Agent:</strong> {debugInfo.userAgent}</div>
              <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
            </div>
          </div>

          {/* Botón de prueba */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Probar Endpoints</h2>
            <button
              onClick={async () => {
                const results = await testAuthEndpoints();
                console.log('Auth test results:', results);
                alert(`Resultados:\nLogin: ${results.login.status}\nRadios: ${results.radios.status}\nRecordings: ${results.recordings.status}`);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Probar Autenticación
            </button>
          </div>

          {/* Instrucciones */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Instrucciones</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Primero, haz login en la aplicación</li>
              <li>Verifica que el token aparezca en localStorage o cookies</li>
              <li>Prueba los endpoints con el botón de arriba</li>
              <li>Si hay errores, revisa la consola del navegador y del servidor</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}