// Script para generar un token JWT compatible con Web Crypto API del backend
// Usa la misma implementación que el backend

// Clave secreta desde el entorno
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey123456789';

// Función para convertir base64url a base64
function base64urlToBase64(base64url) {
  return base64url.replace(/-/g, '+').replace(/_/g, '/');
}

// Función para convertir base64 a base64url
function base64ToBase64url(base64) {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Función para crear firma HMAC usando Web Crypto API
async function createSignature(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  return base64ToBase64url(btoa(String.fromCharCode(...new Uint8Array(signature))));
}

// Función principal para crear JWT
async function createJWT(payload) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payloadWithTime = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 horas
  };
  
  const headerEncoded = base64ToBase64url(btoa(JSON.stringify(header)));
  const payloadEncoded = base64ToBase64url(btoa(JSON.stringify(payloadWithTime)));
  
  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = await createSignature(data, JWT_SECRET);
  
  return `${data}.${signature}`;
}

// Función principal asíncrona
async function main() {
  try {
    // Generar token para admin con la estructura esperada por el backend
    const adminToken = await createJWT({
      id: 'admin-1',
      email: 'admin@verificador.com',
      name: 'Administrador',
      role: 'admin'
    });

    console.log('🔑 Nuevo token JWT generado (Web Crypto API):');
    console.log(adminToken);
    console.log('\n📋 Payload del token:');
    console.log(JSON.stringify({
      id: 'admin-1',
      email: 'admin@verificador.com',
      name: 'Administrador',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, null, 2));

  } catch (error) {
    console.error('❌ Error generando token:', error);
  }
}

// Ejecutar
main();