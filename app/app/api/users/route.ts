import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { DatabaseRole } from '@/lib/types'
import { supabaseDirect } from '@/lib/supabase-direct'

// Schema de validación para crear usuario
const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR'] as const)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = createUserSchema.parse(body)
    
    // Verificar si el email ya existe
    const existingUsers = await supabaseDirect.request(`users?select=*&email=eq.${validatedData.email}`)
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Crear usuario
    const userData = {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role as DatabaseRole,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const newUsers = await supabaseDirect.request('users', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Prefer': 'return=representation' }
    })

    const user = newUsers[0]
    
    // Transformar respuesta para que coincida con el formato esperado
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.created_at
    }
    
    return NextResponse.json(transformedUser, { status: 201 })
    
  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const users = await supabaseDirect.request('users?select=*&order=created_at.desc&limit=1000')
    
    // Transformar respuesta para que coincida con el formato esperado
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }))
    
    return NextResponse.json(transformedUsers)
    
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}