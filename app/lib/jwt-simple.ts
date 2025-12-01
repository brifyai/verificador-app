// JWT implementation using Web Crypto API (Edge Runtime compatible)
// No external dependencies

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey123456789';

// Convert string to Uint8Array for Web Crypto
function str2ab(str: string): Uint8Array {
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
}

// Convert base64url to base64
function base64urlToBase64(base64url: string): string {
  return base64url.replace(/-/g, '+').replace(/_/g, '/');
}

// Convert base64 to base64url
function base64ToBase64url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create HMAC signature using Web Crypto API
async function createSignature(data: string, secret: string): Promise<string> {
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

// Verify HMAC signature using Web Crypto API
async function verifySignature(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBuffer = Uint8Array.from(atob(base64urlToBase64(signature)), c => c.charCodeAt(0));
    
    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      encoder.encode(data)
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  try {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const payloadWithTime = {
      ...payload,
      iat: now,
      exp: now + (7 * 24 * 60 * 60) // 7 days
    };
    
    const headerEncoded = base64ToBase64url(btoa(JSON.stringify(header)));
    const payloadEncoded = base64ToBase64url(btoa(JSON.stringify(payloadWithTime)));
    
    const data = `${headerEncoded}.${payloadEncoded}`;
    const signature = await createSignature(data, JWT_SECRET);
    
    return `${data}.${signature}`;
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw new Error('Failed to sign JWT');
  }
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid JWT format');
      return null;
    }
    
    const [headerEncoded, payloadEncoded, signature] = parts;
    
    // Verify signature
    const data = `${headerEncoded}.${payloadEncoded}`;
    const isValid = await verifySignature(data, signature, JWT_SECRET);
    
    if (!isValid) {
      console.log('Invalid JWT signature');
      return null;
    }
    
    // Decode payload
    const payloadJson = atob(base64urlToBase64(payloadEncoded));
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('JWT expired');
      return null;
    }
    
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
}