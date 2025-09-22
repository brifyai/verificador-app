'use client';

import { useState } from 'react';
import { signIn, getSession, getCsrfToken } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Schema de validación
const loginSchema = z.object({
  email: z.string()
    .email('Formato de email inválido')
    .toLowerCase(),
  password: z.string()
    .min(1, 'La contraseña es requerida')
});

type FormData = z.infer<typeof loginSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

export default function SignInPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  const router = useRouter();

  const validateField = (name: keyof FormData, value: string) => {
    try {
      const pickSchema = name === 'email' 
        ? loginSchema.pick({ email: true })
        : loginSchema.pick({ password: true });
      pickSchema.parse({ [name]: value });
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ 
          ...prev, 
          [name]: error.errors[0]?.message 
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores al escribir
    if (errors[name as keyof FormData]) {
      validateField(name as keyof FormData, value);
    }
    
    // Limpiar error general
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError('');
    
    console.log('🚀 INICIO DEL PROCESO DE LOGIN');
    
    try {
      // Validar datos del formulario
      const validatedData = loginSchema.pick({ email: true, password: true }).parse(formData);

      console.log('✅ VALIDACIÓN EXITOSA');

      // Obtener callbackUrl de los parámetros de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
      
      // Decodificar la URL si está codificada
      const decodedCallbackUrl = decodeURIComponent(callbackUrl);
      
      console.log('🔗 URL PARAMS:', {
        originalCallbackUrl: callbackUrl,
        decodedCallbackUrl: decodedCallbackUrl,
        currentUrl: window.location.href
      });

      console.log('🔐 INTENTANDO LOGIN CON NEXTAUTH...');
      console.log('📧 EMAIL:', validatedData.email);
      console.log('🔑 PASSWORD LENGTH:', validatedData.password.length);
      console.log('🎯 PROVIDER ID: credentials');

      // Intentar login manual directo al endpoint de autenticación
      console.log('🔄 INTENTANDO LOGIN MANUAL...');
      
      try {
        const response = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: validatedData.email,
            password: validatedData.password,
            callbackUrl: decodedCallbackUrl,
            csrfToken: await getCsrfToken() || '',
            json: 'true'
          })
        });

        console.log('📡 RESPUESTA DEL SERVIDOR:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📋 DATOS DE RESPUESTA:', data);
          
          if (data.url) {
            console.log('✅ LOGIN EXITOSO - REDIRIGIENDO A:', data.url);
            window.location.href = data.url;
            return;
          }
        }
        
        // Si llegamos aquí, el login falló
         console.log('❌ LOGIN MANUAL FALLÓ');
         setError('Error en la autenticación. Verifica tus credenciales.');
         
       } catch (error) {
         console.error('💥 ERROR EN LOGIN MANUAL:', error);
         setError('Error de conexión. Inténtalo de nuevo.');
       }
      
      if (false) {
        console.log('✅ LOGIN EXITOSO, REDIRIGIENDO A:', decodedCallbackUrl);
        
        // Esperar un momento para que la sesión se establezca
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirigir manualmente
        window.location.href = decodedCallbackUrl;
      } else {
        console.log('⚠️ RESULTADO INESPERADO:', result);
        setError('Error inesperado en el proceso de autenticación.');
      }
    } catch (error) {
      console.error('💥 ERROR GENERAL EN HANDLESUBMIT:', error);
      if (error instanceof z.ZodError) {
         setError('Por favor, completa todos los campos correctamente.');
       } else {
         setError('Error interno del servidor. Inténtalo más tarde.');
       }
    } finally {
      setIsLoading(false);
      
      // Timeout de seguridad
      setTimeout(() => {
        console.log('⏰ TIMEOUT - Si no se redirigió, hay un problema');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={(e) => validateField('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
                disabled={isLoading}
                autoComplete="email"
                required
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField('password', e.target.value)}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Error general */}
            {generalError && (
              <Alert variant="destructive">
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Link to register */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link 
                href="/auth/signup" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}