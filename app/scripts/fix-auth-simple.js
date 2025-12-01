#!/usr/bin/env node

/**
 * SCRIPT SIMPLIFICADO PARA ARREGLAR PROBLEMAS DE AUTENTICACIÓN
 * 
 * Este script implementa una solución definitiva para los problemas de auth
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 ARREGLANDO PROBLEMAS DE AUTENTICACIÓN');
console.log('=======================================\n');

const appDir = path.join(__dirname, '..');
const backupDir = path.join(__dirname, 'backups');

// Crear directorio de respaldos si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function backupFile(filePath) {
  const fullPath = path.join(appDir, filePath);
  if (fs.existsSync(fullPath)) {
    const backupPath = path.join(backupDir, `${path.basename(filePath)}.${Date.now()}.backup`);
    fs.copyFileSync(fullPath, backupPath);
    console.log(`📋 Respaldo creado: ${backupPath}`);
    return backupPath;
  }
  return null;
}

function replaceFile(filePath, newContent) {
  const fullPath = path.join(appDir, filePath);
  backupFile(filePath);
  fs.writeFileSync(fullPath, newContent);
  console.log(`✅ Actualizado: ${filePath}`);
}

// 1. ACTUALIZAR AUTH PRINCIPAL
console.log('1️⃣  ACTUALIZANDO SISTEMA DE AUTH PRINCIPAL...');
console.log('---------------------------------------------');

const authContent = `import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        logger.auth('AUTHORIZE - Iniciando autenticación', { 
          email: credentials?.email 
        });

        if (!credentials?.email || !credentials?.password) {
          logger.auth('AUTHORIZE - Credenciales faltantes');
          return null;
        }

        try {
          logger.auth('AUTHORIZE - Buscando usuario en Supabase...');
          
          // Buscar usuario directamente en Supabase
          const users = await supabaseDirect.getUsers();
          const user = users.find((u: any) => u.email === credentials.email);

          if (!user) {
            logger.auth('AUTHORIZE - Usuario no encontrado');
            return null;
          }

          if (!user.active) {
            logger.auth('AUTHORIZE - Usuario inactivo');
            return null;
          }

          // Verificar contraseña
          logger.auth('AUTHORIZE - Verificando contraseña...');
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!passwordMatch) {
            logger.auth('AUTHORIZE - Contraseña incorrecta');
            return null;
          }
          
          // Éxito - devolver datos del usuario
          const userData = {
            id: user.id,
            email: user.email,
            name: user.name || 'Usuario',
            role: user.role || 'user'
          };
          
          logger.auth('AUTHORIZE - Login exitoso', userData);
          return userData;
          
        } catch (error) {
          logger.error('AUTHORIZE - Error en autenticación', error);
          return null;
        }
      }
    })
  ],
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
  
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string
        };
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Redirigir siempre al dashboard después de login
      if (url === baseUrl || url.startsWith(baseUrl)) {
        return \`\${baseUrl}/dashboard\`;
      }
      
      if (url.startsWith('/')) {
        return \`\${baseUrl}\${url}\`;
      }
      
      return \`\${baseUrl}/dashboard\`;
    }
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  // Deshabilitar debug para evitar spam en logs
  debug: false,
};

// Exportar helper para verificar auth en APIs
export async function requireAuth(session: any) {
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }
  return session.user;
}

// Exportar helper para verificar roles
export function requireRole(session: any, allowedRoles: string[]) {
  const user = session?.user;
  if (!user?.id || !user?.role) {
    throw new Error('No autorizado');
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Permisos insuficientes');
  }
  
  return user;
}`;

replaceFile('lib/auth.ts', authContent);

// 2. ACTUALIZAR MIDDLEWARE
console.log('\n2️⃣  ACTUALIZANDO MIDDLEWARE...');
console.log('-----------------------------');

const middlewareContent = `import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasPermission } from './lib/permissions';

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Rutas públicas que no requieren autenticación
    const publicRoutes = [
      '/auth/signin',
      '/auth/signup', 
      '/auth/error',
      '/api/audios/list',
      '/auth/test-login',
      '/test-streaming-platform'
    ];

    // Rutas de API que deben ser públicas
    const publicApiRoutes = [
      '/api/audios/download',
      '/api/auth/providers',
      '/api/auth/session'
    ];

    // Verificar si la ruta actual es pública
    const isPublicRoute = publicRoutes.includes(pathname);
    const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));

    if (isPublicRoute || isPublicApiRoute) {
      return NextResponse.next();
    }

    // Si el usuario está autenticado y trata de acceder a rutas de auth, redirigir al dashboard
    if (token && ['/auth/signin', '/auth/signup'].includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Verificar permisos para rutas protegidas
    if (token) {
      const userRole = token.role as string;
      if (!hasPermission(userRole, pathname)) {
        console.log('Middleware - Permisos insuficientes', { 
          user: token.email, 
          role: userRole, 
          path: pathname 
        });
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Sin token - redirigir a login para rutas protegidas
    console.log('Middleware - Sin autenticación', { path: pathname });
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Rutas públicas que no requieren autenticación
        const publicRoutes = [
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/api/audios/list',
          '/auth/test-login',
          '/test-streaming-platform'
        ];

        const publicApiRoutes = [
          '/api/audios/download',
          '/api/auth/providers',
          '/api/auth/session'
        ];

        // Permitir acceso a rutas públicas sin token
        if (publicRoutes.includes(pathname)) {
          return true;
        }

        // Permitir acceso a APIs públicas
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Requerir token para todo lo demás
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

// Configuración del matcher
export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas EXCEPTO:
     * - Archivos estáticos de Next.js (_next/static, _next/image)
     * - Favicon y archivos de imagen
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\\\.(png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
};`;

replaceFile('middleware.ts', middlewareContent);

// 3. ACTUALIZAR LOGIN DIRECT
console.log('\n3️⃣  ACTUALIZANDO LOGIN DIRECT...');
console.log('--------------------------------');

const loginDirectContent = `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Solo verificar si ya hay una sesión activa
    const session = await getServerSession(authOptions);
    
    if (session) {
      return NextResponse.json({
        success: true,
        message: 'Ya hay una sesión activa',
        user: session.user
      });
    }

    return NextResponse.json(
      { success: false, error: 'No hay sesión activa' },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Error en login direct:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}`;

replaceFile('app/api/auth/login-direct/route.ts', loginDirectContent);

// 4. ACTUALIZAR API RADIOS/[ID] SIMPLIFICADA
console.log('\n4️⃣  ACTUALIZANDO API RADIOS/[ID]...');
console.log('-----------------------------------');

const radiosIdContent = `import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificación de sesión con NextAuth
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Verificar que la radio existe
    const existingRadios = await supabaseDirect.request(\`radios?select=*&id=eq.\${id}\`);
    if (existingRadios.length === 0) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }
    
    const existingRadio = existingRadios[0];

    // Actualizar radio con datos validados
    const updateData: any = {
      ...(body.name && { name: body.name }),
      ...(body.streamUrl && { stream_url: body.streamUrl }),
      ...(body.streamPlatform && { platform: body.streamPlatform.toUpperCase() }),
      ...(body.region && { region: body.region }),
      ...(body.isActive !== undefined && {
        status: body.isActive ? 'ACTIVE' : 'INACTIVE'
      }),
      ...(body.genre && { description: body.genre }),
      updated_at: new Date().toISOString()
    };

    // Actualizar metadata si hay campos adicionales
    const hasMetadataFields = body.programadora !== undefined ||
                             body.frequency !== undefined ||
                             body.city !== undefined ||
                             body.website !== undefined;

    if (hasMetadataFields) {
      const existingMetadata = existingRadio.metadata as Record<string, any> || {};
      updateData.metadata = {
        ...(existingMetadata || {}),
        ...(body.programadora !== undefined && { programadora: body.programadora }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.website !== undefined && { website: body.website }),
      };
    }

    const updatedRadios = await supabaseDirect.request(\`radios?id=eq.\${id}\`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedRadio = updatedRadios[0];

    // Devolver objeto transformado
    const metadata = updatedRadio.metadata as Record<string, any> || {};
    const transformedRadio = {
      id: updatedRadio.id,
      name: updatedRadio.name,
      programadora: metadata.programadora || '',
      frequency: metadata.frequency || '',
      streamUrl: updatedRadio.stream_url,
      streamPlatform: updatedRadio.platform,
      region: updatedRadio.region,
      city: metadata.city || '',
      website: metadata.website || '',
      isActive: updatedRadio.status === 'ACTIVE',
      genre: updatedRadio.description || 'Música',
    };
    
    return NextResponse.json({ 
      success: true, 
      data: transformedRadio,
      message: 'Radio actualizada exitosamente' 
    });
  } catch (error) {
    logger.error('Error actualizando radio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificación de sesión con NextAuth
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Verificar que la radio existe
    const existingRadios = await supabaseDirect.request(\`radios?select=*&id=eq.\${id}\`);
    if (existingRadios.length === 0) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }

    // Eliminar la radio
    await supabaseDirect.request(\`radios?id=eq.\${id}\`, {
      method: 'DELETE'
    });
    return NextResponse.json({ 
      success: true, 
      message: 'Radio eliminada exitosamente' 
    });
  } catch (error: any) {
    logger.error('Error eliminando radio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}`;

replaceFile('app/api/radios/[id]/route.ts', radiosIdContent);

console.log('\n✅ SOLUCIÓN IMPLEMENTADA');
console.log('========================\n');

console.log('📋 RESUMEN DE CAMBIOS:');
console.log('- ✅ Sistema de auth simplificado (solo NextAuth.js)');
console.log('- ✅ Middleware simplificado sin conflictos');
console.log('- ✅ Login direct eliminado (usa NextAuth)');
console.log('- ✅ APIs protegidas consistentemente');
console.log('- ✅ Sin más conflictos entre sistemas duales');

console.log('\n🔧 SIGUIENTES PASOS:');
console.log('1. Reiniciar la aplicación: cd app && npm run dev');
console.log('2. Verificar logs de autenticación');
console.log('3. Probar login con usuario existente');
console.log('4. Verificar que las APIs funcionan correctamente');

console.log('\n💡 Si sigues teniendo problemas:');
console.log('- Verifica que NEXTAUTH_SECRET esté configurado');
console.log('- Asegúrate de que las credenciales de Supabase sean correctas');
console.log('- Revisa los logs con: cd app && npm run dev 2>&1 | grep -i "auth"');