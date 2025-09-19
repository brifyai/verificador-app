
import { NextRequest, NextResponse } from 'next/server';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  avatar?: string;
}

// Mock data - en producción vendría de la base de datos
let mockProfile: UserProfile = {
  id: '1',
  fullName: 'Carlos Mendoza Herrera',
  email: 'carlos@ondaverificada.cl',
  phone: '+56 9 1234 5678',
  company: 'Medios Digitales Chile SpA',
  position: 'Director de Operaciones'
};

export async function GET() {
  try {
    return NextResponse.json(mockProfile);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos requeridos
    const requiredFields = ['fullName', 'email', 'phone', 'company', 'position'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    // Actualizar perfil
    mockProfile = { ...mockProfile, ...body };
    
    // Aquí iría la lógica para actualizar en la base de datos
    // await updateUserProfile(mockProfile.id, body);
    
    return NextResponse.json({ 
      message: 'Perfil actualizado exitosamente', 
      profile: mockProfile 
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
