'use client';

import { useState } from 'react';

export default function TestLoginPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('');

    try {
      console.log('🚀 Iniciando fetch...');
      
      const response = await fetch('/api/auth/login-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@verificador.com',
          password: 'admin123'
        })
      });

      console.log('📡 Respuesta recibida:', response.status);

      const data = await response.json();
      console.log('✅ Datos:', data);

      setResult(JSON.stringify(data, null, 2));

      if (data.success) {
        // Guardar token
        localStorage.setItem('auth-token', data.token);
        setResult('✅ LOGIN EXITOSO! Token guardado en localStorage');
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setResult('❌ ERROR: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center text-white mb-6">TEST DE LOGIN</h1>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium py-3 rounded mb-4"
        >
          {loading ? 'Probando...' : 'PROBAR LOGIN DIRECTO'}
        </button>

        <div className="bg-slate-800 border border-slate-600 rounded p-4">
          <h2 className="text-slate-300 mb-2">Resultado:</h2>
          <pre className="text-slate-400 text-sm whitespace-pre-wrap">
            {result || 'Haz clic en el botón para probar el login'}
          </pre>
        </div>

        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>Si ves "LOGIN EXITOSO", serás redirigido al dashboard</p>
          <p>Si ves un error, copia el mensaje y envíamelo</p>
        </div>
      </div>
    </div>
  );
}