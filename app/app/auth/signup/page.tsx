'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Schema de validación
// Esquema base sin refine para acceder a shape
const baseRegisterSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  email: z.string()
    .email('Formato de email inválido')
    .toLowerCase(),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Debe contener: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'),
  confirmPassword: z.string()
});

const registerSchema = baseRegisterSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof registerSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

export default function SignUpPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const router = useRouter();

  // Validación de fuerza de contraseña
  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  };

  const validateField = (name: keyof FormData, value: string) => {
    try {
      if (name === 'confirmPassword') {
        registerSchema.parse({ ...formData, [name]: value });
      } else {
        // Crear un esquema temporal para validar solo este campo
        const fieldSchema = z.object({
          [name]: baseRegisterSchema.shape[name]
        });
        fieldSchema.parse({ [name]: value });
      }
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => 
          err.path.includes(name)
        );
        if (fieldError) {
          setErrors(prev => ({ 
            ...prev, 
            [name]: fieldError.message 
          }));
        }
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
    
    // Validar confirmPassword si se cambia password
    if (name === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
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
    
    try {
      // Validar formulario completo
      const validationResult = registerSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const fieldErrors: FormErrors = {};
        validationResult.error.errors.forEach(error => {
          const field = error.path[0] as keyof FormData;
          fieldErrors[field] = error.message;
        });
        setErrors(fieldErrors);
        return;
      }

      // Registrar usuario
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: validationResult.data.name,
          email: validationResult.data.email,
          password: validationResult.data.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Errores de validación del backend
          const backendErrors: FormErrors = {};
          data.errors.forEach((error: any) => {
            backendErrors[error.field as keyof FormData] = error.message;
          });
          setErrors(backendErrors);
        } else {
          setGeneralError(data.message || 'Error al registrar usuario');
        }
        return;
      }

      // Registro exitoso
      setIsSuccess(true);
      
      // Auto-login después del registro
      setTimeout(async () => {
        const result = await signIn('credentials', {
          email: validationResult.data.email,
          password: validationResult.data.password,
          redirect: false
        });

        if (result?.ok) {
          router.push('/dashboard');
          router.refresh();
        } else {
          // Si falla el auto-login, redirigir a signin
          router.push('/auth/signin?message=registered');
        }
      }, 2000);

    } catch (error) {
      console.error('Error en registro:', error);
      setGeneralError('Error inesperado. Intenta nuevamente');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md shadow-2xl bg-slate-900 border-slate-700">
          <CardContent className="pt-6 bg-slate-900">
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-green-400" />
              <h2 className="text-2xl font-bold text-green-400">
                ¡Registro Exitoso!
              </h2>
              <p className="text-slate-300">
                Tu cuenta ha sido creada correctamente. 
                Iniciando sesión automáticamente...
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      {/* Logo/Brand section */}
      <div className="absolute top-8 left-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">OndaVerificada</span>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl bg-slate-900 border-slate-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Completa los datos para registrarte en el sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Nombre completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={handleInputChange}
                onBlur={(e) => validateField('name', e.target.value)}
                className={`bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
                disabled={isLoading}
                autoComplete="name"
                required
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={(e) => validateField('email', e.target.value)}
                className={`bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
                autoComplete="email"
                required
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField('password', e.target.value)}
                  className={`bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password}</p>
              )}
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? 'bg-red-500'
                              : passwordStrength.score <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.score <= 2
                      ? 'text-red-400'
                      : passwordStrength.score <= 3
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}>
                    {passwordStrength.feedback}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField('confirmPassword', e.target.value)}
                  className={`bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Error general */}
            {generalError && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-400">
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition-colors" 
              disabled={isLoading || passwordStrength.score < 5}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          {/* Link to login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                href="/auth/signin" 
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}