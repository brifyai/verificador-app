'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const errorMessages: Record<string, string> = {
  'Signin': 'Error al iniciar sesión. Verifica tus credenciales.',
  'OAuthSignin': 'Error al iniciar sesión con el proveedor externo.',
  'OAuthCallback': 'Error en el callback de autenticación.',
  'OAuthCreateAccount': 'Error al crear la cuenta con el proveedor externo.',
  'EmailCreateAccount': 'Error al crear la cuenta con email.',
  'Callback': 'Error en el proceso de autenticación.',
  'OAuthAccountNotLinked': 'Esta cuenta ya está vinculada con otro método de autenticación.',
  'EmailSignin': 'Error al enviar el email de verificación.',
  'CredentialsSignin': 'Credenciales inválidas. Verifica tu email y contraseña.',
  'SessionRequired': 'Debes iniciar sesión para acceder a esta página.',
  'AccessDenied': 'Acceso denegado. No tienes permisos para acceder.',
  'Verification': 'Error en la verificación. El enlace puede haber expirado.',
  'Default': 'Ha ocurrido un error inesperado durante la autenticación.'
};

interface AuthErrorPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const error = (searchParams?.error as string) || 'Default';
  
  const errorMessage = errorMessages[error] || errorMessages['Default'];
  
  const getErrorTitle = (errorType: string) => {
    switch (errorType) {
      case 'CredentialsSignin':
        return 'Credenciales Incorrectas';
      case 'AccessDenied':
        return 'Acceso Denegado';
      case 'SessionRequired':
        return 'Sesión Requerida';
      case 'OAuthAccountNotLinked':
        return 'Cuenta Ya Vinculada';
      default:
        return 'Error de Autenticación';
    }
  };

  const getErrorIcon = (errorType: string) => {
    return <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />;
  };

  const getRecommendedAction = (errorType: string) => {
    switch (errorType) {
      case 'CredentialsSignin':
        return {
          text: 'Verifica que tu email y contraseña sean correctos. Si olvidaste tu contraseña, contacta al administrador.',
          showRegister: true
        };
      case 'AccessDenied':
        return {
          text: 'Tu cuenta no tiene permisos para acceder al sistema. Contacta al administrador.',
          showRegister: false
        };
      case 'SessionRequired':
        return {
          text: 'Necesitas iniciar sesión para acceder a esta página.',
          showRegister: true
        };
      case 'OAuthAccountNotLinked':
        return {
          text: 'Esta cuenta ya está asociada con otro método de autenticación. Intenta con el método original.',
          showRegister: false
        };
      default:
        return {
          text: 'Si el problema persiste, contacta al soporte técnico.',
          showRegister: true
        };
    }
  };

  const recommendation = getRecommendedAction(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4">
          {getErrorIcon(error)}
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-red-700">
              {getErrorTitle(error)}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {errorMessage}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {recommendation.text}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Login
              </Link>
            </Button>
            
            {recommendation.showRegister && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signup">
                  ¿No tienes cuenta? Regístrate
                </Link>
              </Button>
            )}
          </div>

          {/* Debug info (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-gray-100 rounded-md">
              <p className="text-xs text-gray-600 font-mono">
                Debug: Error type = {error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
