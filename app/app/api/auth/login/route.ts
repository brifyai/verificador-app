
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Este endpoint es manejado por NextAuth
  return NextResponse.json({ message: 'Use /api/auth/signin para autenticación' });
}
