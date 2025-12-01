const jwt = require('jsonwebtoken');

// Usar el mismo secreto que el sistema
const JWT_SECRET = 'supersecret-key-for-nextauth-jwt-2024-verificador-app-secure';

// Usar los datos del usuario admin real de la base de datos
const adminUser = {
  id: 'admin-1764391733707',  // ID real del admin
  email: 'admin@ondaverificada.com',  // Email real del admin
  role: 'admin'
};

console.log('🎫 Generando token JWT para usuario admin real...');
console.log('Usuario:', adminUser);

const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '24h' });

console.log('\n✅ Token JWT generado exitosamente:');
console.log(token);
console.log('\n📋 Datos del token:');
console.log('- ID:', adminUser.id);
console.log('- Email:', adminUser.email);
console.log('- Rol:', adminUser.role);
console.log('- Expira en: 24 horas');

// Guardar el token en un archivo
const fs = require('fs');
const path = require('path');
const tokenFile = path.join(__dirname, 'admin-token.txt');
fs.writeFileSync(tokenFile, token);
console.log(`\n💾 Token guardado en: ${tokenFile}`);

console.log('\n🔄 Ahora puedes usar este token para las pruebas de API');