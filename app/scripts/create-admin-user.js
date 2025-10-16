const { prisma } = require('../lib/db');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🔐 Creando usuario administrador...');

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Crear usuario con todos los campos
    const user = await prisma.user.upsert({
      where: { email: 'radiomonitor@gmail.com' },
      update: {
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
      },
      create: {
        email: 'radiomonitor@gmail.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
      },
    });

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Nombre:', user.name);
    console.log('   Rol:', user.role);
    console.log('   Activo:', user.active);
    console.log('   Creado:', user.createdAt);
    console.log('   Actualizado:', user.updatedAt);

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
