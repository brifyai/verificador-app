import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/permissions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar permisos de administrador
    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción. Solo los administradores pueden bloquear usuarios.' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        role: true
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // No permitir que un administrador se bloquee a sí mismo
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes bloquear tu propia cuenta' },
        { status: 400 }
      )
    }

    // Cambiar el estado del usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        active: !existingUser.active
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updatedAt: true
      }
    })

    const action = updatedUser.active ? 'desbloqueado' : 'bloqueado'
    
    console.log(`👤 Usuario ${action}: ${updatedUser.name} (${updatedUser.email}) por ${session.user.name}`)

    return NextResponse.json({
      success: true,
      message: `Usuario ${action} exitosamente`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error toggling user status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}