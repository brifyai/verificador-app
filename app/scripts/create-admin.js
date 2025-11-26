// Script para crear un usuario administrador
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Datos del usuario administrador
    const adminData = {
      email: 'admin@ondaverificada.com',
      name: 'Administrador',
      password: await bcrypt.hash('admin123', 10), // Contraseña hasheada
      role: 'ADMIN',
      active: true
    };

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingUser) {
      console.log('El usuario administrador ya existe.');
      return;
    }

    // Crear el usuario administrador
    const user = await prisma.user.create({
      data: adminData
    });

    console.log('Usuario administrador creado exitosamente:');
    console.log(`Email: ${user.email}`);
    console.log(`Rol: ${user.role}`);
    console.log('Contraseña: admin123');
  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();