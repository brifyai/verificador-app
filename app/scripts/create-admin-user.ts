import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    console.log('🔐 Creando usuario administrador...');

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Crear usuario
    const user = await prisma.user.upsert({
      where: { email: 'radiomonitor@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Administrador',
      },
      create: {
        email: 'radiomonitor@gmail.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
      },
    });

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('   Email:', user.email);
    console.log('   Nombre:', user.name);
    console.log('   Rol:', user.role);
    console.log('   ID:', user.id);

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
