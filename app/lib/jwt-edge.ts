// JWT implementation compatible with Edge Runtime
// Using Web Crypto API instead of jose library

import { signJWT, verifyJWT } from './jwt-simple';
import type { JWTPayload } from './jwt-simple';

// Re-exportar las funciones de jwt-simple para mantener compatibilidad
export { signJWT, verifyJWT };
export type { JWTPayload };