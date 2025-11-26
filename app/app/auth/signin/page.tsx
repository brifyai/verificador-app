'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('admin@verificador.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Enviando login...', { email, password: '***' });

      const response = await fetch('/api/auth/login-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 Respuesta:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login exitoso:', data);

        // Guardar token
        localStorage.setItem('auth-token', data.token);
        
        // Redirigir al dashboard
        console.log('🔄 Redirigiendo al dashboard...');
        router.push('/dashboard');
        router.refresh();
      } else {
        const error = await response.json();
        setError(error.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center text-white mb-2">Iniciar Sesión</h1>
        <p className="text-center text-slate-400 mb-6">Sistema de Verificación de Radios</p>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 rounded transition-colors"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-4 text-center text-slate-400">
          <p>Demo: admin@verificador.com / admin123</p>
        </div>
      </div>
    </div>
  );
}